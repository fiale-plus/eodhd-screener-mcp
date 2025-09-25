# EODHD MCP Server - E2E Regression Tests

Comprehensive end-to-end testing framework for the EODHD MCP Server.

## Quick Start

```bash
# Install dependencies
npm install
npm install -g tsx

# Set up environment
export EODHD_API_KEY="your_api_key_here"

# Run all regression tests
npm test
```

## Test Structure

```
tests/
├── e2e/                    # End-to-end integration tests
│   ├── screener.test.ts           # Stock screening tests
│   ├── technical-indicators.test.ts    # Technical indicator tests
│   ├── fundamentals.test.ts       # Fundamentals API tests
│   └── regression-suite.ts        # Main test runner
├── utils/                  # Test utilities and helpers
│   ├── test-client.ts             # MCP client wrapper
│   └── assertions.ts              # Test assertion helpers
├── fixtures/               # Test data and constants
│   └── test-data.ts               # Sample data and test constants
└── README.md
```

## Test Categories

### 🔍 **Screener Tests**
- Basic stock screening functionality
- Filter application (market cap, sector, etc.)
- Sorting and pagination
- Empty result handling

### 📊 **Technical Indicators Tests**
- RSI calculations (short/long periods)
- SMA indicators (various periods)
- MACD indicator structure
- Dynamic default date ranges
- Response size controls
- Date ordering (newest first)

### 💰 **Fundamentals Tests**
- Valid symbol handling
- Invalid symbol handling
- Premium subscription requirements
- Error handling

### 🧪 **Regression Controls**
- **Context window overflow prevention**
- **Dynamic date range defaults** (period × 1.5)
- **Response structure validation**
- **API error handling**
- **Tool availability verification**

## Key Regression Checks

1. **No Context Window Overflow**
   - Validates responses stay under 25k tokens
   - Tests long-period indicators (RSI200, SMA200)

2. **Dynamic Defaults Work**
   - Short periods get ~30 days of data
   - Long periods get appropriate data (period × 1.5)
   - All indicators return non-empty results

3. **Data Quality**
   - RSI values within 0-100 bounds
   - Dates in proper format and order
   - Price values within reasonable ranges

4. **API Integration**
   - Proper error handling for missing API keys
   - Graceful handling of invalid symbols
   - Premium feature detection

## Usage

### Run All Tests
```bash
npm test
```

### Individual Test Suites
```bash
# Just screener tests
npm run test:screener

# Just technical indicator tests
npm run test:technical

# Type checking
npm run test:build
```

### Environment Variables
```bash
export EODHD_API_KEY="demo"        # Required for API calls
export TEST_TIMEOUT=30000          # Optional: test timeout in ms
```

## Test Output

```
🚀 Starting EODHD MCP Server Regression Tests

✅ MCP Server health check passed
✅ All 4 expected tools found

📋 Running Screener Tests...
✅ Basic Stock Screening: Retrieved 10 stocks successfully
✅ Filtered Stock Screening: Filtered screening returned 5 large cap stocks
✅ Sorted Stock Results: Results properly sorted by market cap descending

📊 Screener Tests Summary: 5/5 passed, 0 failed, 0 skipped

🎯 REGRESSION TEST SUMMARY
========================
Overall Results:
   ✅ Passed: 15
   ❌ Failed: 0
   📊 Success Rate: 100%

🎉 All tests passed!
```

## Adding New Tests

1. **Create test class** in appropriate category
2. **Implement TestResult interface** for consistent output
3. **Add to regression-suite.ts** for inclusion in main test run
4. **Use fixtures and utilities** for reusable components

## Debugging

```bash
# Verbose output with data samples
DEBUG=1 npm test

# Run single test file
tsx tests/e2e/screener.test.ts
```

This test framework ensures the EODHD MCP Server maintains reliability across updates and prevents regressions in core functionality.