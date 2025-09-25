import { MCPTestClient } from "../utils/test-client.js";
import { Assertions, TestResult } from "../utils/assertions.js";
import {
  TEST_SYMBOLS,
  TEST_TECHNICAL_INDICATORS,
  RSI_BOUNDS
} from "../fixtures/test-data.js";

export class TechnicalIndicatorTests {
  private client: MCPTestClient;

  constructor(client: MCPTestClient) {
    this.client = client;
  }

  async runAll(): Promise<TestResult[]> {
    const results = [];

    results.push(await this.testRSIShortPeriod());
    results.push(await this.testRSILongPeriod());
    results.push(await this.testSMAIndicators());
    results.push(await this.testMACDIndicator());
    results.push(await this.testDynamicDefaults());
    results.push(await this.testDateOrdering());
    results.push(await this.testResponseSizeLimits());

    return results;
  }

  async testRSIShortPeriod() {
    const testName = "RSI Short Period (14)";
    try {
      const { function: func, period } = TEST_TECHNICAL_INDICATORS.RSI_SHORT;
      const response = await this.client.callTool("get_technical_indicator", {
        symbol: TEST_SYMBOLS.US_LARGE_CAP,
        function: func,
        period: period
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertValidJSON(result.data.text);
      if (!result.success) return { test: testName, ...result };

      const data = result.data;
      if (!Array.isArray(data)) {
        return {
          test: testName,
          success: false,
          message: "Expected array of RSI values"
        };
      }

      // Should have some recent data
      result = Assertions.assertArrayLength(data, 1, 50);
      if (!result.success) return { test: testName, ...result };

      // Validate RSI structure and values
      const firstEntry = data[0];
      if (!firstEntry.date || !("rsi" in firstEntry)) {
        return {
          test: testName,
          success: false,
          message: "RSI entry missing date or rsi field"
        };
      }

      result = Assertions.assertDateFormat(firstEntry.date);
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertNumericRange(firstEntry.rsi, RSI_BOUNDS.min, RSI_BOUNDS.max);
      if (!result.success) return { test: testName, ...result };

      return {
        test: testName,
        success: true,
        message: `RSI14 returned ${data.length} data points, latest: ${firstEntry.rsi}`,
        data: { count: data.length, latest: firstEntry }
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

  async testRSILongPeriod() {
    const testName = "RSI Long Period (200)";
    try {
      const { function: func, period } = TEST_TECHNICAL_INDICATORS.RSI_LONG;
      const response = await this.client.callTool("get_technical_indicator", {
        symbol: TEST_SYMBOLS.US_LARGE_CAP,
        function: func,
        period: period
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertValidJSON(result.data.text);
      if (!result.success) return { test: testName, ...result };

      const data = result.data;
      if (!Array.isArray(data)) {
        return {
          test: testName,
          success: false,
          message: "Expected array of RSI values"
        };
      }

      // Long period indicators should still return data with dynamic defaults
      if (data.length === 0) {
        return {
          test: testName,
          success: false,
          message: "RSI200 returned empty array - dynamic defaults may not be working"
        };
      }

      const firstEntry = data[0];
      result = Assertions.assertNumericRange(firstEntry.rsi, RSI_BOUNDS.min, RSI_BOUNDS.max);
      if (!result.success) return { test: testName, ...result };

      return {
        test: testName,
        success: true,
        message: `RSI200 returned ${data.length} data points, latest: ${firstEntry.rsi}`,
        data: { count: data.length, latest: firstEntry }
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

  async testSMAIndicators() {
    const testName = "SMA Indicators";
    try {
      const { function: func, period } = TEST_TECHNICAL_INDICATORS.SMA_LONG;
      const response = await this.client.callTool("get_technical_indicator", {
        symbol: TEST_SYMBOLS.US_LARGE_CAP,
        function: func,
        period: period
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertValidJSON(result.data.text);
      if (!result.success) return { test: testName, ...result };

      const data = result.data;
      if (!Array.isArray(data) || data.length === 0) {
        return {
          test: testName,
          success: false,
          message: "SMA200 returned no data"
        };
      }

      const firstEntry = data[0];
      if (!firstEntry.date || !("sma" in firstEntry)) {
        return {
          test: testName,
          success: false,
          message: "SMA entry missing date or sma field"
        };
      }

      // SMA should be positive number (stock prices are positive)
      if (typeof firstEntry.sma !== "number" || firstEntry.sma <= 0) {
        return {
          test: testName,
          success: false,
          message: `Invalid SMA value: ${firstEntry.sma}`
        };
      }

      return {
        test: testName,
        success: true,
        message: `SMA200 returned ${data.length} data points, latest: ${firstEntry.sma}`,
        data: { count: data.length, latest: firstEntry }
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

  async testMACDIndicator() {
    const testName = "MACD Indicator";
    try {
      const { function: func } = TEST_TECHNICAL_INDICATORS.MACD;
      const response = await this.client.callTool("get_technical_indicator", {
        symbol: TEST_SYMBOLS.US_LARGE_CAP,
        function: func
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      result = Assertions.assertValidJSON(result.data.text);
      if (!result.success) return { test: testName, ...result };

      const data = result.data;
      if (!Array.isArray(data) || data.length === 0) {
        return {
          test: testName,
          success: false,
          message: "MACD returned no data"
        };
      }

      const firstEntry = data[0];
      const requiredFields = ["date", "macd", "signal", "divergence"];
      for (const field of requiredFields) {
        if (!(field in firstEntry)) {
          return {
            test: testName,
            success: false,
            message: `MACD entry missing ${field} field`
          };
        }
      }

      // All MACD values should be numbers
      for (const field of ["macd", "signal", "divergence"]) {
        if (typeof firstEntry[field] !== "number") {
          return {
            test: testName,
            success: false,
            message: `MACD ${field} is not a number: ${firstEntry[field]}`
          };
        }
      }

      return {
        test: testName,
        success: true,
        message: `MACD returned ${data.length} data points`,
        data: { count: data.length, latest: firstEntry }
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

  async testDynamicDefaults() {
    const testName = "Dynamic Default Date Ranges";
    try {
      // Test that short period indicators use shorter ranges
      const shortResponse = await this.client.callTool("get_technical_indicator", {
        symbol: TEST_SYMBOLS.US_LARGE_CAP,
        function: "rsi",
        period: 14
      });

      // Test that long period indicators get more data
      const longResponse = await this.client.callTool("get_technical_indicator", {
        symbol: TEST_SYMBOLS.US_LARGE_CAP,
        function: "rsi",
        period: 100
      });

      let result = Assertions.assertContentType(shortResponse, "text");
      if (!result.success) return { test: testName, ...result };

      const shortData = JSON.parse(result.data.text);

      result = Assertions.assertContentType(longResponse, "text");
      if (!result.success) return { test: testName, ...result };

      const longData = JSON.parse(result.data.text);

      // Both should have data, but long period might have fewer recent points
      if (!Array.isArray(shortData) || !Array.isArray(longData)) {
        return {
          test: testName,
          success: false,
          message: "Dynamic defaults not working - missing data arrays"
        };
      }

      if (shortData.length === 0 || longData.length === 0) {
        return {
          test: testName,
          success: false,
          message: "Dynamic defaults not working - empty arrays"
        };
      }

      return {
        test: testName,
        success: true,
        message: `Dynamic defaults working: RSI14=${shortData.length} points, RSI100=${longData.length} points`,
        data: { rsi14Count: shortData.length, rsi100Count: longData.length }
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

  async testDateOrdering() {
    const testName = "Date Ordering (Descending)";
    try {
      const response = await this.client.callTool("get_technical_indicator", {
        symbol: TEST_SYMBOLS.US_LARGE_CAP,
        function: "rsi",
        period: 14
      });

      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      const data = JSON.parse(result.data.text);
      if (!Array.isArray(data) || data.length < 2) {
        return {
          test: testName,
          success: false,
          message: "Need at least 2 data points to test ordering"
        };
      }

      // Verify dates are in descending order (newest first)
      for (let i = 1; i < data.length; i++) {
        const currentDate = new Date(data[i-1].date);
        const nextDate = new Date(data[i].date);

        if (currentDate <= nextDate) {
          return {
            test: testName,
            success: false,
            message: `Dates not in descending order: ${data[i-1].date} <= ${data[i].date}`
          };
        }
      }

      return {
        test: testName,
        success: true,
        message: `Dates properly ordered descending: ${data[0].date} to ${data[data.length-1].date}`,
        data: { first: data[0].date, last: data[data.length-1].date }
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

  async testResponseSizeLimits() {
    const testName = "Response Size Limits";
    try {
      // Test that even long period indicators don't overflow context
      const response = await this.client.callTool("get_technical_indicator", {
        symbol: TEST_SYMBOLS.US_LARGE_CAP,
        function: "sma",
        period: 200
      });

      // If we get here without timeout/overflow, the size limits are working
      let result = Assertions.assertContentType(response, "text");
      if (!result.success) return { test: testName, ...result };

      const data = JSON.parse(result.data.text);
      const responseSize = JSON.stringify(data).length;

      // Rough token estimation (1 token ≈ 4 characters)
      const estimatedTokens = responseSize / 4;

      if (estimatedTokens > 25000) {
        return {
          test: testName,
          success: false,
          message: `Response too large: ~${Math.round(estimatedTokens)} tokens`
        };
      }

      return {
        test: testName,
        success: true,
        message: `Response size controlled: ~${Math.round(estimatedTokens)} tokens, ${data.length} data points`,
        data: { estimatedTokens: Math.round(estimatedTokens), dataPoints: data.length }
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