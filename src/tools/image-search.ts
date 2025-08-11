import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchImages } from "../api.js";

export function registerImageSearchTools(server: McpServer) {
  // Add search images tool
  server.tool(
    "search_images",
    "Search for images using Google Image Search",
    {
      query: z.string().describe("The search query for finding images"),
      limit: z
        .number()
        .optional()
        .describe("Maximum number of results to return (default: 10)"),
    },
    async (args, _extra) => {
      try {
        const { query, limit = 10 } = args;

        console.error(
          `[Tool] Executing search_images with query: "${query}", limit: ${limit}`
        );
        const results = await searchImages(query, limit);

        return {
          content: [
            {
              type: "text",
              text: `Found ${results.length} images for query "${query}":`,
            },
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[Error] search_images failed:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to search for images: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
