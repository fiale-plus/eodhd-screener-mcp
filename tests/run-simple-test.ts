#!/usr/bin/env node

import { SimpleMCPTestClient } from "./utils/simple-test-client.js";

async function runBasicTest() {
  console.log("🚀 Starting Basic EODHD MCP Server Test\n");

  const client = new SimpleMCPTestClient({
    timeout: 15000,
    apiKey: process.env.EODHD_API_KEY
  });

  try {
    console.log("📡 Starting MCP server...");
    await client.start();
    console.log("✅ Server started\n");

    // Test 1: Health check
    console.log("🔍 Running health check...");
    const isHealthy = await client.healthCheck();
    if (isHealthy) {
      console.log("✅ Health check passed");
    } else {
      console.log("❌ Health check failed");
      return;
    }

    // Test 2: List tools
    console.log("\n🛠️  Listing available tools...");
    const toolsResult = await client.listTools();
    if (toolsResult.success && toolsResult.data?.tools) {
      console.log(`✅ Found ${toolsResult.data.tools.length} tools:`);
      toolsResult.data.tools.forEach((tool: any) => {
        console.log(`   - ${tool.name}: ${tool.description?.substring(0, 50)}...`);
      });
    } else {
      console.log(`❌ Failed to list tools: ${toolsResult.error}`);
      return;
    }

    // Test 3: Try technical indicator (basic test)
    console.log("\n📊 Testing technical indicator (RSI14)...");
    const rsiResult = await client.callTool("get_technical_indicator", {
      symbol: "AAPL.US",
      function: "rsi",
      period: 14
    });

    if (rsiResult.success) {
      console.log("✅ Technical indicator test passed");
      if (rsiResult.data?.content?.[0]?.text) {
        try {
          const data = JSON.parse(rsiResult.data.content[0].text);
          if (Array.isArray(data) && data.length > 0) {
            console.log(`   📈 Got ${data.length} RSI data points`);
            console.log(`   📅 Latest: ${data[0].date} = ${data[0].rsi.toFixed(2)}`);
          } else {
            console.log("   ⚠️  No data points returned");
          }
        } catch (e) {
          console.log("   ⚠️  Could not parse response data");
        }
      }
    } else {
      console.log(`❌ Technical indicator test failed: ${rsiResult.error}`);
    }

    // Test 4: Try screener (basic test)
    console.log("\n🔍 Testing stock screener...");
    const screenerResult = await client.callTool("screen_stocks", {
      limit: 3
    });

    if (screenerResult.success) {
      console.log("✅ Stock screener test passed");
      if (screenerResult.data?.content?.[0]?.text) {
        try {
          const data = JSON.parse(screenerResult.data.content[0].text);
          if (data.data && Array.isArray(data.data) && data.data.length > 0) {
            console.log(`   🏢 Got ${data.data.length} stock results`);
            console.log(`   💰 Sample: ${data.data[0].code} at $${data.data[0].adjusted_close}`);
          } else {
            console.log("   ⚠️  No stock data returned");
          }
        } catch (e) {
          console.log("   ⚠️  Could not parse screener data");
        }
      }
    } else {
      console.log(`❌ Stock screener test failed: ${screenerResult.error}`);
    }

    console.log("\n🎉 Basic tests completed!");

  } catch (error) {
    console.log(`❌ Test failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    console.log("\n🔄 Stopping server...");
    await client.stop();
    console.log("✅ Server stopped");
  }
}

runBasicTest().catch(console.error);