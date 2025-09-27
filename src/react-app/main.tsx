import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import App from "./App";
import "./index.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found");
}

// Ensure we only create root once
let root: ReturnType<typeof createRoot>;
try {
  // Check if root already exists (for HMR)
  if (!(container as any)._reactRootContainer) {
    root = createRoot(container);
    (container as any)._reactRootContainer = root;
  } else {
    root = (container as any)._reactRootContainer;
  }
} catch (error) {
  // Fallback for any issues
  root = createRoot(container);
}

root.render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/src/react-app/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
