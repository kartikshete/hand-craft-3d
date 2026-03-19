# ✋ Hand Craft 3D 

![React](https://img.shields.io/badge/-React-blue?style=flat-square) ![3D](https://img.shields.io/badge/-3D-purple?style=flat-square) ![WebGL](https://img.shields.io/badge/-WebGL-orange?style=flat-square) ![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

An astonishingly sophisticated Computer Vision application utilizing MediaPipe and Three.js to manipulate 3D environments via physical hand tracking.

## 📝 Overview
Hand Craft 3D bridges the gap between the physical and digital world. By leveraging Google's `@mediapipe/tasks-vision` and React, the client webcam converts live hand-joint coordinates into manipulable 3D data via `three.js`. Reach out, twist, flex, and manipulate a fully rendered 3D scene effortlessly using only your webcam.

## ✨ Key Features
- **Real-time Skeletal Tracking**: Identifies 21 exact hand landmarks dynamically using the `MediaPipe Hands` TensorFlow model.
- **Three.js Integration Ecosystem**: Uses `@react-three/fiber` and `@react-three/drei` for robust 3D modeling and lighting systems.
- **Global State Control**: Integrates `Zustand` to manage complex WebGL and CV states cleanly across components.
- **Fluid Framer Motion**: Handles UI/UX overlays gracefully over the 3D `<canvas>`.
- **Zero Server Overhead**: The complex AI parsing happens natively inside the user's browser runtime.

## 🛠 Tech Stack
- AI/CV: `@mediapipe/hands`, `react-webcam`
- 3D Engine Architecture: `Three.js`, `@react-three/fiber`
- Framework/State: `React 19`, `Zustand`
- Styling/Animation: `Framer Motion`, `Tailwind CSS 3`

## 🚀 Getting Started

This application requires access to a modern Web Browser and a web-camera.

```bash
# Navigate to the futuristic module
cd hand-craft-3d

# Install the enormous ecosystem securely
npm install

# Start the WebGL rendering engine + Dev Server
npm run dev

# NOTE: Ensure you grant 'Camera Permissions' on localhost when prompted.
```


## 🌐 Deployment

### Vercel / Netlify (Recommended)
1. Push this repository to GitHub.
2. Connect your GitHub account to [Vercel](https://vercel.com) or [Netlify](https://www.netlify.com).
3. Select this project and use the following settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

### GitHub Pages
1. Install the gh-pages package: `npm install gh-pages --save-dev`
2. Add deployment scripts to your `package.json`.
3. Run `npm run deploy`.

## 👨‍💻 Developer
**Kartik Shete**
