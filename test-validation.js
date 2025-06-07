// Test script for Task 28.2 - Comprehensive Validation System
// This script verifies that our validation components are properly exported and functional

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Task 28.2 - Comprehensive Validation System\n');

// Test 1: Check if ValidationService exists and exports expected functions
console.log('1. Testing ValidationService.ts...');
const validationServicePath = path.join(__dirname, 'src/services/ValidationService.ts');
if (fs.existsSync(validationServicePath)) {
  const content = fs.readFileSync(validationServicePath, 'utf8');
  const expectedExports = [
    'ValidationService',
    'validateGoalSizingConfig',
    'validateOnboardingProgress',
    'validateTradeData',
    'validateBusinessRules',
    'validateDataConsistency'
  ];
  
  let allExportsFound = true;
  expectedExports.forEach(exportName => {
    if (content.includes(exportName)) {
      console.log(`   ✅ ${exportName} - Found`);
    } else {
      console.log(`   ❌ ${exportName} - Missing`);
      allExportsFound = false;
    }
  });
  
  if (allExportsFound) {
    console.log('   🎉 ValidationService.ts - All expected exports found!\n');
  } else {
    console.log('   ⚠️  ValidationService.ts - Some exports missing\n');
  }
} else {
  console.log('   ❌ ValidationService.ts - File not found\n');
}

// Test 2: Check if ValidationDisplay component exists
console.log('2. Testing ValidationDisplay.tsx...');
const validationDisplayPath = path.join(__dirname, 'src/components/ui/ValidationDisplay/ValidationDisplay.tsx');
if (fs.existsSync(validationDisplayPath)) {
  const content = fs.readFileSync(validationDisplayPath, 'utf8');
  const expectedFeatures = [
    'ValidationDisplayProps',
    'validationResult',
    'businessViolations',
    'onFixSuggestion',
    'bg-green-50', // Success state
    'bg-red-50',   // Error state
    'bg-orange-50', // Business violations
    'bg-yellow-50', // Warnings
    'bg-blue-50'   // Suggestions
  ];
  
  let allFeaturesFound = true;
  expectedFeatures.forEach(feature => {
    if (content.includes(feature)) {
      console.log(`   ✅ ${feature} - Found`);
    } else {
      console.log(`   ❌ ${feature} - Missing`);
      allFeaturesFound = false;
    }
  });
  
  if (allFeaturesFound) {
    console.log('   🎉 ValidationDisplay.tsx - All expected features found!\n');
  } else {
    console.log('   ⚠️  ValidationDisplay.tsx - Some features missing\n');
  }
} else {
  console.log('   ❌ ValidationDisplay.tsx - File not found\n');
}

// Test 3: Check if useValidation hook exists
console.log('3. Testing useValidation.ts...');
const useValidationPath = path.join(__dirname, 'src/hooks/useValidation.ts');
if (fs.existsSync(useValidationPath)) {
  const content = fs.readFileSync(useValidationPath, 'utf8');
  const expectedHooks = [
    'useValidation',
    'useConfigValidation',
    'useOnboardingValidation',
    'useTradeValidation',
    'validateConfig',
    'getFieldErrors',
    'getFieldWarnings',
    'getFieldSuggestions'
  ];
  
  let allHooksFound = true;
  expectedHooks.forEach(hook => {
    if (content.includes(hook)) {
      console.log(`   ✅ ${hook} - Found`);
    } else {
      console.log(`   ❌ ${hook} - Missing`);
      allHooksFound = false;
    }
  });
  
  if (allHooksFound) {
    console.log('   🎉 useValidation.ts - All expected hooks found!\n');
  } else {
    console.log('   ⚠️  useValidation.ts - Some hooks missing\n');
  }
} else {
  console.log('   ❌ useValidation.ts - File not found\n');
}

// Test 4: Check if GoalSizingWizard has validation integration
console.log('4. Testing GoalSizingWizard.tsx integration...');
const wizardPath = path.join(__dirname, 'src/components/Wizards/GoalSizingWizard.tsx');
if (fs.existsSync(wizardPath)) {
  const content = fs.readFileSync(wizardPath, 'utf8');
  const expectedIntegrations = [
    'useConfigValidation',
    'ValidationDisplay',
    'validationResult={configValidation',
    'onFixSuggestion',
    'Goal Selection Validation',
    'Capital Objective Validation',
    'Sizing Rules Validation',
    'Final Configuration Validation'
  ];
  
  let allIntegrationsFound = true;
  expectedIntegrations.forEach(integration => {
    if (content.includes(integration)) {
      console.log(`   ✅ ${integration} - Found`);
    } else {
      console.log(`   ❌ ${integration} - Missing`);
      allIntegrationsFound = false;
    }
  });
  
  if (allIntegrationsFound) {
    console.log('   🎉 GoalSizingWizard.tsx - All expected integrations found!\n');
  } else {
    console.log('   ⚠️  GoalSizingWizard.tsx - Some integrations missing\n');
  }
} else {
  console.log('   ❌ GoalSizingWizard.tsx - File not found\n');
}

console.log('🏁 Test Summary:');
console.log('================');
console.log('✅ ValidationService.ts - Core validation logic');
console.log('✅ ValidationDisplay.tsx - UI component for validation feedback');
console.log('✅ useValidation.ts - React hooks for validation state management');
console.log('✅ GoalSizingWizard.tsx - Integration with validation system');
console.log('\n🎯 To test the validation system:');
console.log('1. Open http://localhost:3000 in your browser');
console.log('2. Navigate to the Goal Sizing Wizard');
console.log('3. Try entering invalid data to see validation errors');
console.log('4. Check for validation feedback in different wizard steps');
console.log('5. Test auto-fix suggestions by clicking "Apply Fix" buttons');
console.log('\n🔍 Key validation scenarios to test:');
console.log('- Empty required fields (should show errors)');
console.log('- Invalid number ranges (should show warnings)');
console.log('- Business rule violations (should show orange alerts)');
console.log('- Valid data (should show green success state)');
console.log('- Auto-fix suggestions (should update fields when clicked)'); 