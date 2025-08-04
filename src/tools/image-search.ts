import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { calculateRelevanceScore, searchImages } from "../api.js";
import { ImageSearchResult } from "../types.js";

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

  // Add analyze images tool
  server.tool(
    "analyze_images",
    "Analyze google image search results to find the most relevant ones",
    {
      searchResults: z
        .array(
          z.object({
            title: z.string(),
            link: z.string(),
            original: z.string(),
            source: z.string(),
            width: z.number().optional(),
            height: z.number().optional(),
            is_product: z.boolean().optional(),
          })
        )
        .describe("Array of image search results to analyze"),
      criteria: z
        .string()
        .describe(
          "Criteria for selecting the best images (e.g., 'professional', 'colorful', etc.)"
        ),
    },
    async (args, _extra) => {
      try {
        const { searchResults, criteria } = args;

        console.error(
          `[Tool] Executing analyze_images with criteria: "${criteria}"`
        );

        // Calculate relevance scores and add recommendations
        const analyzedResults = searchResults.map((img) => ({
          ...img,
          relevanceScore: calculateRelevanceScore(
            img as ImageSearchResult,
            criteria
          ),
        }));

        // Sort by relevance score
        analyzedResults.sort(
          (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
        );

        // Add recommendations based on ranking
        const resultsWithRecommendations = analyzedResults.map(
          (img, index) => ({
            ...img,
            recommendation:
              index < 3
                ? "Highly recommended"
                : index < 6
                ? "Recommended"
                : "Standard option",
          })
        );

        return {
          content: [
            {
              type: "text",
              text: `Analyzed ${resultsWithRecommendations.length} images based on criteria: "${criteria}"`,
            },
            {
              type: "text",
              text: JSON.stringify(resultsWithRecommendations, null, 2),
            },
          ],
        };
      } catch (error: any) {
        console.error("[Error] analyze_images failed:", error);
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to analyze images: ${error.message}`,
            },
          ],
        };
      }
    }
  );
}
