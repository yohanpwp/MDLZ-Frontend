#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Invoice Validation System
 * 
 * This script runs all test suites including unit tests, integration tests,
 * end-to-end tests, and performance tests with detailed reporting.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TEST_SUITES = {
  unit: {
    command: 'npm run test:run',
    description: 'Unit and integration tests',
    timeout: 60000
  },
  e2e: {
    command: 'npm run test:e2e',
    description: 'End-to-end tests',
    timeout: 300000
  },
  performance: {
    command: 'npm run test:performance',
    description: 'Performance and load tests',
    timeout: 180000
  }
};

class TestRunner {
  constructor() {
    this.results = {};
    this.startTime = Date.now();
  }

  async runSuite(suiteName, suite) {
    console.log(`\n🧪 Running ${suite.description}...`);
    console.log(`Command: ${suite.command}`);
    console.log('─'.repeat(50));

    const suiteStartTime = Date.now();
    
    try {
      const output = execSync(suite.command, {
        encoding: 'utf8',
        timeout: suite.timeout,
        stdio: 'pipe'
      });

      const duration = Date.now() - suiteStartTime;
      
      this.results[suiteName] = {
        status: 'passed',
        duration,
        output: output.toString()
      };

      console.log(`✅ ${suite.description} passed (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - suiteStartTime;
      
      this.results[suiteName] = {
        status: 'failed',
        duration,
        error: error.message,
        output: error.stdout ? error.stdout.toString() : '',
        stderr: error.stderr ? error.stderr.toString() : ''
      };

      console.log(`❌ ${suite.description} failed (${duration}ms)`);
      console.log(`Error: ${error.message}`);
    }
  }

  async runAll() {
    console.log('🚀 Starting comprehensive test suite...');
    console.log(`Timestamp: ${new Date().toISOString()}`);

    for (const [suiteName, suite] of Object.entries(TEST_SUITES)) {
      await this.runSuite(suiteName, suite);
    }

    this.generateReport();
  }

  async runSpecific(suiteNames) {
    console.log(`🎯 Running specific test suites: ${suiteNames.join(', ')}`);
    
    for (const suiteName of suiteNames) {
      if (TEST_SUITES[suiteName]) {
        await this.runSuite(suiteName, TEST_SUITES[suiteName]);
      } else {
        console.log(`⚠️  Unknown test suite: ${suiteName}`);
      }
    }

    this.generateReport();
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passedSuites = Object.values(this.results).filter(r => r.status === 'passed').length;
    const failedSuites = Object.values(this.results).filter(r => r.status === 'failed').length;
    const totalSuites = Object.keys(this.results).length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Test Suites: ${totalSuites}`);
    console.log(`✅ Passed: ${passedSuites}`);
    console.log(`❌ Failed: ${failedSuites}`);
    console.log(`Success Rate: ${((passedSuites / totalSuites) * 100).toFixed(1)}%`);

    console.log('\n📋 DETAILED RESULTS:');
    Object.entries(this.results).forEach(([suiteName, result]) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`${status} ${suiteName}: ${result.duration}ms`);
      
      if (result.status === 'failed') {
        console.log(`   Error: ${result.error}`);
      }
    });

    // Generate JSON report
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration,
      summary: {
        total: totalSuites,
        passed: passedSuites,
        failed: failedSuites,
        successRate: (passedSuites / totalSuites) * 100
      },
      results: this.results
    };

    const reportPath = path.join(process.cwd(), 'test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    // Exit with appropriate code
    process.exit(failedSuites > 0 ? 1 : 0);
  }
}

// CLI handling
const args = process.argv.slice(2);
const runner = new TestRunner();

if (args.length === 0) {
  // Run all tests
  runner.runAll();
} else if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage: node test-runner.js [options] [suites...]

Options:
  --help, -h     Show this help message
  --list, -l     List available test suites

Test Suites:
  unit           Unit and integration tests
  e2e            End-to-end tests  
  performance    Performance and load tests

Examples:
  node test-runner.js                    # Run all test suites
  node test-runner.js unit e2e          # Run specific suites
  node test-runner.js performance       # Run only performance tests
`);
} else if (args[0] === '--list' || args[0] === '-l') {
  console.log('Available test suites:');
  Object.entries(TEST_SUITES).forEach(([name, suite]) => {
    console.log(`  ${name.padEnd(12)} - ${suite.description}`);
  });
} else {
  // Run specific suites
  const requestedSuites = args.filter(arg => !arg.startsWith('--'));
  runner.runSpecific(requestedSuites);
}