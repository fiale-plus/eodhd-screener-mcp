import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";

export interface TestConfig {
  timeout?: number;
  apiKey?: string;
}

export class MCPTestClient {
  private client: Client;
  private transport: StdioClientTransport | null = null;
  private serverProcess: ChildProcess | null = null;

  constructor(private config: TestConfig = {}) {
    this.client = new Client(
      {
        name: "test-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );
  }

  async start(): Promise<void> {
    // Start the MCP server process
    const serverPath = path.join(process.cwd(), "dist", "index.js");
    this.serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        EODHD_API_KEY: this.config.apiKey || process.env.EODHD_API_KEY || "",
      },
    });

    if (!this.serverProcess.stdout || !this.serverProcess.stdin) {
      throw new Error("Failed to create server process streams");
    }

    // Create transport and connect
    this.transport = new StdioClientTransport();

    await this.client.connect(this.transport);
  }

  async stop(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }

  async listTools(): Promise<any> {
    return await this.client.request({
      method: "tools/list",
    });
  }

  async callTool(name: string, args: any): Promise<any> {
    return await this.client.request({
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const tools = await this.listTools();
      return Array.isArray((tools as any).tools) && (tools as any).tools.length > 0;
    } catch (error) {
      return false;
    }
  }
}