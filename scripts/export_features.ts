import { AnalyticsDataService } from '../src/services/AnalyticsDataService';
import { computeFeaturesForBatch } from '../src/features';
import fs from 'fs';
import path from 'path';

async function exportFeatures() {
  const analyticsDataService = new AnalyticsDataService();
  const trades = await analyticsDataService.getAllTrades();
  const features = await computeFeaturesForBatch(trades);

  // Write JSON
  const jsonPath = path.join(__dirname, '../data/features.json');
  fs.writeFileSync(jsonPath, JSON.stringify(features, null, 2));
  console.log(`Exported features to ${jsonPath}`);

  // Write CSV
  if (features.length > 0) {
    const keys = Object.keys(features[0]);
    const csvRows = [keys.join(',')];
    for (const row of features) {
      csvRows.push(keys.map(k => JSON.stringify(row[k] ?? '')).join(','));
    }
    const csvPath = path.join(__dirname, '../data/features.csv');
    fs.writeFileSync(csvPath, csvRows.join('\n'));
    console.log(`Exported features to ${csvPath}`);
  } else {
    console.log('No features to export.');
  }
}

exportFeatures().catch(e => {
  console.error('Error exporting features:', e);
  process.exit(1);
}); 