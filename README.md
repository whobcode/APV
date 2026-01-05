# A* Pathfinding Visualizer

**Category**: Web Frontend

An interactive web-based visualization of pathfinding algorithms with AI-generated step-by-step explanations.

## Features (Planned)
- Interactive grid-based pathfinding visualization
- Multiple algorithms (A*, Dijkstra, BFS, DFS)
- AI-generated explanations of each step
- Custom obstacle placement via click/drag
- Algorithm comparison mode
- Natural language problem input
- Speed controls and step-through mode

## Tech Stack
- React 18 + HTML Canvas/SVG
- Cloudflare Workers AI for explanations
- Framer Motion for animations
- Tailwind CSS for styling

## Getting Started

```bash
npm install
npm run dev
```

## Project Structure

```
APV/
├── src/
│   ├── algorithms/     # Pathfinding implementations
│   ├── components/     # React components
│   └── utils/          # Grid utilities
├── public/
└── package.json
```

## Algorithms Included
- A* (A-Star)
- Dijkstra's Algorithm
- Breadth-First Search (BFS)
- Depth-First Search (DFS)
- Greedy Best-First Search

## License

MIT
