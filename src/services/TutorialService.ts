import { Tutorial, TutorialMetadata } from '../types/Tutorial';

// --- Mock Data Store ---
// In a real Node.js environment, this data would be dynamically loaded 
// by reading .md files from a directory (e.g., 'content/tutorials/')
// and parsing their frontmatter (e.g., using a library like gray-matter).

const MOCK_TUTORIALS_DB: Tutorial[] = [
  {
    id: 'welcome-to-platform',
    title: 'Welcome to Your New Trading Dashboard!',
    sequence: 1,
    category: 'onboarding',
    targetElementSelectors: ['.main-dashboard-area'],
    filePath: 'content/tutorials/01-welcome.md',
    content: `
# Welcome to the Platform!

This is your central hub for options trading analytics. Let's take a quick tour.

## Key Areas:

*   **Dashboard Overview:** See your P&L at a glance.
*   **Risk Gauges:** Monitor your greeks in real-time.
*   **Strategy Visualizer:** Understand your trade setups.

We hope you find these tools valuable!
    `,
  },
  {
    id: 'understanding-risk-gauges',
    title: 'Understanding Your Risk Gauges',
    sequence: 2,
    category: 'onboarding',
    targetElementSelectors: ['#risk-gauge-delta', '#risk-gauge-theta'],
    filePath: 'content/tutorials/02-risk-gauges.md',
    content: `
# Understanding Your Risk Gauges

Real-time risk gauges are crucial for managing your options positions.

*   **Delta:** Shows your directional exposure.
*   **Theta:** Indicates time decay.
*   **Gamma:** Measures the rate of change of Delta.
*   **Vega:** Reflects sensitivity to implied volatility.

Keep an eye on these, especially for 0DTE trades!
    `,
  },
  {
    id: 'using-the-goal-wizard',
    title: 'Setting Up Your Goals with the Wizard',
    category: 'features',
    sequence: 1,
    targetElementSelectors: ['.goal-sizing-wizard-button'],
    filePath: 'content/tutorials/03-goal-wizard.md',
    content: `
# Using the Goal Sizing Wizard

The Goal Sizing Wizard helps you align your trading with your financial objectives.

1.  **Define Your Capital Objective:** How much do you want to grow your account?
2.  **Set Risk Tolerance:** Conservative, Moderate, or Aggressive?
3.  **Input Trade Statistics:** Average win rate, win/loss ratio.

The wizard will then suggest appropriate position sizes.
    `,
  },
];

// --- TutorialService Implementation ---

/**
 * Simulates fetching all tutorial metadata.
 * In a real implementation, this would scan a directory of Markdown files,
 * parse their frontmatter, and return the metadata.
 */
export const getAllTutorialsMetadata = async (): Promise<TutorialMetadata[]> => {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50)); 

  // In a real scenario: iterate over MOCK_TUTORIALS_DB or read from file system
  // For now, we map the mock DB, excluding the full content for metadata.
  return MOCK_TUTORIALS_DB.map(({ content, ...metadata }) => metadata);
};

/**
 * Simulates fetching a single tutorial by its ID, including its content.
 * In a real implementation, this would read a specific Markdown file by ID/slug,
 * parse its frontmatter and content.
 * @param id The unique ID of the tutorial.
 */
export const getTutorialById = async (id: string): Promise<Tutorial | undefined> => {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));

  const tutorial = MOCK_TUTORIALS_DB.find(t => t.id === id);
  
  // In a real scenario, if not found in a cache or DB, you might try to read 
  // `content/tutorials/${id}.md`, parse it, and return.
  return tutorial;
};

/**
 * Simulates fetching tutorials by category.
 */
export const getTutorialsByCategory = async (category: string): Promise<TutorialMetadata[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_TUTORIALS_DB
    .filter(t => t.category === category)
    .map(({ content, ...metadata }) => metadata)
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
};

/**
 * Simulates fetching tutorials by a target element selector.
 * This could be used to find relevant tutorials for a specific UI element.
 */
export const getTutorialsByTargetSelector = async (selector: string): Promise<TutorialMetadata[]> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_TUTORIALS_DB
    .filter(t => t.targetElementSelectors?.includes(selector))
    .map(({ content, ...metadata }) => metadata)
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
};

// Potential future functions:
// - searchTutorials(query: string): Promise<TutorialMetadata[]>
// - getTutorialSeries(seriesId: string): Promise<TutorialMetadata[]>

// Note on actual implementation:
// For a production environment using local Markdown files:
// 1. Use Node.js `fs.readdir` to list files in `content/tutorials/`.
// 2. For each file, use `fs.readFile` to get its content.
// 3. Use a library like `gray-matter` to parse the YAML frontmatter and Markdown body.
// 4. Implement caching (e.g., in-memory on server start, or a more robust solution)
//    to avoid re-reading and parsing files on every request.
// 5. If running in a purely client-side environment (like Create React App without SSR/SSG for this part),
//    you might need to use a build step to convert .md files to .json or .js modules,
//    or use dynamic imports with raw-loader if an HTTP server serves the content files. 