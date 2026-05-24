# ConvoGlass 🎙️💻🎨

## Next-Gen AI-Powered Mock Interview Platform

ConvoGlass is an interactive, AI-driven interview practice platform built with **Next.js (App Router)**, **TypeScript**, and **Vanilla CSS**. It simulates realistic engineering interviews across **technical coding**, **system design whiteboarding**, and **HR/behavioral rounds**.

The platform leverages browser-based conversational intelligence (speech synthesis and real-time speech analytics) combined with interactive sandboxes to evaluate a candidate's readiness and generate personalized learning roadmaps.

---

## 🚀 Key Features

### 1. Conversational AI Interviewers
*   **Speech Intelligence**: Continuous speech-to-text transcription tracking pace (WPM), filler words (*"um"*, *"like"*, *"basically"*), and conversational confidence.
*   **Text-to-Speech (TTS)**: Voice output that speaks questions and follow-ups out loud using browser-native speech synthesis, matching distinct interviewer personas.
*   **Adaptive Conversations**: Resume-aware greetings and contextual prompt generation dynamically tailoring questions to the candidate's work history.

### 2. Live Technical Sandbox
*   **Monaco Editor Integration**: Fully embedded VS Code-like coding workspace matching target language themes (JavaScript, Python).
*   **Client-Side Compiler**: Runs code against problem test cases directly in the browser's sandbox using a dynamic execution runner.
*   **Log Capturer**: Redirects console streams to display standard inputs/outputs in real-time execution logs.

### 3. System Design Whiteboard
*   **Vector Drawing Board**: Custom HTML5 2D canvas drawing board allowing candidates to drag and place servers, databases, and client cloud blocks.
*   **Dynamic Connectors**: Vector arrow connection tracing that links nodes and dynamically updates its positioning as objects are dragged across the canvas.
*   **Whiteboard Operations**: Double-click rename tools, canvas clear commands, and deletion handlers.

### 4. Interactive Feedback Dashboard
*   **Detailed Scorecard Reports**: Performance audit grading algorithmic complexity, STAR communication structure, system thinking, and custom path roadmaps.
*   **Performance Tracking**: Responsive Chart.js score trendlines and scatter speech analytics plots displaying performance trajectories.
*   **Webcam Simulation**: Live video capture checking posture and body language simulation.

---

## 📁 Project Architecture & Directory Layout

```text
convo-glass/
├── public/                  # Static assets and favicons
└── src/
    ├── app/
    │   ├── globals.css      # Core Vanilla CSS design tokens & animations
    │   ├── layout.tsx       # Root layout, HTML head headers & Outfit/Inter fonts
    │   ├── page.tsx         # Landing page and interactive audio mini-teaser
    │   └── workspace/
    │       └── page.tsx     # Workspace page (dashboard, arena, scorecard, analytics)
    ├── components/
    │   ├── CodeWorkspace.tsx     # Monaco code editor, logger, and compiler runner
    │   └── SystemDesignCanvas.tsx # Vector whiteboard drawing canvas
    └── lib/
        ├── data.ts          # Persona profiles, coding questions & design topics
        └── speech.ts        # Speech Recognition (STT) and Synthesis (TTS) wrapper
```

---

## 🛠️ Technical Design Decisions

### 🌟 1. Vanilla CSS Architecture
To achieve high-end, futuristic aesthetics without bloat, the styling leverages a curated **Vanilla CSS Design System** defined in [globals.css](file:///c:/Users/kumar/OneDrive/Documents/convo-glass/src/app/globals.css).
*   **Glassmorphism**: Sleek backdrops utilizing `backdrop-filter: blur(12px)` and thin semi-transparent border rules.
*   **Interactive Glow Spheres**: Floating radial gradients that pulse dynamically behind panels to create depth.
*   **Acoustic Waveforms**: Pure CSS keyframe transitions modeling real-time speech waves.

### 🧩 2. SSR-Safe Client Configurations
Next.js statically pre-renders pages on the server. However, browser engines like `speechSynthesis`, `webkitSpeechRecognition`, and HTML5 `canvas` elements are only available in browser contexts.
*   `speech.ts` implements defensive checks `typeof window !== 'undefined'` before mounting APIs.
*   `Chart.js` is imported dynamically on the client inside a window check in the page render:
    ```typescript
    if (typeof window !== "undefined") {
      const { Chart, registerables } = require("chart.js");
      Chart.register(...registerables);
    }
    ```

### ⚡ 3. Client-Side Evaluation Sandbox
Instead of routing submissions to expensive backend remote-execution containers, JavaScript solution files are run in the browser. 
*   Uses a parameterized `new Function(evalString)` block.
*   Intercepts global `console.log` arrays temporarily, piping output strings directly to the custom UI execution console.
*   Includes built-in parser helpers (`ListNode`, `arrayToList`, `listToArray`) to dynamically build data structures for complex problems like Linked List Reversals.

---

## 📖 Component Breakdown

### Speech Engine (`src/lib/speech.ts`)
Controls both input and output speech interfaces.
*   **Methods**:
    *   `speak(text, persona, onStart, onEnd)`: Speaks target scripts utilizing custom voice pitches and rates mapped to specific interviewer profiles.
    *   `startListening(onInterim, onMetrics, onFinal)`: Fires `webkitSpeechRecognition` in continuous mode, tracking pause parameters to calculate pacing and counting filler words:
        ```typescript
        const fillers = ["um", "uh", "like", "basically", "actually", "so"];
        ```
*   **Safety**: Automatically stops speech threads during page changes to prevent memory leaks or continuous background voice tracks.

### Vector Whiteboard (`src/components/SystemDesignCanvas.tsx`)
A completely custom whiteboard canvas.
*   **State Hook Arrays**: Tracks a list of `Node` (stores coordinates, shape definitions, labels) and `Connection` (stores source/destination mapping) vectors.
*   **Drawing Loops**: Listens to mouse mouseup/mousemove coordinates:
    *   *Draw Rounded Rectangles* for load balancers.
    *   *Draw Database Cylinders* (drawing double ellipse lines with vertical connectors).
    *   *Draw Cloud Paths* (bezier curve chains).
    *   *Draw Arrows* (computes trigonometric angles to place the arrowhead precisely on the border of the target node).

---

## 🏁 Getting Started

### Prerequisites
*   Node.js (v18.x or later recommended)
*   npm (or package manager equivalent)

### Installation
1. Clone the project workspace.
2. Install dependencies:
   ```bash
   npm install
   ```

### Execution
*   Start the local development server:
    ```bash
    npm run dev
    ```
*   Open your browser and navigate to:
    [http://localhost:3000](http://localhost:3000)

*   Verify Next.js compiler production builds:
    ```bash
    npm run build
    ```
