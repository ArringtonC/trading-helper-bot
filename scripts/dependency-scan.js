#!/usr/bin/env node

// Trading Helper Bot - Dependency Vulnerability Scanner
// Created for Task 38.5: Conduct Dependency Vulnerability Scanning and Enforce Data Encryption at Rest

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Dependency Vulnerability Scanner
 * Scans npm dependencies for known vulnerabilities and generates reports
 */
class DependencyScanner {
  constructor() {
    this.outputDir = 'docs/security';
    this.reportFile = path.join(this.outputDir, 'dependency-vulnerability-report.json');
    this.summaryFile = path.join(this.outputDir, 'dependency-vulnerability-summary.md');
    
    this.severityLevels = {
      'critical': { priority: 1, color: '🔴', action: 'IMMEDIATE' },
      'high': { priority: 2, color: '🟠', action: 'URGENT' },
      'moderate': { priority: 3, color: '🟡', action: 'SCHEDULED' },
      'low': { priority: 4, color: '🟢', action: 'MONITOR' },
      'info': { priority: 5, color: '🔵', action: 'INFORMATIONAL' }
    };

    this.ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Run npm audit and return structured results
   */
  runNpmAudit() {
    try {
      console.log('🔍 Running npm audit...');
      
      // Run npm audit with JSON output
      const auditResult = execSync('npm audit --json', { 
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      return JSON.parse(auditResult);
    } catch (error) {
      // npm audit returns non-zero exit codes when vulnerabilities are found
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch (parseError) {
          console.error('Failed to parse npm audit output:', parseError);
          return null;
        }
      }
      console.error('npm audit failed:', error.message);
      return null;
    }
  }

  /**
   * Get package.json dependency information
   */
  getDependencyInfo() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const packageLockJson = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
      
      return {
        dependencies: packageJson.dependencies || {},
        devDependencies: packageJson.devDependencies || {},
        totalPackages: Object.keys(packageLockJson.packages || {}).length,
        lockfileVersion: packageLockJson.lockfileVersion
      };
    } catch (error) {
      console.error('Failed to read package information:', error);
      return {};
    }
  }

  /**
   * Analyze audit results and generate security report
   */
  analyzeVulnerabilities(auditData) {
    if (!auditData || !auditData.vulnerabilities) {
      return {
        summary: { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 },
        vulnerabilities: [],
        recommendations: []
      };
    }

    const vulnerabilities = [];
    const summary = { total: 0, critical: 0, high: 0, moderate: 0, low: 0, info: 0 };

    // Process vulnerabilities
    for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities)) {
      if (vulnData.severity) {
        summary[vulnData.severity] = (summary[vulnData.severity] || 0) + 1;
        summary.total++;

        vulnerabilities.push({
          package: packageName,
          severity: vulnData.severity,
          title: vulnData.title || 'Unknown vulnerability',
          description: vulnData.url || 'No description available',
          range: vulnData.range || 'Unknown range',
          fixAvailable: vulnData.fixAvailable || false,
          via: vulnData.via || [],
          effects: vulnData.effects || [],
          cwe: vulnData.cwe || [],
          cvss: vulnData.cvss || null
        });
      }
    }

    // Sort vulnerabilities by severity
    vulnerabilities.sort((a, b) => {
      return this.severityLevels[a.severity].priority - this.severityLevels[b.severity].priority;
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(summary, vulnerabilities);

    return {
      summary,
      vulnerabilities,
      recommendations,
      metadata: auditData.metadata || {}
    };
  }

  /**
   * Generate security recommendations based on findings
   */
  generateRecommendations(summary, vulnerabilities) {
    const recommendations = [];

    if (summary.critical > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        action: 'Immediate action required',
        description: `${summary.critical} critical vulnerabilities found. These pose immediate security risks and should be fixed immediately.`,
        steps: [
          'Run npm audit fix to automatically fix vulnerabilities',
          'Review each critical vulnerability manually',
          'Consider updating to patched versions',
          'Test thoroughly after applying fixes'
        ]
      });
    }

    if (summary.high > 0) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Fix within 24-48 hours',
        description: `${summary.high} high-severity vulnerabilities found. These should be addressed urgently.`,
        steps: [
          'Schedule immediate maintenance window',
          'Apply security patches',
          'Update vulnerable dependencies',
          'Verify fixes in staging environment'
        ]
      });
    }

    if (summary.moderate > 0) {
      recommendations.push({
        priority: 'MODERATE',
        action: 'Fix within 1-2 weeks',
        description: `${summary.moderate} moderate vulnerabilities found. Plan for scheduled maintenance.`,
        steps: [
          'Include in next planned release cycle',
          'Update dependencies during regular maintenance',
          'Monitor for exploit activity',
          'Consider temporary mitigations'
        ]
      });
    }

    if (summary.low > 0 || summary.info > 0) {
      recommendations.push({
        priority: 'LOW',
        action: 'Address during regular maintenance',
        description: `${summary.low + summary.info} low-priority vulnerabilities found. Address during regular updates.`,
        steps: [
          'Include in quarterly dependency updates',
          'Monitor security advisories',
          'Update as part of regular maintenance',
          'Document decisions for accepted risks'
        ]
      });
    }

    // General security recommendations
    recommendations.push({
      priority: 'PREVENTIVE',
      action: 'Ongoing security practices',
      description: 'Implement continuous security monitoring and best practices.',
      steps: [
        'Set up automated dependency scanning in CI/CD',
        'Enable GitHub/GitLab security alerts',
        'Regularly update dependencies (monthly)',
        'Use npm audit in pre-commit hooks',
        'Implement dependency review process',
        'Consider using tools like Snyk or WhiteSource'
      ]
    });

    return recommendations;
  }

  /**
   * Generate detailed markdown report
   */
  generateMarkdownReport(analysis, dependencyInfo) {
    const timestamp = new Date().toISOString();
    const { summary, vulnerabilities, recommendations, metadata } = analysis;

    let report = `# Dependency Vulnerability Security Report

*Generated on: ${timestamp}*  
*Project: Trading Helper Bot*  
*Total Dependencies: ${dependencyInfo.totalPackages || 'Unknown'}*

## Executive Summary

`;

    // Security score calculation
    const securityScore = this.calculateSecurityScore(summary);
    report += `**Security Score: ${securityScore.score}/100** (${securityScore.grade})

`;

    // Summary table
    report += `### Vulnerability Summary

| Severity | Count | Priority | Action Required |
|----------|-------|----------|----------------|
`;

    for (const [severity, data] of Object.entries(this.severityLevels)) {
      const count = summary[severity] || 0;
      if (count > 0 || severity === 'critical' || severity === 'high') {
        report += `| ${data.color} ${severity.toUpperCase()} | ${count} | ${data.priority} | ${data.action} |\n`;
      }
    }

    report += `| **TOTAL** | **${summary.total}** | - | - |

`;

    // Critical findings
    if (summary.critical > 0) {
      report += `## 🚨 Critical Vulnerabilities (Immediate Action Required)

`;
      vulnerabilities
        .filter(v => v.severity === 'critical')
        .forEach((vuln, index) => {
          report += `### ${index + 1}. ${vuln.package}
- **Title**: ${vuln.title}
- **Range**: ${vuln.range}
- **Fix Available**: ${vuln.fixAvailable ? '✅ Yes' : '❌ No'}
- **Description**: ${vuln.description}

`;
        });
    }

    // High severity findings
    if (summary.high > 0) {
      report += `## ⚠️ High Severity Vulnerabilities

`;
      vulnerabilities
        .filter(v => v.severity === 'high')
        .forEach((vuln, index) => {
          report += `### ${index + 1}. ${vuln.package}
- **Title**: ${vuln.title}
- **Range**: ${vuln.range}
- **Fix Available**: ${vuln.fixAvailable ? '✅ Yes' : '❌ No'}

`;
        });
    }

    // Recommendations
    report += `## 🔧 Recommendations

`;
    recommendations.forEach((rec, index) => {
      report += `### ${index + 1}. ${rec.priority} - ${rec.action}

${rec.description}

**Action Steps:**
`;
      rec.steps.forEach(step => {
        report += `- ${step}\n`;
      });
      report += '\n';
    });

    // Technical details
    report += `## 📊 Technical Details

### Dependency Information
- **Total Packages**: ${dependencyInfo.totalPackages || 'Unknown'}
- **Direct Dependencies**: ${Object.keys(dependencyInfo.dependencies || {}).length}
- **Dev Dependencies**: ${Object.keys(dependencyInfo.devDependencies || {}).length}
- **Lockfile Version**: ${dependencyInfo.lockfileVersion || 'Unknown'}

### Scan Metadata
- **Scan Date**: ${timestamp}
- **npm Version**: ${metadata.npmVersion || 'Unknown'}
- **Node Version**: ${metadata.nodeVersion || 'Unknown'}
- **Total Vulnerabilities**: ${summary.total}

`;

    // All vulnerabilities details
    if (vulnerabilities.length > 0) {
      report += `## 📋 Complete Vulnerability List

| Package | Severity | Title | Fix Available |
|---------|----------|-------|---------------|
`;
      vulnerabilities.forEach(vuln => {
        const severity = this.severityLevels[vuln.severity];
        report += `| ${vuln.package} | ${severity.color} ${vuln.severity.toUpperCase()} | ${vuln.title} | ${vuln.fixAvailable ? '✅' : '❌'} |\n`;
      });
    }

    report += `
## 🛡️ Next Steps

1. **Immediate**: Address all critical and high-severity vulnerabilities
2. **Short-term**: Implement automated security scanning in CI/CD pipeline
3. **Long-term**: Establish regular dependency update and security review process

---
*Report generated by Trading Helper Bot Security Scanner*
`;

    return report;
  }

  /**
   * Calculate security score based on vulnerabilities
   */
  calculateSecurityScore(summary) {
    let score = 100;
    
    // Deduct points based on severity
    score -= (summary.critical || 0) * 25; // Critical: -25 points each
    score -= (summary.high || 0) * 10;     // High: -10 points each
    score -= (summary.moderate || 0) * 3;  // Moderate: -3 points each
    score -= (summary.low || 0) * 1;       // Low: -1 point each
    
    score = Math.max(0, score); // Minimum score of 0
    
    let grade;
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';
    
    return { score, grade };
  }

  /**
   * Run complete dependency scan
   */
  async scan() {
    console.log('🚀 Starting comprehensive dependency vulnerability scan...');
    
    try {
      // Get dependency information
      const dependencyInfo = this.getDependencyInfo();
      console.log(`📦 Analyzing ${dependencyInfo.totalPackages || 'unknown number of'} packages...`);
      
      // Run npm audit
      const auditData = this.runNpmAudit();
      if (!auditData) {
        throw new Error('Failed to run npm audit');
      }
      
      // Analyze vulnerabilities
      console.log('📊 Analyzing vulnerability data...');
      const analysis = this.analyzeVulnerabilities(auditData);
      
      // Generate reports
      console.log('📝 Generating security reports...');
      
      // Save JSON report
      const fullReport = {
        timestamp: new Date().toISOString(),
        project: 'Trading Helper Bot',
        dependencyInfo,
        analysis,
        rawAuditData: auditData
      };
      
      fs.writeFileSync(this.reportFile, JSON.stringify(fullReport, null, 2));
      
      // Generate markdown summary
      const markdownReport = this.generateMarkdownReport(analysis, dependencyInfo);
      fs.writeFileSync(this.summaryFile, markdownReport);
      
      // Display summary
      this.displaySummary(analysis);
      
      console.log(`✅ Scan complete! Reports saved:`);
      console.log(`   📄 JSON Report: ${this.reportFile}`);
      console.log(`   📋 Summary: ${this.summaryFile}`);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ Dependency scan failed:', error.message);
      throw error;
    }
  }

  /**
   * Display scan summary to console
   */
  displaySummary(analysis) {
    const { summary, recommendations } = analysis;
    const securityScore = this.calculateSecurityScore(summary);
    
    console.log('\n' + '='.repeat(60));
    console.log('🛡️  DEPENDENCY SECURITY SCAN RESULTS');
    console.log('='.repeat(60));
    console.log(`Security Score: ${securityScore.score}/100 (Grade: ${securityScore.grade})`);
    console.log('');
    
    // Summary by severity
    for (const [severity, data] of Object.entries(this.severityLevels)) {
      const count = summary[severity] || 0;
      if (count > 0) {
        console.log(`${data.color} ${severity.toUpperCase()}: ${count} vulnerabilities`);
      }
    }
    
    console.log(`\nTotal Vulnerabilities: ${summary.total}`);
    
    // Immediate actions needed
    const criticalActions = recommendations.filter(r => r.priority === 'CRITICAL' || r.priority === 'HIGH');
    if (criticalActions.length > 0) {
      console.log('\n🚨 IMMEDIATE ACTIONS REQUIRED:');
      criticalActions.forEach(action => {
        console.log(`   ${action.priority}: ${action.action}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Main execution
async function main() {
  const scanner = new DependencyScanner();
  
  try {
    const analysis = await scanner.scan();
    
    // Exit with appropriate code
    if (analysis.summary.critical > 0) {
      console.log('\n❌ Critical vulnerabilities found - immediate action required!');
      process.exit(1);
    } else if (analysis.summary.high > 0) {
      console.log('\n⚠️ High-severity vulnerabilities found - urgent action recommended!');
      process.exit(1);
    } else if (analysis.summary.moderate > 0) {
      console.log('\n⚡ Moderate vulnerabilities found - schedule fixes soon.');
      process.exit(0);
    } else {
      console.log('\n✅ No high-priority vulnerabilities found!');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Scan failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DependencyScanner; 