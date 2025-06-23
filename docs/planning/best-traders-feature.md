# Feature Plan: Best Traders Section

**Created:** December 20, 2025  
**Status:** Planning  

---

## 1. Overview

This document outlines the plan for a new "Best Traders" section to be added to the application's home page. This section will serve as an educational and inspirational resource for users, showcasing the strategies and philosophies of world-renowned investors.

The first trader to be featured will be **Michael Burry**.

## 2. Purpose & User Value

- **Education:** Provide users with concise, actionable insights into the investment strategies of successful traders.
- **Inspiration:** Motivate users by highlighting famous trades and contrarian thinking.
- **Engagement:** Create dynamic content that encourages users to return to the app for new profiles and updates.

## 3. Proposed Structure

The new section will be implemented as a reusable React component with the following structure:

- **Trader Profile Component:** A dedicated component that displays:
    - A brief biography and photo.
    - A summary of their investment philosophy.
    - Key insights or famous trades (e.g., "The Big Short").
    - A section for "Latest Insights / Holdings" which can be updated periodically.
- **Home Page Integration:** The component will be added to the main home page, likely below the primary dashboard elements.

## 4. Content Strategy & Research

To ensure the content is fresh, accurate, and valuable, we will use a research-driven approach. The initial focus is on Michael Burry.

### Research Questions for Perplexity (Michael Burry)

These questions are designed to gather up-to-date information for the profile content:

1.  "What are Michael Burry's most significant Q1 2025 stock holdings according to the latest 13F filings from Scion Asset Management?"
2.  "Can you summarize Michael Burry's recent public statements or interviews regarding his 2025 economic outlook and market predictions?"
3.  "What was the investment thesis behind Michael Burry's famous 'Big Short' against the subprime mortgage market?"
4.  "Beyond the 'Big Short,' what are two other successful, high-conviction trades Michael Burry has made in his career?"
5.  "What are the core principles of Michael Burry's investment philosophy, particularly regarding value investing and margin of safety?"

## 5. Implementation Plan

1.  **Research:** Gather content using the questions above.
2.  **Component Development:** Create a new `TraderProfile.tsx` component.
3.  **Data Modeling:** Define a TypeScript interface for the trader's data (`TraderProfile`).
4.  **Integration:** Add the new component to the `HomePage.tsx`.
5.  **Styling:** Ensure the component is styled consistently with the rest of the application. 