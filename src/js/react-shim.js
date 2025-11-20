// Shim to make window.react available for libraries that expect it (like lucide-react UMD)
// Standard React UMD exports to window.React, but some UMD builds expect window.react
if (window.React && !window.react) {
  window.react = window.React;
}
