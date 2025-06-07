#!/usr/bin/env node

/**
 * Auto-generates test files for TypeScript services
 * Usage: node scripts/generate-service-test.js src/services/ServiceName.ts
 */

const fs = require('fs');
const path = require('path');

function extractServiceInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath, '.ts');
  
  // Extract class name
  const classMatch = content.match(/export\s+class\s+(\w+)/);
  const className = classMatch ? classMatch[1] : fileName;
  
  // Extract public methods
  const methodMatches = content.match(/(?:public\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?{/g);
  const methods = methodMatches 
    ? methodMatches
        .map(match => {
          const methodMatch = match.match(/(?:public\s+)?(?:async\s+)?(\w+)\s*\(/);
          return methodMatch ? methodMatch[1] : null;
        })
        .filter(method => method && method !== 'constructor')
    : [];
  
  // Check if it has constructor parameters
  const constructorMatch = content.match(/constructor\s*\(([^)]*)\)/);
  const hasConstructorParams = constructorMatch && constructorMatch[1].trim().length > 0;
  
  // Check for async methods
  const hasAsyncMethods = content.includes('async ');
  
  // Check for network calls
  const hasNetworkCalls = content.includes('fetch') || content.includes('axios') || content.includes('http');
  
  return {
    className,
    methods,
    hasConstructorParams,
    hasAsyncMethods,
    hasNetworkCalls,
    filePath
  };
}

function generateTestContent(serviceInfo) {
  const { className, methods, hasConstructorParams, hasAsyncMethods, hasNetworkCalls } = serviceInfo;
  
  const imports = [
    `import { ${className} } from './${className}';`
  ];
  
  if (hasAsyncMethods) {
    imports.push(`import { jest } from '@jest/globals';`);
  }
  
  if (hasNetworkCalls) {
    imports.push(`// Mock fetch for network tests`);
    imports.push(`global.fetch = jest.fn();`);
  }
  
  const testContent = `${imports.join('\n')}

describe('${className}', () => {
  let service: ${className};

  beforeEach(() => {
    service = new ${className}(${hasConstructorParams ? '/* mock config */' : ''});
    
    ${hasNetworkCalls ? `
    // Reset fetch mock
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
    ` : ''}
  });

  describe('Constructor', () => {
    it('should initialize successfully', () => {
      expect(service).toBeDefined();
      expect(service).toBeInstanceOf(${className});
    });

    ${hasConstructorParams ? `
    it('should initialize with custom configuration', () => {
      const customConfig = { /* add config properties */ };
      const customService = new ${className}(customConfig);
      expect(customService).toBeDefined();
    });
    ` : ''}
  });

  ${methods.length > 0 ? `
  describe('Methods', () => {
    ${methods.map(method => `
    describe('${method}', () => {
      it('should exist and be callable', () => {
        expect(typeof service.${method}).toBe('function');
      });

      ${hasAsyncMethods && method.includes('async') ? `
      it('should handle async operations', async () => {
        // Add specific test for ${method}
        const result = await service.${method}(/* valid input */);
        expect(result).toBeDefined();
      });

      it('should handle errors gracefully', async () => {
        // Test error handling
        await expect(service.${method}(null)).rejects.toThrow();
      });
      ` : `
      it('should return expected result', () => {
        // Add specific test for ${method}
        const result = service.${method}(/* valid input */);
        expect(result).toBeDefined();
      });

      it('should handle invalid input', () => {
        // Test error handling
        expect(() => service.${method}(null)).toThrow();
      });
      `}
    });
    `).join('')}
  });
  ` : ''}

  ${hasNetworkCalls ? `
  describe('Network Operations', () => {
    it('should handle network success', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockResolvedValue({ data: 'test' }) };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      // Test network method
      // const result = await service.networkMethod();
      // expect(result).toBeDefined();
    });

    it('should handle network failures', async () => {
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

      // Test network error handling
      // await expect(service.networkMethod()).rejects.toThrow('Network error');
    });

    it('should handle malformed responses', async () => {
      const mockResponse = { ok: true, json: jest.fn().mockRejectedValue(new Error('Invalid JSON')) };
      (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse as any);

      // Test malformed response handling
      // await expect(service.networkMethod()).rejects.toThrow();
    });
  });
  ` : ''}

  describe('Error Handling', () => {
    it('should handle undefined inputs gracefully', () => {
      // Test undefined input handling for all public methods
      ${methods.map(method => `
      expect(() => service.${method}(undefined)).not.toThrow('Unexpected error');
      `).join('')}
    });

    it('should handle null inputs gracefully', () => {
      // Test null input handling for all public methods  
      ${methods.map(method => `
      expect(() => service.${method}(null)).not.toThrow('Unexpected error');
      `).join('')}
    });
  });

  // TODO: Add integration tests
  // TODO: Add performance tests for large datasets
  // TODO: Add edge case tests specific to ${className}
  // TODO: Add mock data generators for realistic testing
  
  // GENERATED BY: scripts/generate-service-test.js
  // DATE: ${new Date().toISOString()}
  // SOURCE: ${serviceInfo.filePath}
});
`;

  return testContent;
}

function main() {
  const serviceFilePath = process.argv[2];
  
  if (!serviceFilePath) {
    console.error('❌ Usage: node scripts/generate-service-test.js <service-file-path>');
    process.exit(1);
  }
  
  if (!fs.existsSync(serviceFilePath)) {
    console.error(`❌ File not found: ${serviceFilePath}`);
    process.exit(1);
  }
  
  console.log(`🔍 Analyzing service: ${serviceFilePath}`);
  
  try {
    const serviceInfo = extractServiceInfo(serviceFilePath);
    const testContent = generateTestContent(serviceInfo);
    
    const testFilePath = serviceFilePath.replace('.ts', '.test.ts');
    
    // Check if test file already exists
    if (fs.existsSync(testFilePath)) {
      console.log(`⚠️  Test file already exists: ${testFilePath}`);
      console.log(`🔄 Use --force flag to overwrite`);
      
      if (!process.argv.includes('--force')) {
        process.exit(0);
      }
    }
    
    fs.writeFileSync(testFilePath, testContent);
    
    console.log(`✅ Generated test file: ${testFilePath}`);
    console.log(`📊 Found ${serviceInfo.methods.length} methods to test`);
    console.log(`🎯 Next steps:`);
    console.log(`   1. Review generated test file`);
    console.log(`   2. Add specific test cases for each method`);
    console.log(`   3. Add mock data and realistic test scenarios`);
    console.log(`   4. Run: npm test ${testFilePath}`);
    
  } catch (error) {
    console.error(`❌ Error generating test: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractServiceInfo, generateTestContent }; 