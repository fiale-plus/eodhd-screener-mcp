import { MCPTestClient } from "../utils/test-client.js";
import { Assertions, TestResult } from "../utils/assertions.js";
import { TEST_SCREENER_FILTERS, REASONABLE_PRICE_BOUNDS } from "../fixtures/test-data.js";

export class ScreenerTests {
  private client: MCPTestClient;

  constructor(client: MCPTestClient) {
    this.client = client;
  }

  async runAll(): Promise<TestResult[]> {
    const results = [];

    results.push(await this.testBasicScreening());
    results.push(await this.testFilteredScreening());
    results.push(await this.testSortedResults());
    results.push(await this.testPagination());
    results.push(await this.testEmptyResults());

    return results;
  }

  async testBasicScreening() {
    const testName = "Basic Stock Screening";
    try {
      const response = await this.client.callTool("screen_stocks", {
        limit: 10
      });

      // Validate response structure
      let result = Assertions.assertResponseStructure(response, ["content"]);
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      // Parse and validate JSON content
      result = Assertions.assertValidJSON(result.data.text);
      if (!result.success) return { test: testName, ...result };

      const data = result.data;
      if (!data.data || !Array.isArray(data.data)) {
        return {
          test: testName,
          success: false,
          message: "Response missing data array"
        };
      }

      // Validate data structure
      result = Assertions.assertArrayLength(data.data, 1, 10);
      if (!result.success) return { test: testName, ...result };

      // Validate first stock entry
      const firstStock = data.data[0];
      const requiredFields = ["code", "name", "adjusted_close", "market_capitalization"];
      for (const field of requiredFields) {
        if (!(field in firstStock)) {
          return {
            test: testName,
            success: false,
            message: `Missing required field: ${field}`
          };
        }
      }

      // Validate price is reasonable
      result = Assertions.assertNumericRange(
        firstStock.adjusted_close,
        REASONABLE_PRICE_BOUNDS.min,
        REASONABLE_PRICE_BOUNDS.max
      );
      if (!result.success) return { test: testName, ...result };

      return {
        test: testName,
        success: true,
        message: `Retrieved ${data.data.length} stocks successfully`,
        data: data.data.slice(0, 2) // Include sample for verification
      };
    } catch (error) {
      return {
        test: testName,
        success: false,
        message: "Test failed with error",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async testFilteredScreening() {
    const testName = "Filtered Stock Screening";
    try {
      const response = await this.client.callTool("screen_stocks", {
        filters: TEST_SCREENER_FILTERS.LARGE_CAP,
        limit: 5
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertValidJSON(result.data.text);
      if (!result.success) return { test: testName, ...result };

      const data = result.data;
      if (!data.data || !Array.isArray(data.data)) {
        return {
          test: testName,
          success: false,
          message: "Response missing data array"
        };
      }

      // Validate all results meet the filter criteria
      for (const stock of data.data) {
        if (stock.market_capitalization <= 1000000000) {
          return {
            test: testName,
            success: false,
            message: `Stock ${stock.code} doesn't meet large cap filter: ${stock.market_capitalization}`
          };
        }
      }

      return {
        test: testName,
        success: true,
        message: `Filtered screening returned ${data.data.length} large cap stocks`,
        data: data.data.map((s: any) => ({ code: s.code, market_cap: s.market_capitalization }))
      };
    } catch (error) {
      return {
        test: testName,
        success: false,
        message: "Test failed with error",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async testSortedResults() {
    const testName = "Sorted Stock Results";
    try {
      const response = await this.client.callTool("screen_stocks", {
        sort: "market_capitalization.desc",
        limit: 3
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertValidJSON(result.data.text);
      if (!result.success) return { test: testName, ...result };

      const data = result.data;
      if (!data.data || data.data.length < 2) {
        return {
          test: testName,
          success: false,
          message: "Need at least 2 results to validate sorting"
        };
      }

      // Validate descending sort by market cap
      for (let i = 1; i < data.data.length; i++) {
        if (data.data[i-1].market_capitalization < data.data[i].market_capitalization) {
          return {
            test: testName,
            success: false,
            message: "Results not sorted by market cap descending"
          };
        }
      }

      return {
        test: testName,
        success: true,
        message: `Results properly sorted by market cap descending`,
        data: data.data.map((s: any) => ({ code: s.code, market_cap: s.market_capitalization }))
      };
    } catch (error) {
      return {
        test: testName,
        success: false,
        message: "Test failed with error",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async testPagination() {
    const testName = "Pagination Support";
    try {
      const response = await this.client.callTool("screen_stocks", {
        limit: 2,
        offset: 0
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertValidJSON(result.data.text);
      if (!result.success) return { test: testName, ...result };

      const data = result.data;
      result = Assertions.assertArrayLength(data.data, 1, 2);
      if (!result.success) return { test: testName, ...result };

      return {
        test: testName,
        success: true,
        message: `Pagination working: got ${data.data.length} results with limit 2`,
        data: { count: data.data.length, limit: 2 }
      };
    } catch (error) {
      return {
        test: testName,
        success: false,
        message: "Test failed with error",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async testEmptyResults() {
    const testName = "Handle Empty Results";
    try {
      // Use a filter that should return no results
      const response = await this.client.callTool("screen_stocks", {
        filters: [["market_capitalization", ">", 999999999999999]], // Impossibly high market cap
        limit: 10
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertValidJSON(result.data.text);
      if (!result.success) return { test: testName, ...result };

      const data = result.data;
      if (!data.data || !Array.isArray(data.data)) {
        return {
          test: testName,
          success: false,
          message: "Response should still have data array (even if empty)"
        };
      }

      return {
        test: testName,
        success: true,
        message: `Empty results handled correctly: ${data.data.length} results`,
        data: { resultCount: data.data.length }
      };
    } catch (error) {
      return {
        test: testName,
        success: false,
        message: "Test failed with error",
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}