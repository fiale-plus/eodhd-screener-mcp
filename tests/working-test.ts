#!/usr/bin/env node

import { spawn, ChildProcess } from "child_process";
import * as path from "path";

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  data?: any;
}

class MCPDirectTest {
  private serverProcess: ChildProcess | null = null;

  async start(): Promise<void> {
    const serverPath = path.join(process.cwd(), "..", "dist", "index.js");

    this.serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        EODHD_API_KEY: process.env.EODHD_API_KEY || "demo"
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (this.serverProcess.exitCode !== null) {
      throw new Error("Server failed to start");
    }
  }

  async stop(): Promise<void> {
    if (this.serverProcess && !this.serverProcess.killed) {
      this.serverProcess.kill('SIGTERM');
    }
  }

  async sendMCPRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess?.stdin || !this.serverProcess?.stdout) {
        reject(new Error("Server not running"));
        return;
      }

      let responseBuffer = '';
      let responseReceived = false;

      const cleanup = () => {
        this.serverProcess?.stdout?.removeAllListeners('data');
        this.serverProcess?.stdout?.removeAllListeners('error');
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Request timeout'));
      }, 10000);

      this.serverProcess.stdout.on('data', (data: Buffer) => {
        if (responseReceived) return;

        responseBuffer += data.toString();

        // Try to parse complete JSON responses
        const lines = responseBuffer.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line.trim());
              if (response.id === request.id) {
                responseReceived = true;
                clearTimeout(timeout);
                cleanup();
                resolve(response);
                return;
              }
            } catch (e) {
              // Continue trying to parse
            }
          }
        }
      });

      this.serverProcess.stdout.on('error', (error) => {
        cleanup();
        clearTimeout(timeout);
        reject(error);
      });

      // Send the request
      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async testListTools(): Promise<TestResult> {
    try {
      const request = {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {}
      };

      const response = await this.sendMCPRequest(request);

      if (response.error) {
        return {
          name: "List Tools",
          success: false,
          message: `Server error: ${response.error.message}`
        };
      }

      const tools = response.result?.tools || [];
      const expectedTools = ["screen_stocks", "get_fundamentals", "get_technical_indicator", "multi_stage_screen"];
      const foundTools = tools.map((t: any) => t.name);
      const missingTools = expectedTools.filter(name => !foundTools.includes(name));

      if (missingTools.length > 0) {
        return {
          name: "List Tools",
          success: false,
          message: `Missing tools: ${missingTools.join(", ")}`
        };
      }

      return {
        name: "List Tools",
        success: true,
        message: `Found all ${tools.length} expected tools`,
        data: foundTools
      };

    } catch (error) {
      return {
        name: "List Tools",
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async testTechnicalIndicator(): Promise<TestResult> {
    try {
      const request = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "get_technical_indicator",
          arguments: {
            symbol: "AAPL.US",
            function: "rsi",
            period: 14
          }
        }
      };

      const response = await this.sendMCPRequest(request);

      if (response.error) {
        return {
          name: "Technical Indicator (RSI14)",
          success: false,
          message: `Server error: ${response.error.message}`
        };
      }

      const content = response.result?.content?.[0]?.text;
      if (!content) {
        return {
          name: "Technical Indicator (RSI14)",
          success: false,
          message: "No content returned"
        };
      }

      // Parse the JSON content
      const data = JSON.parse(content);
      if (!Array.isArray(data)) {
        return {
          name: "Technical Indicator (RSI14)",
          success: false,
          message: "Expected array of RSI values"
        };
      }

      if (data.length === 0) {
        return {
          name: "Technical Indicator (RSI14)",
          success: false,
          message: "Empty RSI data - dynamic defaults may not be working"
        };
      }

      // Validate RSI values
      const firstEntry = data[0];
      if (!firstEntry.date || typeof firstEntry.rsi !== 'number') {
        return {
          name: "Technical Indicator (RSI14)",
          success: false,
          message: "Invalid RSI data structure"
        };
      }

      if (firstEntry.rsi < 0 || firstEntry.rsi > 100) {
        return {
          name: "Technical Indicator (RSI14)",
          success: false,
          message: `RSI value out of bounds: ${firstEntry.rsi}`
        };
      }

      return {
        name: "Technical Indicator (RSI14)",
        success: true,
        message: `Got ${data.length} RSI values, latest: ${firstEntry.rsi.toFixed(2)} on ${firstEntry.date}`,
        data: { count: data.length, latest: firstEntry }
      };

    } catch (error) {
      return {
        name: "Technical Indicator (RSI14)",
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async testLongPeriodIndicator(): Promise<TestResult> {
    try {
      const request = {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "get_technical_indicator",
          arguments: {
            symbol: "AAPL.US",
            function: "rsi",
            period: 200
          }
        }
      };

      const response = await this.sendMCPRequest(request);

      if (response.error) {
        return {
          name: "Long Period RSI (RSI200)",
          success: false,
          message: `Server error: ${response.error.message}`
        };
      }

      const content = response.result?.content?.[0]?.text;
      if (!content) {
        return {
          name: "Long Period RSI (RSI200)",
          success: false,
          message: "No content returned"
        };
      }

      const data = JSON.parse(content);
      if (!Array.isArray(data) || data.length === 0) {
        return {
          name: "Long Period RSI (RSI200)",
          success: false,
          message: "RSI200 returned empty - dynamic 1.5x defaults not working!"
        };
      }

      // This is the key regression test - RSI200 should work with dynamic defaults
      return {
        name: "Long Period RSI (RSI200)",
        success: true,
        message: `✅ RSI200 dynamic defaults working! Got ${data.length} values`,
        data: { count: data.length, latest: data[0] }
      };

    } catch (error) {
      return {
        name: "Long Period RSI (RSI200)",
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async testScreener(): Promise<TestResult> {
    try {
      const request = {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "screen_stocks",
          arguments: {
            limit: 5
          }
        }
      };

      const response = await this.sendMCPRequest(request);

      if (response.error) {
        return {
          name: "Stock Screener",
          success: false,
          message: `Server error: ${response.error.message}`
        };
      }

      const content = response.result?.content?.[0]?.text;
      if (!content) {
        return {
          name: "Stock Screener",
          success: false,
          message: "No content returned"
        };
      }

      const data = JSON.parse(content);
      if (!data.data || !Array.isArray(data.data)) {
        return {
          name: "Stock Screener",
          success: false,
          message: "Invalid screener response format"
        };
      }

      return {
        name: "Stock Screener",
        success: true,
        message: `Got ${data.data.length} stocks`,
        data: { count: data.data.length, sample: data.data[0]?.code }
      };

    } catch (error) {
      return {
        name: "Stock Screener",
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }
}

async function runWorkingTests() {
  console.log("🚀 EODHD MCP Server - Working Regression Tests\n");

  const client = new MCPDirectTest();
  const results: TestResult[] = [];

  try {
    console.log("📡 Starting MCP Server...");
    await client.start();
    console.log("✅ Server started\n");

    // Run core tests
    results.push(await client.testListTools());
    results.push(await client.testTechnicalIndicator());
    results.push(await client.testLongPeriodIndicator()); // KEY REGRESSION TEST
    results.push(await client.testScreener());

    // Print results
    console.log("📊 TEST RESULTS:");
    console.log("================");

    let passed = 0;
    let failed = 0;

    results.forEach(result => {
      const icon = result.success ? "✅" : "❌";
      console.log(`${icon} ${result.name}: ${result.message}`);

      if (result.data) {
        console.log(`   📈 ${JSON.stringify(result.data)}`);
      }

      result.success ? passed++ : failed++;
    });

    console.log(`\n🎯 SUMMARY: ${passed}/${results.length} tests passed`);

    if (failed === 0) {
      console.log("🎉 All regression tests PASSED!");
    } else {
      console.log(`❌ ${failed} tests FAILED - regression issues detected!`);
    }

  } catch (error) {
    console.log(`❌ Test setup failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    console.log("\n🔄 Stopping server...");
    await client.stop();
    console.log("✅ Server stopped");
  }
}

runWorkingTests().catch(console.error);