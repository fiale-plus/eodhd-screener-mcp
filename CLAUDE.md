# EODHD Screener MCP Server

MCP server for stock screening using EODHD financial APIs.

## Quick Start
```bash
npm install && npm run build
export EODHD_API_KEY="your_key"
```

## Tools
- `screen_stocks` - Filter stocks by market cap, sector, etc.
- `get_fundamentals` - Company financial data (requires premium)
- `get_technical_indicator` - RSI, SMA, MACD indicators (dynamic defaults: period × 1.5 days, min 30, max 365)
- `multi_stage_screen` - Combined screening with technical filters

## Development Commands
```bash
npm run dev          # Development mode
npm run build        # Production build
npm run inspector    # MCP testing
```

## API Endpoints Used

### EODHD Documentation
- **Screener API**: https://eodhd.com/financial-apis/stock-market-screener-api
- **Fundamentals API**: https://eodhd.com/financial-apis/stock-etfs-fundamental-data-feeds
- **Technical Indicators API**: https://eodhd.com/financial-apis/technical-indicators-api

### Actual Endpoints
- `GET https://eodhd.com/api/screener` - Stock screening
- `GET https://eodhd.com/api/fundamentals/{symbol}` - Company fundamentals
- `GET https://eodhd.com/api/technical/{symbol}` - Technical indicators

## Notes
- Fundamentals require premium EODHD subscription
- Technical indicators work with basic API access
- Multi-stage screening combines all data sources