// Cloudflare Worker for APV - A* Pathfinding Visualizer
// Handles static assets and AI-powered features

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Handle API routes
    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env, url);
    }

    // Let Cloudflare handle static assets
    return env.ASSETS.fetch(request);
  }
};

async function handleAPI(request, env, url) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    switch (url.pathname) {
      case '/api/explain-step':
        return await handleExplainStep(request, env, corsHeaders);

      case '/api/parse-problem':
        return await handleParseProblem(request, env, corsHeaders);

      case '/api/recommend-algorithm':
        return await handleRecommendAlgorithm(request, env, corsHeaders);

      case '/api/explain-algorithm':
        return await handleExplainAlgorithm(request, env, corsHeaders);

      default:
        return new Response(JSON.stringify({ error: 'Not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Explain a single algorithm step in natural language
async function handleExplainStep(request, env, corsHeaders) {
  const body = await request.json();
  const { algorithm, step, context } = body;

  const prompt = buildStepExplanationPrompt(algorithm, step, context);

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      {
        role: 'system',
        content: `You are an expert computer science tutor explaining pathfinding algorithms.
Give clear, concise explanations (2-3 sentences max) that help students understand what's happening at each step.
Use simple language and avoid jargon. Focus on the "why" behind each decision.`
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 150,
    temperature: 0.7
  });

  return new Response(JSON.stringify({
    explanation: response.response
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function buildStepExplanationPrompt(algorithm, step, context) {
  const algoNames = {
    astar: 'A*',
    dijkstra: "Dijkstra's",
    bfs: 'Breadth-First Search',
    dfs: 'Depth-First Search',
    greedy: 'Greedy Best-First'
  };

  const algoName = algoNames[algorithm] || algorithm;

  let prompt = `Explain this ${algoName} algorithm step:\n`;

  if (step.type === 'visit') {
    prompt += `Currently visiting node at position (${step.node.x}, ${step.node.y}).\n`;
    if (step.g !== undefined) prompt += `Cost from start (g): ${step.g}\n`;
    if (step.h !== undefined) prompt += `Estimated cost to goal (h): ${step.h}\n`;
    if (step.f !== undefined) prompt += `Total score (f = g + h): ${step.f}\n`;
  } else if (step.type === 'frontier') {
    prompt += `Adding node at (${step.node.x}, ${step.node.y}) to the frontier (nodes to explore).\n`;
  } else if (step.type === 'path') {
    prompt += `Path found! Length: ${step.path?.length || 'unknown'} nodes.\n`;
  } else if (step.type === 'no-path') {
    prompt += `No path exists between start and goal.\n`;
  }

  if (context) {
    prompt += `\nContext:\n`;
    if (context.start) prompt += `- Start: (${context.start.x}, ${context.start.y})\n`;
    if (context.end) prompt += `- Goal: (${context.end.x}, ${context.end.y})\n`;
    if (context.nodesVisited) prompt += `- Nodes visited so far: ${context.nodesVisited}\n`;
    if (context.obstacles && context.obstacles.length > 0) {
      prompt += `- There are ${context.obstacles.length} obstacles on the grid\n`;
    }
  }

  return prompt;
}

// Parse a natural language problem description into grid configuration
async function handleParseProblem(request, env, corsHeaders) {
  const body = await request.json();
  const { description, gridSize } = body;

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      {
        role: 'system',
        content: `You are a pathfinding problem parser. Convert natural language descriptions into JSON grid configurations.
Output ONLY valid JSON with this structure:
{
  "start": {"x": number, "y": number},
  "end": {"x": number, "y": number},
  "walls": [{"x": number, "y": number}, ...],
  "weights": [{"x": number, "y": number, "weight": number}, ...]
}
Grid is ${gridSize}x${gridSize}, coordinates are 0-indexed. Top-left is (0,0).
If positions aren't specified, use reasonable defaults. Keep walls reasonable (not blocking the entire path).
Output ONLY the JSON, no explanation.`
      },
      {
        role: 'user',
        content: description
      }
    ],
    max_tokens: 500,
    temperature: 0.3
  });

  // Try to parse the JSON response
  let config;
  try {
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = response.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      config = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (e) {
    // Return a default configuration if parsing fails
    config = {
      start: { x: 2, y: Math.floor(gridSize / 2) },
      end: { x: gridSize - 3, y: Math.floor(gridSize / 2) },
      walls: [],
      weights: [],
      parseError: true,
      rawResponse: response.response
    };
  }

  return new Response(JSON.stringify(config), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Recommend the best algorithm for a given scenario
async function handleRecommendAlgorithm(request, env, corsHeaders) {
  const body = await request.json();
  const { scenario, hasWeights, gridSize, obstacleCount } = body;

  const prompt = `Given a pathfinding scenario, recommend the best algorithm.

Scenario: ${scenario || 'General pathfinding'}
Grid size: ${gridSize}x${gridSize}
Has weighted cells: ${hasWeights ? 'Yes' : 'No'}
Number of obstacles: ${obstacleCount || 0}

Available algorithms:
1. A* - Best for most cases, uses heuristic, guarantees shortest path with weights
2. Dijkstra's - Guarantees shortest path, explores all directions equally, good when you need all shortest paths
3. BFS - Fast for unweighted grids, guarantees shortest path only without weights
4. DFS - Fast but doesn't guarantee shortest path, good for maze exploration
5. Greedy Best-First - Very fast but may not find shortest path, good for open spaces

Respond with JSON only:
{
  "recommended": "algorithm_name",
  "reason": "brief explanation (1-2 sentences)",
  "alternatives": ["alt1", "alt2"]
}`;

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      {
        role: 'system',
        content: 'You are a pathfinding algorithm expert. Respond only with valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    max_tokens: 200,
    temperature: 0.3
  });

  let recommendation;
  try {
    const jsonMatch = response.response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      recommendation = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found');
    }
  } catch (e) {
    // Default recommendation
    recommendation = {
      recommended: hasWeights ? 'astar' : 'bfs',
      reason: hasWeights
        ? 'A* is optimal for weighted grids with its heuristic guidance.'
        : 'BFS is efficient for unweighted grids and guarantees the shortest path.',
      alternatives: hasWeights ? ['dijkstra', 'greedy'] : ['astar', 'dijkstra']
    };
  }

  return new Response(JSON.stringify(recommendation), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Explain an algorithm in detail
async function handleExplainAlgorithm(request, env, corsHeaders) {
  const body = await request.json();
  const { algorithm } = body;

  const algoNames = {
    astar: 'A* Search',
    dijkstra: "Dijkstra's Algorithm",
    bfs: 'Breadth-First Search',
    dfs: 'Depth-First Search',
    greedy: 'Greedy Best-First Search'
  };

  const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      {
        role: 'system',
        content: `You are a friendly computer science tutor. Explain algorithms in simple terms with real-world analogies. Keep explanations concise but informative (3-4 sentences).`
      },
      {
        role: 'user',
        content: `Explain ${algoNames[algorithm] || algorithm} for pathfinding. Include: how it works, when to use it, and a simple real-world analogy.`
      }
    ],
    max_tokens: 250,
    temperature: 0.7
  });

  return new Response(JSON.stringify({
    algorithm: algorithm,
    explanation: response.response
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
