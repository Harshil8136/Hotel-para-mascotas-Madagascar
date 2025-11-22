// --- 1. SETUP GLOBALS (from window) ---
// This file reads all CDN libraries from the global 'window' object.
// This ensures all libraries are loaded *before* our app logic runs.

// Grab libraries from 'window'
const { React, ReactDOM, htm, Fuse, idb } = window;
const LucideReact = window.LucideReact || window.lucide;

if (!React || !ReactDOM || !htm || !Fuse || !idb || !LucideReact) {
  // This is a critical failure. Stop the app.
  const msg = "A critical CDN library failed to load. The app cannot start. Check the <script> tags in index.html and browser network tab.";
  console.error(msg, { React, ReactDOM, htm, Fuse, idb, LucideReact });

  // SECURITY FIX: Use safe DOM manipulation instead of innerHTML to prevent XSS
  const rootElement = document.getElementById('root');
  if (rootElement) {
    // Clear existing content safely
    rootElement.textContent = '';

    // Create error display element
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'padding: 2rem; text-align: center; color: #dc2626; font-family: system-ui, sans-serif;';
    errorDiv.textContent = msg;

    rootElement.appendChild(errorDiv);
  }

  // Throw an error to halt further script execution
  throw new Error(msg);
}

// Export React hooks
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;

// Create an `html` tag function bound to React.createElement
const html = htm.bind(React.createElement);

// Icon helper
function Icon({ name, className = "w-4 h-4", ...props }) {
  if (!LucideReact) {
    console.error("LucideReact library is not loaded.");
    return html`<span></span>`;
  }
  const LucideIcon = LucideReact[name]; // Correctly read from the LucideReact global
  if (LucideIcon) {
    return html`<${LucideIcon} className=${className} ...${props} />`;
  }
  // Fallback for missing icon
  console.warn(`Icon not found in Lucide: ${name}`);
  return html`<span></span>`;
}

// Helper for classnames
function cn(...inputs) {
  const classes = [];
  for (const input of inputs) {
    if (typeof input === 'string') {
      classes.push(input);
    } else if (typeof input === 'object' && input !== null) {
      for (const key in input) {
        if (input[key]) {
          classes.push(key);
        }
      }
    }
  }
  // Minimal replacement for twMerge
  return [...new Set(classes.join(' ').split(' '))].join(' ');
}

// Export all the globals for other modules
export {
  React, ReactDOM, useState, useEffect, useRef, useCallback, createContext, useContext,
  idb,
  Fuse,
  LucideReact as lucide, // Export the whole object, aliased as 'lucide'
  html,
  Icon,
  cn
};