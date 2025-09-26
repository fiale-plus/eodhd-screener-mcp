# EODHD Screener MCP Server

[![npm version](https://badge.fury.io/js/eodhd-screener-mcp.svg)](https://badge.fury.io/js/eodhd-screener-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-blue)](https://modelcontextprotocol.io)

[![Tests](https://github.com/fiale-plus/eodhd-screener-mcp/actions/workflows/test-main.yml/badge.svg)](https://github.com/fiale-plus/eodhd-screener-mcp/actions/workflows/test-main.yml)
[![PR Tests](https://github.com/fiale-plus/eodhd-screener-mcp/actions/workflows/test-pr.yml/badge.svg)](https://github.com/fiale-plus/eodhd-screener-mcp/actions/workflows/test-pr.yml)

🚀 **Professional-grade MCP server** for advanced stock screening using EODHD financial APIs. Multi-stage filtering with technical indicators, fundamental analysis, and market data.

**Perfect for:** Quantitative analysis, algorithmic trading research, portfolio management, and financial AI applications.

## ✨ Key Features

- 🎯 **Advanced Stock Screener** - Filter by market cap, sector, volume, and 50+ criteria
- 📊 **Technical Indicators** - RSI, SMA, MACD, Bollinger Bands, and 100+ indicators
- 💰 **Fundamental Analysis** - P/E ratios, revenue growth, debt ratios (premium)
- 🔄 **Multi-Stage Filtering** - Chain filters for precision screening
- ⚡ **High Performance** - Bulk processing with intelligent caching
- 🤖 **AI-Ready** - Seamless Claude integration via MCP protocol

## 🚀 Quick Start

### Option 1: Install from NPM (Recommended)

```bash
# Install globally
npm install -g eodhd-screener-mcp

# Set API key
export EODHD_API_KEY="your_eodhd_api_key"

# Test installation
eodhd-screener-mcp --help
```

### Option 2: Install from Source

```bash
# Clone and build
git clone https://github.com/fiale-plus/eodhd-screener-mcp.git
cd eodhd-screener-mcp
npm install && npm run build

# Set API key
export EODHD_API_KEY="your_eodhd_api_key"

# Test with inspector
npm run inspector
```

## Configuration

### API Key Setup

You need an EODHD API key to use this server. Get one at [EODHD.com](https://eodhd.com/).

You can configure the API key in two ways:

#### Option 1: Environment Variable (Recommended)
Set the `EODHD_API_KEY` environment variable:

```bash
export EODHD_API_KEY="your_api_key_here"
```

#### Option 2: Pass API Key in Tool Calls
Include the `apiKey` parameter in each tool call (less secure, not recommended for production).

### MCP Configuration

#### Claude Desktop
Add to your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Using NPM Package (Recommended):**
```json
{
  "mcpServers": {
    "eodhd-screener": {
      "command": "npx",
      "args": ["eodhd-screener-mcp"],
      "env": {
        "EODHD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Using Local Installation:**
```json
{
  "mcpServers": {
    "eodhd-screener": {
      "command": "node",
      "args": ["/path/to/eodhd-screener-mcp/dist/index.js"],
      "env": {
        "EODHD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Claude Code
Add a `.claude.json` configuration file to your project root:

**Using NPM Package (Recommended):**
```json
{
  "mcpServers": {
    "eodhd-screener": {
      "command": "npx",
      "args": ["eodhd-screener-mcp"],
      "env": {
        "EODHD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Using Local Installation:**
```json
{
  "mcpServers": {
    "eodhd-screener": {
      "command": "node",
      "args": ["/path/to/eodhd-screener-mcp/dist/index.js"],
      "env": {
        "EODHD_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### Installation Notes

- **NPM Package**: The `npx eodhd-screener-mcp` command will automatically download and run the latest version
- **Global Install**: Use `npm install -g eodhd-screener-mcp` for faster startup (no download needed)
- **Local Development**: Use the local installation method if you're developing or customizing the server

### Versioning

This package uses **GitHub Release Tags** for versioning:
- Create a GitHub release with tag `v1.2.3`
- The workflow automatically extracts `1.2.3` and publishes to NPM
- Package.json version is automatically updated during CI/CD
- This ensures consistent versioning between GitHub releases and NPM packages

## Available Tools

### 1. `screen_stocks`
Screen stocks using EODHD market screener with filters and sorting.

Parameters:
- `apiKey` (optional): Your EODHD API key (if not set via environment variable)
- `sort`: Sort field (e.g., "market_capitalization.desc")
- `filters`: Array of filter conditions
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset
- `signals`: Pre-defined signals filter

Example filters:
```json
[
  ["market_capitalization", ">", 1000000000],
  ["sector", "=", "Technology"]
]
```

### 2. `get_fundamentals`
Get fundamental data for a specific stock.

Parameters:
- `apiKey` (optional): Your EODHD API key (if not set via environment variable)
- `symbol` (required): Stock symbol (e.g., "AAPL.US")

### 3. `get_technical_indicator`
Get technical indicator data for a stock.

Parameters:
- `apiKey` (optional): Your EODHD API key (if not set via environment variable)
- `symbol` (required): Stock symbol
- `function` (required): Indicator name (sma, rsi, macd, bbands, etc.)
- `period`: Period for the indicator
- `from`: Start date (YYYY-MM-DD)
- `to`: End date (YYYY-MM-DD)

### 4. `multi_stage_screen`
Perform multi-stage screening combining all three data sources.

Parameters:
- `apiKey` (optional): Your EODHD API key (if not set via environment variable)
- `screenerFilters`: Initial screener filters
- `screenerSort`: Sort field for screener
- `screenerLimit`: Limit for screener results
- `fundamentalsFilters`: Object with fundamental criteria
- `technicalFilters`: Array of technical indicator conditions
- `symbols`: Optional list of symbols to analyze (bypasses screener)

Example fundamentals filters:
```json
{
  "pe_ratio": { "max": 30 },
  "revenue_growth": { "min": 0.1 }
}
```

Example technical filters:
```json
[
  {
    "indicator": "rsi",
    "period": 14,
    "condition": "<",
    "value": 30
  }
]
```

## API Documentation

For more information about the EODHD API endpoints:
- [Stock Market Screener API](https://eodhd.com/financial-apis/stock-market-screener-api)
- [Fundamental Data API](https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds)
- [Technical Indicators API](https://eodhd.com/financial-apis/technical-indicators-api)

## Development

```bash
# Run in development mode with auto-reload
npm run dev

# Test with MCP inspector
npm run inspector
```

## Testing

This project includes comprehensive regression tests to ensure reliability:

```bash
# Install test dependencies
npm run test:install

# Run regression tests
npm test

# Run tests from main directory
npm run test
```

### Test Coverage

- ✅ **Context Window Prevention** - Ensures RSI200/SMA200 don't exceed 25k tokens
- ✅ **Dynamic Defaults** - Validates period × 1.5 multiplier working
- ✅ **MCP Protocol** - Tests all 4 tool endpoints
- ✅ **Data Quality** - RSI bounds, date formats, response structures
- ✅ **Error Handling** - API failures, invalid inputs, timeouts

### CI/CD

- **PR Tests**: Run on every pull request with demo API
- **Main Tests**: Comprehensive testing after merge + daily API health checks
- **Manual Dispatch**: Option to run full tests with real API key

See [Tests README](tests/README.md) for detailed testing information.