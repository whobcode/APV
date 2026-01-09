// APV - Pathfinding Algorithms
// All pathfinding algorithms implemented as generator functions for step-by-step visualization

class PriorityQueue {
  constructor() {
    this.items = [];
  }

  enqueue(item, priority) {
    const element = { item, priority };
    let added = false;
    for (let i = 0; i < this.items.length; i++) {
      if (element.priority < this.items[i].priority) {
        this.items.splice(i, 0, element);
        added = true;
        break;
      }
    }
    if (!added) {
      this.items.push(element);
    }
  }

  dequeue() {
    return this.items.shift()?.item;
  }

  isEmpty() {
    return this.items.length === 0;
  }

  contains(predicate) {
    return this.items.some(el => predicate(el.item));
  }

  updatePriority(predicate, newPriority) {
    const index = this.items.findIndex(el => predicate(el.item));
    if (index !== -1) {
      const item = this.items[index].item;
      this.items.splice(index, 1);
      this.enqueue(item, newPriority);
    }
  }
}

// Heuristic functions
const Heuristics = {
  manhattan: (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
  euclidean: (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)),
  chebyshev: (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
};

// Algorithm metadata
const AlgorithmInfo = {
  astar: {
    name: 'A* Search',
    description: 'A* combines the best features of Dijkstra\'s and Greedy Best-First. It uses a heuristic to guide the search while still guaranteeing the shortest path.',
    guaranteesShortestPath: true,
    usesHeuristic: true,
    weighted: true
  },
  dijkstra: {
    name: 'Dijkstra\'s Algorithm',
    description: 'Explores all directions equally, guaranteeing the shortest path. More thorough but slower than A* for single-destination searches.',
    guaranteesShortestPath: true,
    usesHeuristic: false,
    weighted: true
  },
  bfs: {
    name: 'Breadth-First Search',
    description: 'Explores nodes level by level. Guarantees shortest path only in unweighted graphs. Simple and efficient for uniform-cost scenarios.',
    guaranteesShortestPath: true,
    usesHeuristic: false,
    weighted: false
  },
  dfs: {
    name: 'Depth-First Search',
    description: 'Explores as deep as possible before backtracking. Does NOT guarantee shortest path. Useful for maze solving and detecting connectivity.',
    guaranteesShortestPath: false,
    usesHeuristic: false,
    weighted: false
  },
  greedy: {
    name: 'Greedy Best-First',
    description: 'Always moves toward the goal using only the heuristic. Very fast but does not guarantee shortest path. Can get stuck in dead ends.',
    guaranteesShortestPath: false,
    usesHeuristic: true,
    weighted: false
  }
};

// A* Search Algorithm
function* astar(grid, start, end, getNeighbors, heuristic) {
  const openSet = new PriorityQueue();
  const closedSet = new Set();
  const gScore = new Map();
  const fScore = new Map();
  const cameFrom = new Map();

  const startKey = `${start.x},${start.y}`;
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(start, end));
  openSet.enqueue(start, fScore.get(startKey));

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue();
    const currentKey = `${current.x},${current.y}`;

    if (current.x === end.x && current.y === end.y) {
      // Reconstruct path
      const path = reconstructPath(cameFrom, current);
      yield { type: 'path', path };
      return path;
    }

    closedSet.add(currentKey);
    grid[current.y][current.x].visited = true;
    yield { type: 'visit', node: current };

    for (const neighbor of getNeighbors(current)) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (closedSet.has(neighborKey) || neighbor.wall) continue;

      const weight = neighbor.weight || 1;
      const tentativeG = (gScore.get(currentKey) || Infinity) + weight;

      if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
        cameFrom.set(neighborKey, current);
        gScore.set(neighborKey, tentativeG);
        const f = tentativeG + heuristic(neighbor, end);
        fScore.set(neighborKey, f);

        if (!openSet.contains(n => `${n.x},${n.y}` === neighborKey)) {
          openSet.enqueue(neighbor, f);
          grid[neighbor.y][neighbor.x].inFrontier = true;
          yield { type: 'frontier', node: neighbor };
        } else {
          openSet.updatePriority(n => `${n.x},${n.y}` === neighborKey, f);
        }
      }
    }
  }

  yield { type: 'no-path' };
  return null;
}

// Dijkstra's Algorithm
function* dijkstra(grid, start, end, getNeighbors, heuristic) {
  const openSet = new PriorityQueue();
  const closedSet = new Set();
  const distance = new Map();
  const cameFrom = new Map();

  const startKey = `${start.x},${start.y}`;
  distance.set(startKey, 0);
  openSet.enqueue(start, 0);

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue();
    const currentKey = `${current.x},${current.y}`;

    if (closedSet.has(currentKey)) continue;

    if (current.x === end.x && current.y === end.y) {
      const path = reconstructPath(cameFrom, current);
      yield { type: 'path', path };
      return path;
    }

    closedSet.add(currentKey);
    grid[current.y][current.x].visited = true;
    yield { type: 'visit', node: current };

    for (const neighbor of getNeighbors(current)) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (closedSet.has(neighborKey) || neighbor.wall) continue;

      const weight = neighbor.weight || 1;
      const tentativeDist = (distance.get(currentKey) || Infinity) + weight;

      if (tentativeDist < (distance.get(neighborKey) || Infinity)) {
        cameFrom.set(neighborKey, current);
        distance.set(neighborKey, tentativeDist);

        if (!openSet.contains(n => `${n.x},${n.y}` === neighborKey)) {
          openSet.enqueue(neighbor, tentativeDist);
          grid[neighbor.y][neighbor.x].inFrontier = true;
          yield { type: 'frontier', node: neighbor };
        } else {
          openSet.updatePriority(n => `${n.x},${n.y}` === neighborKey, tentativeDist);
        }
      }
    }
  }

  yield { type: 'no-path' };
  return null;
}

// Breadth-First Search
function* bfs(grid, start, end, getNeighbors, heuristic) {
  const queue = [start];
  const visited = new Set();
  const cameFrom = new Map();

  const startKey = `${start.x},${start.y}`;
  visited.add(startKey);

  while (queue.length > 0) {
    const current = queue.shift();
    const currentKey = `${current.x},${current.y}`;

    grid[current.y][current.x].visited = true;
    yield { type: 'visit', node: current };

    if (current.x === end.x && current.y === end.y) {
      const path = reconstructPath(cameFrom, current);
      yield { type: 'path', path };
      return path;
    }

    for (const neighbor of getNeighbors(current)) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (!visited.has(neighborKey) && !neighbor.wall) {
        visited.add(neighborKey);
        cameFrom.set(neighborKey, current);
        queue.push(neighbor);
        grid[neighbor.y][neighbor.x].inFrontier = true;
        yield { type: 'frontier', node: neighbor };
      }
    }
  }

  yield { type: 'no-path' };
  return null;
}

// Depth-First Search
function* dfs(grid, start, end, getNeighbors, heuristic) {
  const stack = [start];
  const visited = new Set();
  const cameFrom = new Map();

  while (stack.length > 0) {
    const current = stack.pop();
    const currentKey = `${current.x},${current.y}`;

    if (visited.has(currentKey)) continue;
    visited.add(currentKey);

    grid[current.y][current.x].visited = true;
    yield { type: 'visit', node: current };

    if (current.x === end.x && current.y === end.y) {
      const path = reconstructPath(cameFrom, current);
      yield { type: 'path', path };
      return path;
    }

    const neighbors = getNeighbors(current);
    // Reverse to maintain consistent exploration order
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const neighbor = neighbors[i];
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (!visited.has(neighborKey) && !neighbor.wall) {
        cameFrom.set(neighborKey, current);
        stack.push(neighbor);
        grid[neighbor.y][neighbor.x].inFrontier = true;
        yield { type: 'frontier', node: neighbor };
      }
    }
  }

  yield { type: 'no-path' };
  return null;
}

// Greedy Best-First Search
function* greedy(grid, start, end, getNeighbors, heuristic) {
  const openSet = new PriorityQueue();
  const closedSet = new Set();
  const cameFrom = new Map();

  openSet.enqueue(start, heuristic(start, end));

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue();
    const currentKey = `${current.x},${current.y}`;

    if (closedSet.has(currentKey)) continue;

    if (current.x === end.x && current.y === end.y) {
      const path = reconstructPath(cameFrom, current);
      yield { type: 'path', path };
      return path;
    }

    closedSet.add(currentKey);
    grid[current.y][current.x].visited = true;
    yield { type: 'visit', node: current };

    for (const neighbor of getNeighbors(current)) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;

      if (closedSet.has(neighborKey) || neighbor.wall) continue;

      if (!openSet.contains(n => `${n.x},${n.y}` === neighborKey)) {
        cameFrom.set(neighborKey, current);
        openSet.enqueue(neighbor, heuristic(neighbor, end));
        grid[neighbor.y][neighbor.x].inFrontier = true;
        yield { type: 'frontier', node: neighbor };
      }
    }
  }

  yield { type: 'no-path' };
  return null;
}

// Helper: Reconstruct path from cameFrom map
function reconstructPath(cameFrom, current) {
  const path = [current];
  let node = current;
  while (cameFrom.has(`${node.x},${node.y}`)) {
    node = cameFrom.get(`${node.x},${node.y}`);
    path.unshift(node);
  }
  return path;
}

// Algorithm registry
const Algorithms = {
  astar,
  dijkstra,
  bfs,
  dfs,
  greedy
};

// Export for use in other modules
window.Algorithms = Algorithms;
window.AlgorithmInfo = AlgorithmInfo;
window.Heuristics = Heuristics;
window.PriorityQueue = PriorityQueue;
window.reconstructPath = reconstructPath;
