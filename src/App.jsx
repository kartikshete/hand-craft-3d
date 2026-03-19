import React, { Suspense } from 'react';
import HandTracker from './components/HandTracker';
import World from './components/World';
import HUD from './components/HUD';

function App() {
  return (
    <main style={{
      width: '100vw',
      height: '100vh',
      background: 'linear-gradient(180deg, #030014 0%, #0a0a1a 100%)',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      color: 'white'
    }}>
      {/* Loading State */}
      <Suspense fallback={
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '3px solid rgba(0,245,255,0.2)',
            borderTop: '3px solid #00F5FF',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{
            fontFamily: 'monospace',
            color: '#00F5FF',
            fontSize: '14px',
            letterSpacing: '4px'
          }}>
            INITIALIZING NEURAL LINK...
          </div>
        </div>
      }>
        {/* 3D World */}
        <World />
      </Suspense>

      {/* Camera + Hand Tracking */}
      <HandTracker />

      {/* HUD Overlay */}
      <HUD />

      {/* Vignette */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)',
        zIndex: 45
      }} />

      {/* Scan lines effect */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        zIndex: 46
      }} />

      {/* CSS for animations */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          overflow: hidden;
          background: #030014;
        }
      `}</style>
    </main>
  );
}

export default App;
