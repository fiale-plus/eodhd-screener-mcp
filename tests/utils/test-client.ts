import { spawn, ChildProcess } from "child_process";
import * as path from "path";

export interface TestConfig {
  timeout?: number;
  apiKey?: string;
}

export class MCPTestClient {
  private serverProcess: ChildProcess | null = null;

  constructor(private config: TestConfig = {}) {}

  async start(): Promise<void> {
    // Start the MCP server process
    const serverPath = path.join(process.cwd(), "..", "dist", "index.js");
    this.serverProcess = spawn("node", [serverPath], {
      env: {
        ...process.env,
        EODHD_API_KEY: this.config.apiKey || process.env.EODHD_API_KEY || "",
      },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    if (!this.serverProcess.stdout || !this.serverProcess.stdin) {
      throw new Error("Failed to create server process streams");
    }

    // Give the server time to start
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async stop(): Promise<void> {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }

  private async sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess?.stdin || !this.serverProcess?.stdout) {
        reject(new Error("Server process not available"));
        return;
      }

      const requestStr = JSON.stringify(request) + '\n';

      let responseData = '';
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, this.config.timeout || 10000);

      const onData = (data: Buffer) => {
        responseData += data.toString();
        try {
          const response = JSON.parse(responseData.trim());
          clearTimeout(timeout);
          this.serverProcess?.stdout?.off('data', onData);
          resolve(response);
        } catch (e) {
          // Not complete JSON yet, continue collecting
        }
      };

      this.serverProcess.stdout.on('data', onData);
      this.serverProcess.stdin.write(requestStr);
    });
  }

  async listTools(): Promise<any> {
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    };

    const response = await this.sendRequest(request);
    return response.result;
  }

  async callTool(name: string, args: any): Promise<any> {
    const request = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name,
        arguments: args
      }
    };

    const response = await this.sendRequest(request);
    return response.result;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const tools = await this.listTools();
      return Array.isArray(tools.tools) && tools.tools.length > 0;
    } catch (error) {
      return false;
    }
  }
}