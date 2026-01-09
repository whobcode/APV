// APV - Grid Management Module
// Handles grid state, rendering, and user interactions

class Grid {
  constructor(canvas, size = 30) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.size = size;
    this.cellSize = 0;
    this.grid = [];
    this.start = { x: 5, y: Math.floor(size / 2) };
    this.end = { x: size - 6, y: Math.floor(size / 2) };
    this.isDrawing = false;
    this.drawMode = 'wall';
    this.isDraggingStart = false;
    this.isDraggingEnd = false;

    // Colors
    this.colors = {
      empty: '#1a1a2e',
      grid: '#2a2a4a',
      wall: '#2d2d44',
      weight: '#ffd93d',
      start: '#00ff88',
      end: '#ff6b6b',
      visited: '#4a69bd',
      frontier: '#78e08f',
      path: '#ffd93d'
    };

    this.init();
    this.setupEventListeners();
  }

  init() {
    this.resize();
    this.resetGrid();
    this.render();
  }

  resize() {
    const container = this.canvas.parentElement;
    const maxSize = Math.min(container.clientWidth - 32, container.clientHeight - 32);
    this.canvas.width = maxSize;
    this.canvas.height = maxSize;
    this.cellSize = maxSize / this.size;
    this.render();
  }

  setSize(newSize) {
    this.size = newSize;
    // Adjust start/end positions
    this.start = { x: Math.min(5, newSize - 1), y: Math.floor(newSize / 2) };
    this.end = { x: Math.max(newSize - 6, 0), y: Math.floor(newSize / 2) };
    this.resetGrid();
    this.resize();
  }

  resetGrid() {
    this.grid = [];
    for (let y = 0; y < this.size; y++) {
      const row = [];
      for (let x = 0; x < this.size; x++) {
        row.push({
          x,
          y,
          wall: false,
          weight: 1,
          visited: false,
          inFrontier: false,
          inPath: false
        });
      }
      this.grid.push(row);
    }
  }

  clearVisualization() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        this.grid[y][x].visited = false;
        this.grid[y][x].inFrontier = false;
        this.grid[y][x].inPath = false;
      }
    }
    this.render();
  }

  clearWalls() {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        this.grid[y][x].wall = false;
        this.grid[y][x].weight = 1;
      }
    }
    this.render();
  }

  getNode(x, y) {
    if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
      return this.grid[y][x];
    }
    return null;
  }

  getNeighbors(node) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // up
      { x: 1, y: 0 },  // right
      { x: 0, y: 1 },  // down
      { x: -1, y: 0 }  // left
    ];

    for (const dir of directions) {
      const nx = node.x + dir.x;
      const ny = node.y + dir.y;
      const neighbor = this.getNode(nx, ny);
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }

    return neighbors;
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

    // Touch support
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseDown(touch);
    });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      this.handleMouseMove(touch);
    });
    this.canvas.addEventListener('touchend', () => this.handleMouseUp());

    // Handle window resize
    window.addEventListener('resize', () => this.resize());
  }

  getCellFromEvent(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.cellSize);
    const y = Math.floor((e.clientY - rect.top) / this.cellSize);
    return { x, y };
  }

  handleMouseDown(e) {
    const cell = this.getCellFromEvent(e);

    // Check if clicking on start or end
    if (cell.x === this.start.x && cell.y === this.start.y) {
      this.isDraggingStart = true;
      return;
    }
    if (cell.x === this.end.x && cell.y === this.end.y) {
      this.isDraggingEnd = true;
      return;
    }

    this.isDrawing = true;
    this.applyDrawMode(cell);
  }

  handleMouseMove(e) {
    const cell = this.getCellFromEvent(e);

    if (this.isDraggingStart) {
      if (this.isValidCell(cell) && !(cell.x === this.end.x && cell.y === this.end.y)) {
        this.start = { x: cell.x, y: cell.y };
        this.render();
      }
      return;
    }

    if (this.isDraggingEnd) {
      if (this.isValidCell(cell) && !(cell.x === this.start.x && cell.y === this.start.y)) {
        this.end = { x: cell.x, y: cell.y };
        this.render();
      }
      return;
    }

    if (this.isDrawing) {
      this.applyDrawMode(cell);
    }
  }

  handleMouseUp() {
    this.isDrawing = false;
    this.isDraggingStart = false;
    this.isDraggingEnd = false;
  }

  isValidCell(cell) {
    return cell.x >= 0 && cell.x < this.size && cell.y >= 0 && cell.y < this.size;
  }

  applyDrawMode(cell) {
    if (!this.isValidCell(cell)) return;
    if (cell.x === this.start.x && cell.y === this.start.y) return;
    if (cell.x === this.end.x && cell.y === this.end.y) return;

    const node = this.grid[cell.y][cell.x];

    switch (this.drawMode) {
      case 'wall':
        node.wall = !node.wall;
        node.weight = 1;
        break;
      case 'weight':
        if (!node.wall) {
          node.weight = node.weight === 5 ? 1 : 5;
        }
        break;
      case 'start':
        this.start = { x: cell.x, y: cell.y };
        break;
      case 'end':
        this.end = { x: cell.x, y: cell.y };
        break;
    }

    this.render();
  }

  setDrawMode(mode) {
    this.drawMode = mode;
  }

  render() {
    const ctx = this.ctx;
    const cellSize = this.cellSize;

    // Clear canvas
    ctx.fillStyle = this.colors.empty;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw cells
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const node = this.grid[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        // Determine cell color
        let color = this.colors.empty;

        if (node.wall) {
          color = this.colors.wall;
        } else if (node.weight > 1) {
          color = this.colors.weight;
        } else if (node.inPath) {
          color = this.colors.path;
        } else if (node.visited) {
          color = this.colors.visited;
        } else if (node.inFrontier) {
          color = this.colors.frontier;
        }

        // Draw cell
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize - 2);

        // Draw weight indicator
        if (node.weight > 1 && !node.wall) {
          ctx.fillStyle = '#000';
          ctx.font = `${cellSize * 0.4}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('5', px + cellSize / 2, py + cellSize / 2);
        }
      }
    }

    // Draw start
    this.drawSpecialNode(this.start.x, this.start.y, this.colors.start, 'S');

    // Draw end
    this.drawSpecialNode(this.end.x, this.end.y, this.colors.end, 'E');

    // Draw grid lines
    ctx.strokeStyle = this.colors.grid;
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.size; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, this.canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(this.canvas.width, i * cellSize);
      ctx.stroke();
    }
  }

  drawSpecialNode(x, y, color, label) {
    const ctx = this.ctx;
    const cellSize = this.cellSize;
    const px = x * cellSize;
    const py = y * cellSize;
    const padding = 2;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(px + padding, py + padding, cellSize - padding * 2, cellSize - padding * 2, 4);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.font = `bold ${cellSize * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, px + cellSize / 2, py + cellSize / 2);
  }

  markPath(path) {
    for (const node of path) {
      if (!(node.x === this.start.x && node.y === this.start.y) &&
          !(node.x === this.end.x && node.y === this.end.y)) {
        this.grid[node.y][node.x].inPath = true;
      }
    }
    this.render();
  }

  // Maze generation algorithms
  generateRandomMaze(density = 0.3) {
    this.resetGrid();
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (!(x === this.start.x && y === this.start.y) &&
            !(x === this.end.x && y === this.end.y)) {
          if (Math.random() < density) {
            this.grid[y][x].wall = true;
          }
        }
      }
    }
    this.render();
  }

  generateRecursiveMaze() {
    this.resetGrid();

    // Fill with walls
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        this.grid[y][x].wall = true;
      }
    }

    // Recursive division
    this.divideMaze(0, 0, this.size, this.size, this.chooseOrientation(this.size, this.size));

    // Clear start and end
    this.grid[this.start.y][this.start.x].wall = false;
    this.grid[this.end.y][this.end.x].wall = false;

    // Ensure path from start area
    this.clearArea(this.start.x, this.start.y, 2);
    this.clearArea(this.end.x, this.end.y, 2);

    this.render();
  }

  clearArea(cx, cy, radius) {
    for (let y = cy - radius; y <= cy + radius; y++) {
      for (let x = cx - radius; x <= cx + radius; x++) {
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
          this.grid[y][x].wall = false;
        }
      }
    }
  }

  chooseOrientation(width, height) {
    if (width < height) return 'horizontal';
    if (height < width) return 'vertical';
    return Math.random() < 0.5 ? 'horizontal' : 'vertical';
  }

  divideMaze(x, y, width, height, orientation) {
    if (width < 4 || height < 4) return;

    const horizontal = orientation === 'horizontal';

    // Where to draw the wall
    let wx = x + (horizontal ? 0 : Math.floor(Math.random() * (width - 2)));
    let wy = y + (horizontal ? Math.floor(Math.random() * (height - 2)) : 0);

    // Where to put the passage
    const px = wx + (horizontal ? Math.floor(Math.random() * width) : 0);
    const py = wy + (horizontal ? 0 : Math.floor(Math.random() * height));

    // Direction to draw
    const dx = horizontal ? 1 : 0;
    const dy = horizontal ? 0 : 1;

    // Length of wall
    const length = horizontal ? width : height;

    // Draw wall
    for (let i = 0; i < length; i++) {
      const cx = wx + dx * i;
      const cy = wy + dy * i;
      if (cx !== px || cy !== py) {
        if (cx >= 0 && cx < this.size && cy >= 0 && cy < this.size) {
          this.grid[cy][cx].wall = false;
        }
      }
    }

    // Recurse
    let nx = x;
    let ny = y;
    let w = horizontal ? width : wx - x + 1;
    let h = horizontal ? wy - y + 1 : height;
    this.divideMaze(nx, ny, w, h, this.chooseOrientation(w, h));

    nx = horizontal ? x : wx + 1;
    ny = horizontal ? wy + 1 : y;
    w = horizontal ? width : x + width - wx - 1;
    h = horizontal ? y + height - wy - 1 : height;
    this.divideMaze(nx, ny, w, h, this.chooseOrientation(w, h));
  }
}

// Export
window.Grid = Grid;
