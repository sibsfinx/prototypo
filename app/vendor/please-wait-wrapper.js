// ES module wrapper for please-wait UMD module
// Import the UMD script which sets window.pleaseWait
import './please-wait.js';

// Export what the UMD module sets on window
export default window.pleaseWait;
export const pleaseWait = window.pleaseWait;
