// ============ PHERE HELPER UTILITIES ============

/**
 * Format number in Indian Lakhs/Crore shorthand
 * e.g. 1500000 → ₹15.00L, 20000000 → ₹2.00Cr
 */
export const fmt = (n) => {
  const num = Number(n) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  return `₹${num.toLocaleString('en-IN')}`;
};

/**
 * Format number in full INR with commas
 * e.g. 1500000 → ₹15,00,000
 */
export const fmtFull = (n) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

/**
 * Get today's date in YYYY-MM-DD format
 */
export const today = () => new Date().toISOString().split('T')[0];

/**
 * Generate a unique ID (timestamp + random)
 */
export const newId = () => Date.now() + Math.floor(Math.random() * 1000);
