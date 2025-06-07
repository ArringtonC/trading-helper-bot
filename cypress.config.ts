import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/integration/**/*.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/index.ts',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'webpack',
    },
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  defaultCommandTimeout: 30000,
  video: false,
  screenshotOnRunFailure: true,
}); 