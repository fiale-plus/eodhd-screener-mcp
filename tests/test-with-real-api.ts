#!/usr/bin/env node

/**
 * Test script for running with a real EODHD API key
 * Usage: EODHD_API_KEY=your_real_key tsx test-with-real-api.ts
 */

import { spawn, ChildProcess } from "child_process";
import * as path from "path";

async function testWithRealAPI() {
  console.log("🔑 EODHD MCP Server - Real API Test\n");

  const apiKey = process.env.EODHD_API_KEY;

  if (!apiKey || apiKey === "demo") {
    console.log("❌ Please set EODHD_API_KEY environment variable with your real API key");
    console.log("   Usage: EODHD_API_KEY=your_key tsx test-with-real-api.ts");
    return;
  }

  console.log("✅ Real API key detected");
  console.log(`📊 API Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}\n`);

  let serverProcess: ChildProcess | null = null;

  try {
    // Start server
    const serverPath = path.join(process.cwd(), "..", "dist", "index.js");
    serverProcess = spawn("node", [serverPath], {
      env: { ...process.env, EODHD_API_KEY: apiKey },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test screener with real API
    console.log("🔍 Testing screener with real API...");
    const screenerResult = await sendMCPRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: "screen_stocks",
        arguments: { limit: 3 }
      }
    });

    if (screenerResult.result?.content?.[0]?.text) {
      const content = screenerResult.result.content[0].text;

      if (content.startsWith("Error")) {
        console.log("⚠️  Screener still returning error - check API permissions");
        console.log(`   ${content.substring(0, 100)}`);
      } else {
        try {
          const data = JSON.parse(content);
          console.log(`✅ Screener success: ${data.data?.length || 0} stocks returned`);
          if (data.data?.[0]) {
            console.log(`   Sample: ${data.data[0].code} - $${data.data[0].adjusted_close}`);
          }
        } catch (e) {
          console.log("⚠️  Could not parse screener response");
        }
      }
    }

    // Test fundamentals with real API
    console.log("\n💰 Testing fundamentals with real API...");
    const fundamentalsResult = await sendMCPRequest(serverProcess, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get_fundamentals",
        arguments: { symbol: "AAPL.US" }
      }
    });

    if (fundamentalsResult.result?.content?.[0]?.text) {
      const content = fundamentalsResult.result.content[0].text;

      if (content.startsWith("Error") || content.includes("403")) {
        console.log("⚠️  Fundamentals requires premium subscription");
        console.log(`   ${content.substring(0, 100)}`);
      } else {
        try {
          const data = JSON.parse(content);
          console.log("✅ Fundamentals success: Data retrieved");
          console.log(`   Company: ${data.General?.Name || 'N/A'}`);
          console.log(`   Market Cap: ${data.Highlights?.MarketCapitalization || 'N/A'}`);
        } catch (e) {
          console.log("⚠️  Could not parse fundamentals response");
        }
      }
    }

    console.log("\n🎯 Real API test completed!");

  } catch (error) {
    console.log(`❌ Test failed: ${error}`);
  } finally {
    if (serverProcess) {
      serverProcess.kill();
    }
  }
}

async function sendMCPRequest(process: ChildProcess, request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (!process.stdin || !process.stdout) {
      reject(new Error("Process streams not available"));
      return;
    }

    let responseBuffer = '';
    const timeout = setTimeout(() => reject(new Error('Timeout')), 10000);

    const onData = (data: Buffer) => {
      responseBuffer += data.toString();
      const lines = responseBuffer.split('\n');

      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line.trim());
            if (response.id === request.id) {
              clearTimeout(timeout);
              process.stdout?.removeListener('data', onData);
              resolve(response);
              return;
            }
          } catch (e) {
            // Continue
          }
        }
      }
    };

    process.stdout.on('data', onData);
    process.stdin.write(JSON.stringify(request) + '\n');
  });
}

testWithRealAPI().catch(console.error);