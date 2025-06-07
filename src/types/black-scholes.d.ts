declare module 'black-scholes' {
  // We know the function exists, but we don't have specific types.
  // Declaring it as 'any' satisfies TypeScript for now.
  // Function signature: blackScholes(s, k, t, v, r, callPut)
  export function blackScholes(
    s: number, // Current price of the underlying
    k: number, // Strike price
    t: number, // Time to expiration in years
    v: number, // Volatility as a decimal
    r: number, // Annual risk-free interest rate as a decimal
    callPut: 'call' | 'put' // The type of option
  ): number; // Returns the theoretical price

  // Add other exports here if the library has them (e.g., for Greeks)
  // export function delta(...) : number;
} 