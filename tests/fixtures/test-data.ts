export const TEST_SYMBOLS = {
  US_LARGE_CAP: "AAPL.US",
  US_TECH: "MSFT.US",
  EUROPEAN: "ASML.AS",
  INVALID: "INVALID.US",
};

export const TEST_SCREENER_FILTERS = {
  LARGE_CAP: [["market_capitalization", ">", 1000000000]],
  TECH_SECTOR: [["sector", "=", "Technology"]],
  SMALL_VOLUME: [["avgvol_1d", "<", 1000000]],
  COMBINED: [
    ["market_capitalization", ">", 1000000000],
    ["sector", "=", "Technology"]
  ],
};

export const TEST_TECHNICAL_INDICATORS = {
  RSI_SHORT: { function: "rsi", period: 14 },
  RSI_LONG: { function: "rsi", period: 200 },
  SMA_SHORT: { function: "sma", period: 20 },
  SMA_LONG: { function: "sma", period: 200 },
  MACD: { function: "macd" },
  BOLLINGER: { function: "bbands", period: 20 },
};

export const EXPECTED_TOOL_NAMES = [
  "screen_stocks",
  "get_fundamentals",
  "get_technical_indicator",
  "multi_stage_screen"
];

export const RSI_BOUNDS = { min: 0, max: 100 };
export const REASONABLE_PRICE_BOUNDS = { min: 0.01, max: 10000 };
export const MAX_RESPONSE_SIZE_TOKENS = 25000;
export const MIN_RECENT_DAYS = 7; // Expect data from last week at minimum