module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: [
    '**/?(*.)+(spec|test).[tj]s?(x)'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      babelConfig: true,
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-markdown|rehype-highlight|remark-.*|rehype-.*|micromark|micromark-.*|mdast-.*|unist-.*|vfile|bail|is-plain-obj|trough|unified|devlop|hastscript|web-namespaces|comma-separated-tokens|hast-util-.*|html-void-elements|property-information|space-separated-tokens|zwitch|@types/.*)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^highlight\\.js/styles/(.*)$': 'identity-obj-proxy',
    '^react-markdown$': '<rootDir>/src/__mocks__/react-markdown.js',
    '^rehype-highlight$': '<rootDir>/src/__mocks__/rehype-highlight.js',
    '^./components/Navigation$': '<rootDir>/src/__mocks__/Navigation.js'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/serviceWorker.ts',
    '!src/index.tsx'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000
}; 