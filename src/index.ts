#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

interface ScreenerParams {
  apiKey?: string;
  sort?: string;
  filters?: any[][];
  limit?: number;
  offset?: number;
  signals?: string;
}

interface FundamentalsParams {
  apiKey?: string;
  symbol: string;
}

interface TechnicalIndicatorParams {
  apiKey?: string;
  symbol: string;
  function: string;
  period?: number;
  from?: string;
  to?: string;
  splitAdjustedOnly?: number;
  order?: string;
}

interface MultiScreenParams {
  apiKey?: string;
  screenerFilters?: any[][];
  screenerSort?: string;
  screenerLimit?: number;
  fundamentalsFilters?: Record<string, any>;
  technicalFilters?: Array<{
    indicator: string;
    period?: number;
    condition: string;
    value: number;
  }>;
  symbols?: string[];
}

class EODHDScreenerServer {
  private server: Server;
  private baseUrl = "https://eodhd.com/api";
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.EODHD_API_KEY || "";
    this.server = new Server(
      {
        name: "eodhd-screener-mcp",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "screen_stocks",
          description: "Screen stocks using EODHD market screener with filters and sorting",
          inputSchema: {
            type: "object",
            properties: {
              apiKey: {
                type: "string",
                description: "EODHD API key (optional if set via environment variable)",
              },
              sort: {
                type: "string",
                description: "Sort field and order (e.g., 'market_capitalization.desc')",
              },
              filters: {
                type: "array",
                description: "Array of filter conditions (e.g., [['market_capitalization', '>', 1000000000]])",
                items: {
                  type: "array",
                },
              },
              limit: {
                type: "number",
                description: "Number of results to return (default: 50)",
              },
              offset: {
                type: "number",
                description: "Offset for pagination (default: 0)",
              },
              signals: {
                type: "string",
                description: "Pre-defined signals filter (e.g., '200d_new_hi')",
              },
            },
            required: [],
          },
        },
        {
          name: "get_fundamentals",
          description: "Get fundamental data for a specific stock symbol",
          inputSchema: {
            type: "object",
            properties: {
              apiKey: {
                type: "string",
                description: "EODHD API key (optional if set via environment variable)",
              },
              symbol: {
                type: "string",
                description: "Stock symbol (e.g., 'AAPL.US')",
              },
            },
            required: ["symbol"],
          },
        },
        {
          name: "get_technical_indicator",
          description: "Get technical indicator data for a specific stock",
          inputSchema: {
            type: "object",
            properties: {
              apiKey: {
                type: "string",
                description: "EODHD API key (optional if set via environment variable)",
              },
              symbol: {
                type: "string",
                description: "Stock symbol (e.g., 'AAPL.US')",
              },
              function: {
                type: "string",
                description: "Technical indicator function (e.g., 'sma', 'rsi', 'macd', 'bbands')",
              },
              period: {
                type: "number",
                description: "Period for the indicator (e.g., 14 for RSI)",
              },
              from: {
                type: "string",
                description: "Start date (YYYY-MM-DD format). Defaults to period * 1.5 days ago (min 30, max 365) if not specified.",
              },
              to: {
                type: "string",
                description: "End date (YYYY-MM-DD format)",
              },
              splitAdjustedOnly: {
                type: "number",
                description: "Use split adjusted data only (0 or 1)",
              },
              order: {
                type: "string",
                description: "Order of results ('a' for ascending, 'd' for descending). Defaults to 'd' (newest first).",
              },
            },
            required: ["symbol", "function"],
          },
        },
        {
          name: "multi_stage_screen",
          description: "Perform multi-stage screening: 1) Initial screen, 2) Filter by fundamentals, 3) Filter by technical indicators",
          inputSchema: {
            type: "object",
            properties: {
              apiKey: {
                type: "string",
                description: "EODHD API key (optional if set via environment variable)",
              },
              screenerFilters: {
                type: "array",
                description: "Initial screener filters",
                items: {
                  type: "array",
                },
              },
              screenerSort: {
                type: "string",
                description: "Sort field for screener",
              },
              screenerLimit: {
                type: "number",
                description: "Limit for screener results",
              },
              fundamentalsFilters: {
                type: "object",
                description: "Fundamental filters to apply (e.g., { 'pe_ratio': { 'max': 30 }, 'revenue_growth': { 'min': 0.1 } })",
              },
              technicalFilters: {
                type: "array",
                description: "Technical indicator filters",
                items: {
                  type: "object",
                  properties: {
                    indicator: {
                      type: "string",
                      description: "Indicator name (e.g., 'rsi', 'sma')",
                    },
                    period: {
                      type: "number",
                      description: "Period for indicator",
                    },
                    condition: {
                      type: "string",
                      description: "Condition ('>', '<', '>=', '<=', '=')",
                    },
                    value: {
                      type: "number",
                      description: "Value to compare against",
                    },
                  },
                },
              },
              symbols: {
                type: "array",
                description: "Optional: specific symbols to analyze (bypasses screener)",
                items: {
                  type: "string",
                },
              },
            },
            required: [],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "screen_stocks":
          return this.screenStocks(request.params.arguments as unknown as ScreenerParams);
        case "get_fundamentals":
          return this.getFundamentals(request.params.arguments as unknown as FundamentalsParams);
        case "get_technical_indicator":
          return this.getTechnicalIndicator(request.params.arguments as unknown as TechnicalIndicatorParams);
        case "multi_stage_screen":
          return this.multiStageScreen(request.params.arguments as unknown as MultiScreenParams);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async screenStocks(params: ScreenerParams) {
    try {
      const apiKey = params.apiKey || this.apiKey;
      if (!apiKey) {
        throw new Error("API key is required. Set EODHD_API_KEY environment variable or pass apiKey parameter.");
      }

      const queryParams = new URLSearchParams({
        api_token: apiKey,
        fmt: "json",
      });

      if (params.sort) {
        queryParams.append("sort", params.sort);
      }
      if (params.filters) {
        queryParams.append("filters", JSON.stringify(params.filters));
      }
      if (params.limit) {
        queryParams.append("limit", params.limit.toString());
      }
      if (params.offset) {
        queryParams.append("offset", params.offset.toString());
      }
      if (params.signals) {
        queryParams.append("signals", params.signals);
      }

      const response = await axios.get(
        `${this.baseUrl}/screener?${queryParams.toString()}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error screening stocks: ${error.message}`,
          },
        ],
      };
    }
  }

  private async getFundamentals(params: FundamentalsParams) {
    try {
      const apiKey = params.apiKey || this.apiKey;
      if (!apiKey) {
        throw new Error("API key is required. Set EODHD_API_KEY environment variable or pass apiKey parameter.");
      }

      const queryParams = new URLSearchParams({
        api_token: apiKey,
        fmt: "json",
      });

      const response = await axios.get(
        `${this.baseUrl}/fundamentals/${params.symbol}?${queryParams.toString()}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting fundamentals: ${error.message}`,
          },
        ],
      };
    }
  }

  private async getTechnicalIndicator(params: TechnicalIndicatorParams) {
    try {
      const apiKey = params.apiKey || this.apiKey;
      if (!apiKey) {
        throw new Error("API key is required. Set EODHD_API_KEY environment variable or pass apiKey parameter.");
      }

      // Set dynamic defaults based on indicator period to prevent context window overflow
      const today = new Date();

      // Calculate required days: period * 1.5 with minimum of 30 days, max of 365 days
      const periodBasedDays = params.period ? Math.ceil(params.period * 1.5) : 30;
      const requiredDays = Math.max(30, Math.min(periodBasedDays, 365));

      const defaultFromDate = new Date(today.getTime() - (requiredDays * 24 * 60 * 60 * 1000));
      const defaultFrom = defaultFromDate.toISOString().split('T')[0];

      const queryParams = new URLSearchParams({
        api_token: apiKey,
        fmt: "json",
        function: params.function,
        // Dynamic lookback based on period (period * 1.5, min 30, max 365 days)
        from: params.from || defaultFrom,
        // Default to descending order (newest first)
        order: params.order || "d",
      });

      if (params.period) {
        queryParams.append("period", params.period.toString());
      }
      if (params.to) {
        queryParams.append("to", params.to);
      }
      if (params.splitAdjustedOnly !== undefined) {
        queryParams.append("splitadjusted_only", params.splitAdjustedOnly.toString());
      }

      const response = await axios.get(
        `${this.baseUrl}/technical/${params.symbol}?${queryParams.toString()}`
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error getting technical indicator: ${error.message}`,
          },
        ],
      };
    }
  }

  private async multiStageScreen(params: MultiScreenParams) {
    try {
      const apiKey = params.apiKey || this.apiKey;
      if (!apiKey) {
        throw new Error("API key is required. Set EODHD_API_KEY environment variable or pass apiKey parameter.");
      }

      let symbols: string[] = params.symbols || [];

      // Stage 1: Initial screening (if no symbols provided)
      if (!params.symbols || params.symbols.length === 0) {
        const screenerParams: ScreenerParams = {
          apiKey,
          filters: params.screenerFilters,
          sort: params.screenerSort,
          limit: params.screenerLimit || 100,
        };

        const screenerResult = await this.screenStocks(screenerParams);
        const screenerData = JSON.parse(screenerResult.content[0].text);

        if (screenerData.data) {
          symbols = screenerData.data.map((item: any) => item.code);
        }
      }

      if (symbols.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "No symbols found from initial screening",
            },
          ],
        };
      }

      // Stage 2: Filter by fundamentals
      let filteredSymbols = [...symbols];
      if (params.fundamentalsFilters && Object.keys(params.fundamentalsFilters).length > 0) {
        const fundamentalsPromises = filteredSymbols.map(symbol =>
          this.getFundamentals({ apiKey, symbol })
        );

        const fundamentalsResults = await Promise.all(fundamentalsPromises);
        filteredSymbols = filteredSymbols.filter((symbol, index) => {
          try {
            const data = JSON.parse(fundamentalsResults[index].content[0].text);

            for (const [key, filter] of Object.entries(params.fundamentalsFilters!)) {
              const value = this.getNestedValue(data, key);
              if (value === null || value === undefined) return false;

              const filterObj = filter as any;
              if (filterObj.min !== undefined && value < filterObj.min) return false;
              if (filterObj.max !== undefined && value > filterObj.max) return false;
              if (filterObj.equals !== undefined && value !== filterObj.equals) return false;
            }
            return true;
          } catch {
            return false;
          }
        });
      }

      // Stage 3: Filter by technical indicators
      let finalSymbols = [...filteredSymbols];
      if (params.technicalFilters && params.technicalFilters.length > 0) {
        const technicalResults: Record<string, any> = {};

        for (const filter of params.technicalFilters) {
          const technicalPromises = finalSymbols.map(symbol =>
            this.getTechnicalIndicator({
              apiKey,
              symbol,
              function: filter.indicator,
              period: filter.period,
            })
          );

          const results = await Promise.all(technicalPromises);
          finalSymbols.forEach((symbol, index) => {
            if (!technicalResults[symbol]) technicalResults[symbol] = {};
            try {
              const data = JSON.parse(results[index].content[0].text);
              technicalResults[symbol][filter.indicator] = data;
            } catch {
              technicalResults[symbol][filter.indicator] = null;
            }
          });
        }

        finalSymbols = finalSymbols.filter(symbol => {
          for (const filter of params.technicalFilters!) {
            const data = technicalResults[symbol]?.[filter.indicator];
            if (!data || !Array.isArray(data) || data.length === 0) return false;

            const latestValue = data[data.length - 1]?.value || data[data.length - 1]?.[filter.indicator];
            if (latestValue === undefined) return false;

            switch (filter.condition) {
              case ">":
                if (!(latestValue > filter.value)) return false;
                break;
              case "<":
                if (!(latestValue < filter.value)) return false;
                break;
              case ">=":
                if (!(latestValue >= filter.value)) return false;
                break;
              case "<=":
                if (!(latestValue <= filter.value)) return false;
                break;
              case "=":
                if (!(latestValue === filter.value)) return false;
                break;
            }
          }
          return true;
        });
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              initial_count: symbols.length,
              after_fundamentals: filteredSymbols.length,
              final_count: finalSymbols.length,
              symbols: finalSymbols,
              stages: {
                screener: symbols,
                fundamentals_filtered: filteredSymbols,
                technical_filtered: finalSymbols,
              }
            }, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error in multi-stage screening: ${error.message}`,
          },
        ],
      };
    }
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split(".");
    let value = obj;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return null;
    }
    return value;
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("EODHD Screener MCP server started");
  }
}

const server = new EODHDScreenerServer();
server.start().catch(console.error);