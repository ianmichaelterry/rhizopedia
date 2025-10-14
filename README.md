# Rhizopedia - 3D Wikipedia Explorer

A Three.js-based 3D visualization that displays Wikipedia articles as floating 3D text in space. The main article title is centered with linked articles arranged in a circle around it.

## Features

- 🎲 Fetches random Wikipedia articles via API
- 🔗 Extracts and displays linked articles from the main content
- 🌌 Renders article titles as 3D text in an interactive space
- ⭕ Dynamic circular layout with intelligent spacing to prevent text overlap
- 🎮 Interactive 3D camera controls (orbit, zoom, pan)
- ⭐ Beautiful starfield background

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The application will open at `http://localhost:5173` (or another port if 5173 is busy).

## Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## How to Use

1. The application loads a random Wikipedia article on startup
2. The main article title appears in **orange** at the center
3. Linked articles appear in **blue** arranged in a circle
4. Use your mouse to:
   - **Left-click + drag** to rotate the view
   - **Right-click + drag** to pan
   - **Scroll** to zoom in/out
5. Click the **"Load New Article"** button to fetch a new random article

## Technology Stack

- **Three.js** - 3D rendering engine
- **Vite** - Build tool and dev server
- **Wikipedia API** - Article data source
- **Vanilla JavaScript** - ES modules

## Project Structure

```
rhizopedia/
├── index.html          # Entry HTML file
├── main.js            # Application entry point
├── scene.js           # Three.js scene management
├── wikipedia.js       # Wikipedia API integration
├── layout.js          # Circular layout algorithm
├── style.css          # Styles
├── package.json       # Dependencies
└── README.md          # Documentation
```

## API Usage

This project uses the Wikipedia API with CORS enabled. No API key is required.

## License

MIT
