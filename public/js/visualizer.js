// APV - Visualizer Module
// Handles algorithm execution, animation, and statistics

class Visualizer {
  constructor(grid) {
    this.grid = grid;
    this.algorithm = null;
    this.generator = null;
    this.isRunning = false;
    this.isPaused = false;
    this.speed = 50; // ms between steps
    this.nodesVisited = 0;
    this.pathLength = 0;
    this.startTime = 0;
    this.animationFrame = null;
    this.stepTimeout = null;

    // Custom algorithms storage
    this.customAlgorithms = this.loadCustomAlgorithms();

    // Callbacks
    this.onStatsUpdate = null;
    this.onComplete = null;
    this.onStatusChange = null;
  }

  setAlgorithm(name) {
    // Check built-in algorithms first
    if (window.Algorithms[name]) {
      this.algorithm = window.Algorithms[name];
    } else if (this.customAlgorithms[name]) {
      // Use custom algorithm
      try {
        this.algorithm = this.customAlgorithms[name].fn;
      } catch (e) {
        console.error('Error loading custom algorithm:', e);
        this.algorithm = window.Algorithms.astar;
      }
    } else {
      this.algorithm = window.Algorithms.astar;
    }
  }

  setSpeed(value) {
    // value is 1-100, map to delay (higher value = faster = lower delay)
    this.speed = Math.max(1, 101 - value);
  }

  async start() {
    if (this.isRunning && !this.isPaused) return;

    if (this.isPaused) {
      this.isPaused = false;
      this.updateStatus('Running');
      this.runStep();
      return;
    }

    // Reset visualization
    this.grid.clearVisualization();
    this.nodesVisited = 0;
    this.pathLength = 0;
    this.startTime = performance.now();

    // Get start and end nodes
    const start = this.grid.getNode(this.grid.start.x, this.grid.start.y);
    const end = this.grid.getNode(this.grid.end.x, this.grid.end.y);

    if (!start || !end) {
      this.updateStatus('Invalid start/end');
      return;
    }

    // Create generator
    this.generator = this.algorithm(
      this.grid.grid,
      start,
      end,
      (node) => this.grid.getNeighbors(node),
      window.Heuristics.manhattan
    );

    this.isRunning = true;
    this.isPaused = false;
    this.updateStatus('Running');
    this.runStep();
  }

  runStep() {
    if (!this.isRunning || this.isPaused) return;

    const result = this.generator.next();

    if (result.done) {
      this.complete(result.value);
      return;
    }

    const step = result.value;
    this.processStep(step);

    this.stepTimeout = setTimeout(() => this.runStep(), this.speed);
  }

  processStep(step) {
    switch (step.type) {
      case 'visit':
        this.nodesVisited++;
        this.grid.render();
        break;

      case 'frontier':
        this.grid.render();
        break;

      case 'path':
        this.pathLength = step.path.length;
        this.grid.markPath(step.path);
        break;

      case 'no-path':
        this.updateStatus('No path found');
        break;
    }

    this.updateStats();
  }

  step() {
    if (!this.generator) {
      // Start fresh
      this.grid.clearVisualization();
      this.nodesVisited = 0;
      this.pathLength = 0;
      this.startTime = performance.now();

      const start = this.grid.getNode(this.grid.start.x, this.grid.start.y);
      const end = this.grid.getNode(this.grid.end.x, this.grid.end.y);

      this.generator = this.algorithm(
        this.grid.grid,
        start,
        end,
        (node) => this.grid.getNeighbors(node),
        window.Heuristics.manhattan
      );

      this.isRunning = true;
      this.isPaused = true;
      this.updateStatus('Stepping');
    }

    const result = this.generator.next();

    if (result.done) {
      this.complete(result.value);
      return;
    }

    this.processStep(result.value);
  }

  pause() {
    if (!this.isRunning) return;

    this.isPaused = true;
    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }
    this.updateStatus('Paused');
  }

  reset() {
    this.stop();
    this.grid.clearVisualization();
    this.nodesVisited = 0;
    this.pathLength = 0;
    this.updateStats();
    this.updateStatus('Ready');
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.generator = null;

    if (this.stepTimeout) {
      clearTimeout(this.stepTimeout);
      this.stepTimeout = null;
    }

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  complete(path) {
    const elapsed = performance.now() - this.startTime;
    this.isRunning = false;
    this.generator = null;

    if (path) {
      this.pathLength = path.length;
      this.updateStatus(`Found path (${Math.round(elapsed)}ms)`);
    } else {
      this.updateStatus('No path exists');
    }

    this.updateStats();

    if (this.onComplete) {
      this.onComplete(path);
    }
  }

  updateStats() {
    if (this.onStatsUpdate) {
      const elapsed = this.isRunning ? performance.now() - this.startTime : 0;
      this.onStatsUpdate({
        nodesVisited: this.nodesVisited,
        pathLength: this.pathLength,
        timeElapsed: Math.round(elapsed)
      });
    }
  }

  updateStatus(status) {
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  // Custom algorithm management
  loadCustomAlgorithms() {
    try {
      const saved = localStorage.getItem('apv-custom-algorithms');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Re-create functions from stored code
        const algorithms = {};
        for (const [key, value] of Object.entries(parsed)) {
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('grid', 'start', 'end', 'getNeighbors', 'heuristic', `
              ${value.code}
              return search(grid, start, end, getNeighbors, heuristic);
            `);
            algorithms[key] = {
              ...value,
              fn: function*(grid, start, end, getNeighbors, heuristic) {
                yield* fn(grid, start, end, getNeighbors, heuristic);
              }
            };
          } catch (e) {
            console.error(`Error loading custom algorithm ${key}:`, e);
          }
        }
        return algorithms;
      }
    } catch (e) {
      console.error('Error loading custom algorithms:', e);
    }
    return {};
  }

  saveCustomAlgorithm(name, code, metadata) {
    const key = name.toLowerCase().replace(/\s+/g, '-');
    const algorithmData = {
      name,
      code,
      ...metadata
    };

    // Test the algorithm first
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function('grid', 'start', 'end', 'getNeighbors', 'heuristic', `
        ${code}
        return search(grid, start, end, getNeighbors, heuristic);
      `);

      this.customAlgorithms[key] = {
        ...algorithmData,
        fn: function*(grid, start, end, getNeighbors, heuristic) {
          yield* fn(grid, start, end, getNeighbors, heuristic);
        }
      };

      // Save to localStorage (without the function)
      const toSave = {};
      for (const [k, v] of Object.entries(this.customAlgorithms)) {
        toSave[k] = {
          name: v.name,
          code: v.code,
          description: v.description,
          optimal: v.optimal,
          usesHeuristic: v.usesHeuristic,
          weighted: v.weighted
        };
      }
      localStorage.setItem('apv-custom-algorithms', JSON.stringify(toSave));

      return { success: true, key };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  deleteCustomAlgorithm(key) {
    delete this.customAlgorithms[key];

    const toSave = {};
    for (const [k, v] of Object.entries(this.customAlgorithms)) {
      toSave[k] = {
        name: v.name,
        code: v.code,
        description: v.description,
        optimal: v.optimal,
        usesHeuristic: v.usesHeuristic,
        weighted: v.weighted
      };
    }
    localStorage.setItem('apv-custom-algorithms', JSON.stringify(toSave));
  }

  testAlgorithm(code) {
    try {
      // Create a small test grid
      const testGrid = [];
      for (let y = 0; y < 10; y++) {
        const row = [];
        for (let x = 0; x < 10; x++) {
          row.push({
            x, y,
            wall: false,
            weight: 1,
            visited: false,
            inFrontier: false
          });
        }
        testGrid.push(row);
      }

      const start = { x: 0, y: 0 };
      const end = { x: 9, y: 9 };

      const getNeighbors = (node) => {
        const neighbors = [];
        const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
        for (const dir of dirs) {
          const nx = node.x + dir.x;
          const ny = node.y + dir.y;
          if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
            neighbors.push(testGrid[ny][nx]);
          }
        }
        return neighbors;
      };

      const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

      // eslint-disable-next-line no-new-func
      const fn = new Function('grid', 'start', 'end', 'getNeighbors', 'heuristic', `
        ${code}
        return search(grid, start, end, getNeighbors, heuristic);
      `);

      const generator = fn(testGrid, start, end, getNeighbors, heuristic);
      let steps = 0;
      let result;

      while (steps < 1000) {
        result = generator.next();
        steps++;
        if (result.done) break;
      }

      if (steps >= 1000) {
        return { success: false, error: 'Algorithm did not complete within 1000 steps' };
      }

      return {
        success: true,
        message: `Algorithm completed in ${steps} steps. Path found: ${result.value ? 'Yes' : 'No'}`
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  getCustomAlgorithmsList() {
    return Object.entries(this.customAlgorithms).map(([key, value]) => ({
      key,
      name: value.name,
      description: value.description
    }));
  }
}

// Export
window.Visualizer = Visualizer;
