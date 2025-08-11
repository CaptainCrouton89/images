import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";
import { ImageSearchResult, SearchResponse } from "./types.js";

const execAsync = promisify(exec);

/**
 * Search for images using the SerpAPI
 */
export async function searchImages(
  query: string,
  limit: number = 10
): Promise<ImageSearchResult[]> {
  console.error(`[API] Searching for images with query: "${query}"`);

  try {
    const response = await axios.get<SearchResponse>(
      "https://serpapi.com/search",
      {
        params: {
          q: query,
          engine: "google_images",
          ijn: "0",
          api_key: process.env.SERP_API_KEY,
        },
      }
    );

    if (!response.data.images_results) {
      throw new Error("No image results found");
    }

    return response.data.images_results.slice(0, limit);
  } catch (error) {
    console.error("[Error] Failed to search images:", error);
    throw error;
  }
}
