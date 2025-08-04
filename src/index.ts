#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import Replicate from "replicate";
import { registerGenerateImageTool } from "./tools/generate-image.js";
import { registerImageProcessingTools } from "./tools/image-processing.js";
import { registerModelInfoTool } from "./tools/model-info.js";
import { registerImageSearchTools } from "./tools/image-search.js";

const server = new McpServer({
  name: "image-tools",
  version: "1.0.0",
});

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

registerGenerateImageTool(server, replicate);
registerImageProcessingTools(server);
registerModelInfoTool(server);
registerImageSearchTools(server);

async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP Hello World Server running...");
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
}

main().catch(console.error);
