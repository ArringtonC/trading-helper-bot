module.exports = {
  presets: [
    '@babel/preset-env', // For compiling modern JavaScript down
    ['@babel/preset-react', { runtime: 'automatic' }], // For JSX, with automatic runtime
    '@babel/preset-typescript', // For TypeScript syntax
  ],
}; 