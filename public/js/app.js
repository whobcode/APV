// APV - Main Application
// Initializes the app and handles UI interactions

document.addEventListener('DOMContentLoaded', () => {
  // Initialize grid, visualizer, and AI assistant
  const canvas = document.getElementById('grid-canvas');
  const grid = new Grid(canvas, 30);
  const visualizer = new Visualizer(grid);
  const ai = new AIAssistant();

  // Set default algorithm
  visualizer.setAlgorithm('astar');

  // Current algorithm for AI context
  let currentAlgorithm = 'astar';

  // UI Elements
  const elements = {
    // Navigation
    navBtns: document.querySelectorAll('.nav-btn'),
    pages: document.querySelectorAll('.page'),

    // Controls
    algorithmSelect: document.getElementById('algorithm-select'),
    speedSlider: document.getElementById('speed-slider'),
    speedValue: document.getElementById('speed-value'),
    gridSize: document.getElementById('grid-size'),

    // Buttons
    startBtn: document.getElementById('start-btn'),
    pauseBtn: document.getElementById('pause-btn'),
    stepBtn: document.getElementById('step-btn'),
    resetBtn: document.getElementById('reset-btn'),
    clearWallsBtn: document.getElementById('clear-walls-btn'),

    // Draw mode
    drawBtns: document.querySelectorAll('.draw-btn'),

    // Maze generation
    mazeRecursive: document.getElementById('maze-recursive'),
    mazeRandom: document.getElementById('maze-random'),

    // Stats
    nodesVisited: document.getElementById('nodes-visited'),
    pathLength: document.getElementById('path-length'),
    timeElapsed: document.getElementById('time-elapsed'),
    status: document.getElementById('status'),

    // Info panel
    algoTitle: document.getElementById('algo-title'),
    algoDescription: document.getElementById('algo-description'),
    guaranteesShortest: document.getElementById('guarantees-shortest'),
    usesHeuristic: document.getElementById('uses-heuristic'),
    weighted: document.getElementById('weighted'),

    // AI elements
    aiExplanationsToggle: document.getElementById('ai-explanations-toggle'),
    aiExplanationContent: document.getElementById('ai-explanation-content'),
    aiLoading: document.getElementById('ai-loading'),
    aiRecommendBtn: document.getElementById('ai-recommend-btn'),
    aiRecommendationPanel: document.getElementById('ai-recommendation-panel'),
    aiProblemInput: document.getElementById('ai-problem-input'),
    aiParseBtn: document.getElementById('ai-parse-btn'),
    aiExplainBtns: document.querySelectorAll('.ai-explain-btn'),
    aiModal: document.getElementById('ai-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalBody: document.getElementById('modal-body'),
    modalClose: document.querySelector('.modal-close'),

    // Algorithms page
    tryBtns: document.querySelectorAll('.try-btn'),

    // Add algorithm page
    newAlgoName: document.getElementById('new-algo-name'),
    newAlgoDescription: document.getElementById('new-algo-description'),
    newAlgoOptimal: document.getElementById('new-algo-optimal'),
    newAlgoHeuristic: document.getElementById('new-algo-heuristic'),
    newAlgoWeighted: document.getElementById('new-algo-weighted'),
    algorithmCode: document.getElementById('algorithm-code'),
    testAlgorithm: document.getElementById('test-algorithm'),
    saveAlgorithm: document.getElementById('save-algorithm'),
    testOutput: document.getElementById('test-output'),
    testResult: document.getElementById('test-result'),
    customAlgorithmsList: document.getElementById('custom-algorithms-list')
  };

  // Navigation
  elements.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;

      elements.navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      elements.pages.forEach(p => {
        p.classList.remove('active');
        if (p.id === `${page}-page`) {
          p.classList.add('active');
        }
      });

      // Resize grid when switching to visualizer
      if (page === 'visualizer') {
        setTimeout(() => grid.resize(), 100);
      }
    });
  });

  // Algorithm selection
  elements.algorithmSelect.addEventListener('change', (e) => {
    const algo = e.target.value;
    currentAlgorithm = algo;
    visualizer.setAlgorithm(algo);
    updateAlgorithmInfo(algo);
    visualizer.reset();
    AIUIHelper.hideRecommendation();
  });

  // Speed slider
  elements.speedSlider.addEventListener('input', (e) => {
    const value = parseInt(e.target.value);
    visualizer.setSpeed(value);
    const delay = Math.max(1, 101 - value);
    elements.speedValue.textContent = `${delay}ms`;
  });

  // Grid size
  elements.gridSize.addEventListener('change', (e) => {
    const size = parseInt(e.target.value);
    grid.setSize(size);
    visualizer.reset();
  });

  // Control buttons
  elements.startBtn.addEventListener('click', () => {
    visualizer.start();
    elements.startBtn.disabled = true;
    elements.pauseBtn.disabled = false;
    elements.stepBtn.disabled = true;
  });

  elements.pauseBtn.addEventListener('click', () => {
    if (visualizer.isPaused) {
      visualizer.start();
      elements.pauseBtn.textContent = 'Pause';
    } else {
      visualizer.pause();
      elements.pauseBtn.textContent = 'Resume';
      elements.stepBtn.disabled = false;
    }
  });

  elements.stepBtn.addEventListener('click', () => {
    visualizer.step();
    elements.pauseBtn.disabled = false;
    elements.pauseBtn.textContent = 'Resume';
  });

  elements.resetBtn.addEventListener('click', () => {
    visualizer.reset();
    resetControlState();
    resetAIExplanation();
  });

  elements.clearWallsBtn.addEventListener('click', () => {
    grid.clearWalls();
    visualizer.reset();
    resetControlState();
  });

  function resetControlState() {
    elements.startBtn.disabled = false;
    elements.pauseBtn.disabled = true;
    elements.pauseBtn.textContent = 'Pause';
    elements.stepBtn.disabled = false;
  }

  function resetAIExplanation() {
    if (elements.aiExplanationContent) {
      elements.aiExplanationContent.innerHTML = '<p class="ai-placeholder">Enable AI explanations and run the algorithm to see step-by-step explanations here.</p>';
    }
  }

  // Draw mode buttons
  elements.drawBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.drawBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      grid.setDrawMode(btn.dataset.mode);
    });
  });

  // Maze generation
  elements.mazeRecursive.addEventListener('click', () => {
    grid.generateRecursiveMaze();
    visualizer.reset();
    resetControlState();
  });

  elements.mazeRandom.addEventListener('click', () => {
    grid.generateRandomMaze(0.3);
    visualizer.reset();
    resetControlState();
  });

  // Stats updates with AI explanations
  visualizer.onStatsUpdate = (stats) => {
    elements.nodesVisited.textContent = stats.nodesVisited;
    elements.pathLength.textContent = stats.pathLength;
    elements.timeElapsed.textContent = `${stats.timeElapsed}ms`;
  };

  visualizer.onStatusChange = (status) => {
    elements.status.textContent = status;
  };

  visualizer.onComplete = () => {
    resetControlState();
  };

  // Hook into visualizer to get step notifications for AI
  const originalProcessStep = visualizer.processStep.bind(visualizer);
  visualizer.processStep = function(step) {
    originalProcessStep(step);

    // Request AI explanation if enabled
    if (ai.isEnabled && (step.type === 'visit' || step.type === 'path' || step.type === 'no-path')) {
      const context = {
        start: grid.start,
        end: grid.end,
        nodesVisited: visualizer.nodesVisited
      };

      AIUIHelper.showLoading('ai-loading');
      elements.aiExplanationContent.style.opacity = '0.5';

      ai.explainStep(currentAlgorithm, step, context).then(explanation => {
        AIUIHelper.hideLoading('ai-loading');
        elements.aiExplanationContent.style.opacity = '1';

        if (explanation) {
          AIUIHelper.setExplanation(explanation);
        }
      });
    }
  };

  // AI Toggle
  if (elements.aiExplanationsToggle) {
    elements.aiExplanationsToggle.addEventListener('change', (e) => {
      ai.setEnabled(e.target.checked);
      if (e.target.checked) {
        elements.aiExplanationContent.innerHTML = '<p class="ai-placeholder">AI explanations enabled. Start the algorithm to see explanations.</p>';
      } else {
        resetAIExplanation();
      }
    });
  }

  // AI Recommend Button
  if (elements.aiRecommendBtn) {
    elements.aiRecommendBtn.addEventListener('click', async () => {
      elements.aiRecommendBtn.disabled = true;
      elements.aiRecommendBtn.textContent = 'Thinking...';

      // Count obstacles and check for weights
      let obstacleCount = 0;
      let hasWeights = false;
      for (let y = 0; y < grid.size; y++) {
        for (let x = 0; x < grid.size; x++) {
          if (grid.grid[y][x].wall) obstacleCount++;
          if (grid.grid[y][x].weight > 1) hasWeights = true;
        }
      }

      const recommendation = await ai.getRecommendation(
        'Find shortest path on grid',
        hasWeights,
        grid.size,
        obstacleCount
      );

      elements.aiRecommendBtn.disabled = false;
      elements.aiRecommendBtn.textContent = 'AI Suggest';

      if (recommendation) {
        AIUIHelper.showRecommendation(recommendation);
      }
    });
  }

  // AI Problem Parse Button
  if (elements.aiParseBtn) {
    elements.aiParseBtn.addEventListener('click', async () => {
      const description = elements.aiProblemInput.value.trim();
      if (!description) {
        alert('Please enter a problem description');
        return;
      }

      elements.aiParseBtn.disabled = true;
      elements.aiParseBtn.textContent = 'Generating...';

      const config = await ai.parseProblem(description, grid.size);

      elements.aiParseBtn.disabled = false;
      elements.aiParseBtn.textContent = 'Generate from Description';

      if (config) {
        // Apply configuration to grid
        grid.resetGrid();

        // Set start position
        if (config.start) {
          grid.start = {
            x: Math.min(Math.max(0, config.start.x), grid.size - 1),
            y: Math.min(Math.max(0, config.start.y), grid.size - 1)
          };
        }

        // Set end position
        if (config.end) {
          grid.end = {
            x: Math.min(Math.max(0, config.end.x), grid.size - 1),
            y: Math.min(Math.max(0, config.end.y), grid.size - 1)
          };
        }

        // Add walls
        if (config.walls && Array.isArray(config.walls)) {
          for (const wall of config.walls) {
            const x = Math.min(Math.max(0, wall.x), grid.size - 1);
            const y = Math.min(Math.max(0, wall.y), grid.size - 1);
            // Don't place walls on start or end
            if (!(x === grid.start.x && y === grid.start.y) &&
                !(x === grid.end.x && y === grid.end.y)) {
              grid.grid[y][x].wall = true;
            }
          }
        }

        // Add weights
        if (config.weights && Array.isArray(config.weights)) {
          for (const w of config.weights) {
            const x = Math.min(Math.max(0, w.x), grid.size - 1);
            const y = Math.min(Math.max(0, w.y), grid.size - 1);
            if (!grid.grid[y][x].wall) {
              grid.grid[y][x].weight = w.weight || 5;
            }
          }
        }

        grid.render();
        visualizer.reset();
        resetControlState();

        if (config.parseError) {
          console.warn('AI parsing had issues, applied default configuration');
        }
      }
    });
  }

  // AI Explain Buttons on Algorithms Page
  elements.aiExplainBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const algo = btn.dataset.algo;
      const algoNames = {
        astar: 'A* Search',
        dijkstra: "Dijkstra's Algorithm",
        bfs: 'Breadth-First Search',
        dfs: 'Depth-First Search',
        greedy: 'Greedy Best-First'
      };

      AIUIHelper.showModal(`AI Explanation: ${algoNames[algo] || algo}`, '');
      AIUIHelper.showModalLoading();

      const result = await ai.explainAlgorithm(algo);

      if (result && result.explanation) {
        document.getElementById('modal-body').innerHTML = `<p>${result.explanation}</p>`;
      } else {
        document.getElementById('modal-body').innerHTML = '<p>Unable to generate explanation. Please try again.</p>';
      }
    });
  });

  // Modal Close
  if (elements.modalClose) {
    elements.modalClose.addEventListener('click', () => {
      AIUIHelper.hideModal();
    });
  }

  // Close modal on background click
  if (elements.aiModal) {
    elements.aiModal.addEventListener('click', (e) => {
      if (e.target === elements.aiModal) {
        AIUIHelper.hideModal();
      }
    });
  }

  // Update algorithm info panel
  function updateAlgorithmInfo(algo) {
    const info = window.AlgorithmInfo[algo];
    if (info) {
      elements.algoTitle.textContent = info.name;
      elements.algoDescription.textContent = info.description;

      elements.guaranteesShortest.textContent = info.guaranteesShortestPath ? 'Yes' : 'No';
      elements.guaranteesShortest.className = `property-value ${info.guaranteesShortestPath ? 'yes' : 'no'}`;

      elements.usesHeuristic.textContent = info.usesHeuristic ? 'Yes' : 'No';
      elements.usesHeuristic.className = `property-value ${info.usesHeuristic ? 'yes' : 'no'}`;

      elements.weighted.textContent = info.weighted ? 'Yes' : 'No';
      elements.weighted.className = `property-value ${info.weighted ? 'yes' : 'no'}`;
    }
  }

  // Try algorithm buttons on algorithms page
  elements.tryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const algo = btn.dataset.algo;

      // Switch to visualizer page
      elements.navBtns.forEach(b => b.classList.remove('active'));
      elements.navBtns[0].classList.add('active');

      elements.pages.forEach(p => {
        p.classList.remove('active');
        if (p.id === 'visualizer-page') {
          p.classList.add('active');
        }
      });

      // Set algorithm
      currentAlgorithm = algo;
      elements.algorithmSelect.value = algo;
      visualizer.setAlgorithm(algo);
      updateAlgorithmInfo(algo);
      visualizer.reset();

      setTimeout(() => grid.resize(), 100);
    });
  });

  // Add Algorithm Page
  elements.testAlgorithm.addEventListener('click', () => {
    const code = elements.algorithmCode.value;
    const result = visualizer.testAlgorithm(code);

    elements.testOutput.classList.remove('hidden');

    if (result.success) {
      elements.testResult.textContent = `SUCCESS: ${result.message}`;
      elements.testResult.style.color = '#00ff88';
    } else {
      elements.testResult.textContent = `ERROR: ${result.error}`;
      elements.testResult.style.color = '#ff6b6b';
    }
  });

  elements.saveAlgorithm.addEventListener('click', () => {
    const name = elements.newAlgoName.value.trim();
    const code = elements.algorithmCode.value;

    if (!name) {
      alert('Please enter an algorithm name');
      return;
    }

    const metadata = {
      description: elements.newAlgoDescription.value,
      optimal: elements.newAlgoOptimal.checked,
      usesHeuristic: elements.newAlgoHeuristic.checked,
      weighted: elements.newAlgoWeighted.checked
    };

    const result = visualizer.saveCustomAlgorithm(name, code, metadata);

    if (result.success) {
      // Add to algorithm select dropdown
      updateCustomAlgorithmsSelect();
      updateCustomAlgorithmsList();

      // Clear form
      elements.newAlgoName.value = '';
      elements.newAlgoDescription.value = '';
      elements.newAlgoOptimal.checked = false;
      elements.newAlgoHeuristic.checked = false;
      elements.newAlgoWeighted.checked = false;

      alert(`Algorithm "${name}" saved successfully!`);
    } else {
      alert(`Error saving algorithm: ${result.error}`);
    }
  });

  function updateCustomAlgorithmsSelect() {
    // Remove existing custom options
    const existingCustom = elements.algorithmSelect.querySelectorAll('option[data-custom="true"]');
    existingCustom.forEach(opt => opt.remove());

    // Add custom algorithms
    const customAlgos = visualizer.getCustomAlgorithmsList();
    for (const algo of customAlgos) {
      const option = document.createElement('option');
      option.value = algo.key;
      option.textContent = `${algo.name} (Custom)`;
      option.dataset.custom = 'true';
      elements.algorithmSelect.appendChild(option);
    }
  }

  function updateCustomAlgorithmsList() {
    const customAlgos = visualizer.getCustomAlgorithmsList();

    if (customAlgos.length === 0) {
      elements.customAlgorithmsList.innerHTML = '<p class="empty-message">No custom algorithms saved yet.</p>';
      return;
    }

    elements.customAlgorithmsList.innerHTML = customAlgos.map(algo => `
      <div class="custom-algo-item">
        <span>${algo.name}</span>
        <div class="actions">
          <button class="btn btn-small btn-primary use-algo-btn" data-key="${algo.key}">Use</button>
          <button class="btn btn-small btn-danger delete-algo-btn" data-key="${algo.key}">Delete</button>
        </div>
      </div>
    `).join('');

    // Add event listeners
    elements.customAlgorithmsList.querySelectorAll('.use-algo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;

        // Switch to visualizer
        elements.navBtns.forEach(b => b.classList.remove('active'));
        elements.navBtns[0].classList.add('active');

        elements.pages.forEach(p => {
          p.classList.remove('active');
          if (p.id === 'visualizer-page') {
            p.classList.add('active');
          }
        });

        // Set algorithm
        currentAlgorithm = key;
        elements.algorithmSelect.value = key;
        visualizer.setAlgorithm(key);
        visualizer.reset();

        setTimeout(() => grid.resize(), 100);
      });
    });

    elements.customAlgorithmsList.querySelectorAll('.delete-algo-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (confirm('Are you sure you want to delete this algorithm?')) {
          visualizer.deleteCustomAlgorithm(key);
          updateCustomAlgorithmsSelect();
          updateCustomAlgorithmsList();
        }
      });
    });
  }

  // Initialize
  updateAlgorithmInfo('astar');
  updateCustomAlgorithmsSelect();
  updateCustomAlgorithmsList();

  // Handle window resize
  window.addEventListener('resize', () => {
    if (document.getElementById('visualizer-page').classList.contains('active')) {
      grid.resize();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Only handle if visualizer page is active
    if (!document.getElementById('visualizer-page').classList.contains('active')) return;

    // Don't handle if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case ' ':
        e.preventDefault();
        if (visualizer.isRunning && !visualizer.isPaused) {
          elements.pauseBtn.click();
        } else {
          elements.startBtn.click();
        }
        break;
      case 's':
        elements.stepBtn.click();
        break;
      case 'r':
        elements.resetBtn.click();
        break;
      case 'c':
        elements.clearWallsBtn.click();
        break;
      case '1':
        setDrawMode('wall');
        break;
      case '2':
        setDrawMode('start');
        break;
      case '3':
        setDrawMode('end');
        break;
      case '4':
        setDrawMode('weight');
        break;
      case 'Escape':
        AIUIHelper.hideModal();
        break;
    }
  });

  function setDrawMode(mode) {
    elements.drawBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });
    grid.setDrawMode(mode);
  }

  // Initial resize
  setTimeout(() => grid.resize(), 100);
});
