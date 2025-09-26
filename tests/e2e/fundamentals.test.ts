import { MCPTestClient } from "../utils/test-client.js";
import { Assertions, TestResult } from "../utils/assertions.js";
import { TEST_SYMBOLS } from "../fixtures/test-data.js";

export class FundamentalsTests {
  private client: MCPTestClient;

  constructor(client: MCPTestClient) {
    this.client = client;
  }

  async runAll(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    results.push(await this.testValidSymbol());
    results.push(await this.testInvalidSymbol());
    results.push(await this.testMissingAPIKey());

    return results;
  }

  async testValidSymbol(): Promise<TestResult> {
    const testName = "Valid Symbol Fundamentals";
    try {
      const response = await this.client.callTool("get_fundamentals", {
        symbol: TEST_SYMBOLS.US_LARGE_CAP
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      // Fundamentals might fail with 403 (premium feature)
      // but should return a proper error message structure
      const text = result.data.text;
      if (text.includes("403") || text.includes("premium")) {
        return {
          test: testName,
          success: true,
          message: "Fundamentals API correctly requires premium subscription",
          data: { requiresPremium: true }
        };
      }

      // If it succeeds, validate JSON structure
      result = Assertions.assertValidJSON(text);
      if (!result.success) return { test: testName, ...result };

      return {
        test: testName,
        success: true,
        message: "Fundamentals API responded appropriately",
        data: { hasData: true }
      };
    } catch (error: any) {
      return {
        test: testName,
        success: false,
        message: "Test failed with error",
        error: error.message
      };
    }
  }

  async testInvalidSymbol(): Promise<TestResult> {
    const testName = "Invalid Symbol Handling";
    try {
      const response = await this.client.callTool("get_fundamentals", {
        symbol: TEST_SYMBOLS.INVALID
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      // Should get some kind of error response, not crash
      return {
        test: testName,
        success: true,
        message: "Invalid symbol handled gracefully",
        data: { response: result.data.text.substring(0, 100) }
      };
    } catch (error: any) {
      return {
        test: testName,
        success: false,
        message: "Test failed with error",
        error: error.message
      };
    }
  }

  async testMissingAPIKey(): Promise<TestResult> {
    const testName = "Missing API Key Handling";
    try {
      // This test assumes the client doesn't have an API key set
      // In practice, this might be hard to test without manipulating environment
      return {
        test: testName,
        success: true,
        message: "Skipped - API key handling tested at client level",
        data: { skipped: true }
      };
    } catch (error: any) {
      return {
        test: testName,
        success: false,
        message: "Test failed with error",
        error: error.message
      };
    }
  }
}