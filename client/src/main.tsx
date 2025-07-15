import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize theme on startup
const initializeTheme = () => {
  const savedTheme = localStorage.getItem('app-theme') || 'system';
  const root = document.documentElement;
  
  root.classList.remove('light', 'dark');
  
  let actualTheme = savedTheme;
  if (savedTheme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  root.classList.add(actualTheme);
};

// Initialize theme before rendering
initializeTheme();

createRoot(document.getElementById("root")!).render(<App />);
