#!/usr/bin/env node

import { MCPTestClient } from "../utils/test-client.js";
import { Assertions, TestResult } from "../utils/assertions.js";
import { ScreenerTests } from "./screener.test.js";
import { TechnicalIndicatorTests } from "./technical-indicators.test.js";
import { FundamentalsTests } from "./fundamentals.test.js";
import { EXPECTED_TOOL_NAMES } from "../fixtures/test-data.js";

interface TestSuiteResult {
  suite: string;
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
}

class RegressionTestSuite {
  private client: MCPTestClient;

  constructor() {
    this.client = new MCPTestClient({
      timeout: 30000,
      apiKey: process.env.EODHD_API_KEY
    });
  }

  async run(): Promise<void> {
    console.log("🚀 Starting EODHD MCP Server Regression Tests\n");

    try {
      await this.client.start();
      console.log("✅ MCP Server started successfully\n");

      // Run health check
      const healthCheck = await this.runHealthCheck();
      this.printTestResult(healthCheck);

      if (!healthCheck.success) {
        console.log("❌ Health check failed, aborting regression tests");
        return;
      }

      // Run tool verification
      const toolCheck = await this.runToolVerification();
      this.printTestResult(toolCheck);

      // Run test suites
      const suiteResults: TestSuiteResult[] = [];

      suiteResults.push(await this.runTestSuite("Screener Tests", new ScreenerTests(this.client)));
      suiteResults.push(await this.runTestSuite("Technical Indicators", new TechnicalIndicatorTests(this.client)));
      suiteResults.push(await this.runTestSuite("Fundamentals Tests", new FundamentalsTests(this.client)));

      // Print summary
      this.printSummary(suiteResults);

    } catch (error: any) {
      console.log(`❌ Regression tests failed: ${error.message}`);
    } finally {
      await this.client.stop();
      console.log("\n🔄 MCP Server stopped");
    }
  }

  private async runHealthCheck(): Promise<TestResult> {
    try {
      const isHealthy = await this.client.healthCheck();

      if (isHealthy) {
        return {
          success: true,
          message: "MCP Server health check passed"
        };
      } else {
        return {
          success: false,
          message: "MCP Server health check failed"
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: "Health check error",
        error: error.message
      };
    }
  }

  private async runToolVerification(): Promise<TestResult> {
    try {
      const tools = await this.client.listTools();

      const toolsData = tools as any;
      if (!toolsData.tools || !Array.isArray(toolsData.tools)) {
        return {
          success: false,
          message: "Tools list is not an array"
        };
      }

      // Check all expected tools are present
      const toolNames = toolsData.tools.map((t: any) => t.name);
      const missingTools = EXPECTED_TOOL_NAMES.filter(name => !toolNames.includes(name));

      if (missingTools.length > 0) {
        return {
          success: false,
          message: `Missing tools: ${missingTools.join(", ")}`
        };
      }

      return {
        success: true,
        message: `All ${EXPECTED_TOOL_NAMES.length} expected tools found`,
        data: toolNames
      };
    } catch (error: any) {
      return {
        success: false,
        message: "Tool verification error",
        error: error.message
      };
    }
  }

  private async runTestSuite(suiteName: string, testSuite: any): Promise<TestSuiteResult> {
    console.log(`\n📋 Running ${suiteName}...`);

    const results: TestResult[] = await testSuite.runAll();

    let passed = 0;
    let failed = 0;
    let skipped = 0;

    results.forEach((result: TestResult) => {
      this.printTestResult(result);

      if (result.success) {
        if (result.data?.skipped) {
          skipped++;
        } else {
          passed++;
        }
      } else {
        failed++;
      }
    });

    const summary = {
      total: results.length,
      passed,
      failed,
      skipped
    };

    console.log(`\n📊 ${suiteName} Summary: ${passed}/${results.length} passed, ${failed} failed, ${skipped} skipped`);

    return {
      suite: suiteName,
      results,
      summary
    };
  }

  private printTestResult(result: TestResult): void {
    const testName = (result as any).test || "Test";
    const icon = result.success ? "✅" : "❌";
    const message = result.message;

    console.log(`${icon} ${testName}: ${message}`);

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.data && !result.data.skipped) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2).substring(0, 200)}${JSON.stringify(result.data).length > 200 ? "..." : ""}`);
    }
  }

  private printSummary(suiteResults: TestSuiteResult[]): void {
    console.log("\n🎯 REGRESSION TEST SUMMARY");
    console.log("========================");

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;

    suiteResults.forEach(suite => {
      console.log(`\n${suite.suite}:`);
      console.log(`  ✅ Passed: ${suite.summary.passed}`);
      console.log(`  ❌ Failed: ${suite.summary.failed}`);
      console.log(`  ⏭️  Skipped: ${suite.summary.skipped}`);

      totalTests += suite.summary.total;
      totalPassed += suite.summary.passed;
      totalFailed += suite.summary.failed;
      totalSkipped += suite.summary.skipped;
    });

    console.log("\n🏁 OVERALL RESULTS:");
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${totalPassed}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   ⏭️  Skipped: ${totalSkipped}`);
    console.log(`   📊 Success Rate: ${Math.round((totalPassed / (totalTests - totalSkipped)) * 100)}%`);

    if (totalFailed > 0) {
      console.log("\n⚠️  Some tests failed - check output above for details");
      process.exit(1);
    } else {
      console.log("\n🎉 All tests passed!");
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new RegressionTestSuite();
  suite.run().catch(console.error);
}

export { RegressionTestSuite };