/**
 * Class Name Utility
 * 
 * Utility function for conditionally joining class names.
 * Based on the popular 'clsx' pattern used in Shadcn UI.
 */

/**
 * Concatenate class names conditionally
 * @param {...(string|object|array)} inputs - Class names or conditional objects
 * @returns {string} - Concatenated class names
 */
export function cn(...inputs) {
  return inputs
    .flat()
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Alternative implementation with more advanced conditional logic
 * Supports objects with boolean values and arrays
 */
export function clsx(...inputs) {
  const classes = [];
  
  for (const input of inputs) {
    if (!input) continue;
    
    if (typeof input === 'string') {
      classes.push(input);
    } else if (Array.isArray(input)) {
      const result = clsx(...input);
      if (result) classes.push(result);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key);
      }
    }
  }
  
  return classes.join(' ');
}

// Export cn as default for compatibility
export default cn;