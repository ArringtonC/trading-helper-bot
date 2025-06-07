import fs from 'fs';
import path from 'path';
import { DecisionTreeClassifier } from 'ml-cart';

// Load features
const featuresPath = path.join(__dirname, '../data/features.json');
if (!fs.existsSync(featuresPath)) {
  console.error('features.json not found. Please run export_features.ts first.');
  process.exit(1);
}
const features = JSON.parse(fs.readFileSync(featuresPath, 'utf-8'));
if (!Array.isArray(features) || features.length === 0) {
  console.error('No features found in features.json. Please ensure you have imported trade data.');
  process.exit(1);
}

// Select target and features
// Example: Use streak as a binary classification target (win streak > 0)
const X = features.map((row: any) => {
  const { id, streak, ...rest } = row;
  return Object.values(rest).map(v => (typeof v === 'number' ? v : 0));
});
const y = features.map((row: any) => (row.streak > 0 ? 1 : 0));

// Train/test split (simple)
const split = Math.floor(0.8 * X.length);
const X_train = X.slice(0, split);
const y_train = y.slice(0, split);
const X_test = X.slice(split);
const y_test = y.slice(split);

// Train decision tree
const clf = new DecisionTreeClassifier();
clf.train(X_train, y_train);

// Predict and evaluate
const y_pred = clf.predict(X_test);
const accuracy = y_pred.filter((p, i) => p === y_test[i]).length / y_test.length;
console.log(`Test accuracy: ${(accuracy * 100).toFixed(2)}%`);

// Feature importances (if available)
if (typeof clf.featureImportances === 'function') {
  const importances = clf.featureImportances();
  console.log('Feature importances:', importances);
} else {
  console.log('Feature importances not available for this model.');
} 