#!/usr/bin/env node

import { SimpleMCPTestClient } from "./utils/simple-test-client.js";

async function debugTest() {
  console.log("🔍 Debug Test - Checking Response Format\n");

  const client = new SimpleMCPTestClient({
    timeout: 15000,
    apiKey: process.env.EODHD_API_KEY || "demo"
  });

  try {
    await client.start();
    console.log("✅ Server started\n");

    // Test technical indicator and log full response
    console.log("📊 Testing RSI with full response logging...");
    const rsiResult = await client.callTool("get_technical_indicator", {
      symbol: "AAPL.US",
      function: "rsi",
      period: 14
    });

    if (rsiResult.success) {
      console.log("✅ RSI call successful");
      console.log("📝 Full response structure:");
      console.log(JSON.stringify(rsiResult.data, null, 2));

      // Try to extract the data
      if (rsiResult.data?.content?.[0]?.text) {
        console.log("\n📄 Response text content:");
        const textContent = rsiResult.data.content[0].text;
        console.log(textContent.substring(0, 500) + "...");

        try {
          const parsedData = JSON.parse(textContent);
          console.log(`\n📊 Parsed data type: ${Array.isArray(parsedData) ? 'Array' : typeof parsedData}`);
          if (Array.isArray(parsedData)) {
            console.log(`📈 Array length: ${parsedData.length}`);
            if (parsedData.length > 0) {
              console.log(`🎯 First entry: ${JSON.stringify(parsedData[0])}`);
            }
          }
        } catch (e) {
          console.log(`❌ Parse error: ${e}`);
        }
      }
    } else {
      console.log(`❌ RSI call failed: ${rsiResult.error}`);
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error}`);
  } finally {
    await client.stop();
    console.log("\n✅ Server stopped");
  }
}

debugTest().catch(console.error);