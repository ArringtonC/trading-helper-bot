# Feature Plan: Automated Trader Data Pipeline

**Created:** December 20, 2025  
**Status:** Planning  

---

## 1. Objective

To create an automated pipeline that fetches, parses, and updates investment data for the "Famous Traders" feature. This will ensure the content remains current without manual intervention.

The initial focus will be on automating Michael Burry's portfolio data by sourcing his quarterly 13F filings from the SEC.

## 2. Proposed Architecture

![Architecture Diagram](https://i.imgur.com/3A3b0aV.png)

1.  **Scheduler:** A cron job (e.g., Vercel Cron Jobs, GitHub Actions, or a traditional server cron) will trigger the update script on a quarterly basis, aligned with 13F filing deadlines.
2.  **Automation Script (Node.js):** A script that performs the following steps:
    -   Connects to the SEC EDGAR API to find the latest 13F filing for a given CIK (Central Index Key). For Scion Asset Management, the CIK is `0001649339`.
    -   Parses the XML filing to extract key data for each holding (e.g., asset name, ticker, value, shares).
    -   Transforms the raw data into our `TraderProfile` JSON format.
3.  **Data Storage:** The script will output a static JSON file (e.g., `public/data/traders.json`). This file will be committed to the repository or uploaded to a static file host.
4.  **Frontend Integration:** The React application will fetch this JSON file to populate the "Famous Traders" page, making the content dynamic.

## 3. Implementation Steps

### **Phase 1: Script Development (Backend/Tooling)**

1.  **Create Script File:** Develop a Node.js script (e.g., `scripts/automation/update-trader-data.ts`).
2.  **SEC API Integration:** Use an HTTP client like `axios` to query the SEC EDGAR submissions API.
    -   Endpoint: `https://data.sec.gov/submissions/CIK{CIK_NUMBER}.json`
3.  **13F Filing Parser:** Write logic to parse the XML content of the 13F filing to identify individual holdings. This is the most complex step and will require careful handling of the XML structure.
4.  **Data Transformation:** Convert the parsed data into the `TraderProfile` structure defined in `src/components/BestTraders/types.ts`.
5.  **File Output:** Write the final JSON array to `public/data/traders.json`.

### **Phase 2: Frontend Data Fetching**

1.  **Move Mock Data:** Move the `michaelBurryData` object from `BestTradersSection.tsx` into a new file: `public/data/traders.json`.
2.  **Fetch Data in Component:** Modify `FamousTradersPage.tsx` to fetch the data from `/data/traders.json` using `useEffect` and `useState`.
3.  **Pass Data to Component:** Pass the fetched trader data down to the `BestTradersSection` and `TraderProfileCard` components.

### **Phase 3: Automation & Scheduling**

1.  **Set up Scheduler:** Configure a scheduler to run the update script quarterly. A GitHub Action scheduled to run `node scripts/automation/update-trader-data.ts` and commit the resulting file is a great, integrated solution.

## 4. Future Enhancements

-   **News API Integration:** Use a service like NewsAPI or GNews to fetch recent news articles about a trader's top holdings to automatically generate a "thesis" for each pick. This would likely require an AI/NLP service for summarization.
-   **Add More Traders:** Expand the script to handle multiple CIKs for other famous investors.
-   **Error Handling & Monitoring:** Implement robust error handling and logging to monitor the pipeline for failures.

---

This plan provides a clear path forward. The next practical step would be to implement **Phase 2: Frontend Data Fetching** to make the component dynamic, even before the automation script is fully built. 