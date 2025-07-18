#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Replicate from "replicate";
// Create the MCP server
const server = new McpServer({
  name: "image-generation",
  version: "1.0.0",
});

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Tool: Generate images using Replicate models
server.tool(
  "generate-image",
  "Generate an image using various Replicate models",
  {
    model: z.string().describe("The model to use for generation (e.g., 'black-forest-labs/flux-schnell', 'stability-ai/sdxl')"),
    prompt: z.string().describe("The text prompt describing the image to generate"),
    size: z.string().optional().describe("Image size (e.g., '1024x1024', '512x512')"),
    width: z.number().optional().describe("Image width in pixels"),
    height: z.number().optional().describe("Image height in pixels"),
    quality: z.string().optional().describe("Image quality setting"),
    num_inference_steps: z.number().optional().describe("Number of inference steps"),
    guidance_scale: z.number().optional().describe("Guidance scale for generation"),
    seed: z.number().optional().describe("Random seed for reproducibility"),
    num_outputs: z.number().optional().describe("Number of images to generate"),
    aspect_ratio: z.string().optional().describe("Aspect ratio (e.g., '16:9', '1:1', '9:16')"),
    output_format: z.string().optional().describe("Output format (e.g., 'png', 'jpg', 'webp')"),
    output_quality: z.number().optional().describe("Output quality (0-100)"),
    disable_safety_checker: z.boolean().optional().describe("Disable safety checker"),
    scheduler: z.string().optional().describe("Scheduler/sampler (e.g., 'K_EULER', 'DDIM', 'DPMSolverMultistep')"),
    negative_prompt: z.string().optional().describe("Negative prompt to avoid certain elements"),
    strength: z.number().optional().describe("Strength for img2img operations (0.0-1.0)"),
    image: z.string().optional().describe("Input image URL for img2img or ControlNet"),
    mask: z.string().optional().describe("Mask image URL for inpainting"),
    control_image: z.string().optional().describe("Control image URL for ControlNet"),
    lora_scale: z.number().optional().describe("LoRA scale (0.0-1.0)"),
    refine: z.string().optional().describe("Refiner model for enhanced quality"),
    high_noise_frac: z.number().optional().describe("High noise fraction for base/refiner split"),
    apply_watermark: z.boolean().optional().describe("Apply watermark to output"),
    replicate_weights: z.string().optional().describe("Custom weights/checkpoint URL"),
  },
  async ({ model, prompt, size, width, height, quality, num_inference_steps, guidance_scale, seed, num_outputs, aspect_ratio, output_format, output_quality, disable_safety_checker, scheduler, negative_prompt, strength, image, mask, control_image, lora_scale, refine, high_noise_frac, apply_watermark, replicate_weights }) => {
    try {
      // Build input object dynamically based on provided parameters
      const input: any = { prompt };
      
      // Handle size parameter by parsing it into width/height
      if (size && !width && !height) {
        const [w, h] = size.split('x').map(Number);
        if (w && h) {
          input.width = w;
          input.height = h;
        }
      } else {
        if (width) input.width = width;
        if (height) input.height = height;
      }
      
      // Add optional parameters if provided
      if (quality) input.quality = quality;
      if (num_inference_steps) input.num_inference_steps = num_inference_steps;
      if (guidance_scale) input.guidance_scale = guidance_scale;
      if (seed) input.seed = seed;
      if (num_outputs) input.num_outputs = num_outputs;
      if (aspect_ratio) input.aspect_ratio = aspect_ratio;
      if (output_format) input.output_format = output_format;
      if (output_quality) input.output_quality = output_quality;
      if (disable_safety_checker !== undefined) input.disable_safety_checker = disable_safety_checker;
      if (scheduler) input.scheduler = scheduler;
      if (negative_prompt) input.negative_prompt = negative_prompt;
      if (strength) input.strength = strength;
      if (image) input.image = image;
      if (mask) input.mask = mask;
      if (control_image) input.control_image = control_image;
      if (lora_scale) input.lora_scale = lora_scale;
      if (refine) input.refine = refine;
      if (high_noise_frac) input.high_noise_frac = high_noise_frac;
      if (apply_watermark !== undefined) input.apply_watermark = apply_watermark;
      if (replicate_weights) input.replicate_weights = replicate_weights;
      
      // Set model-specific defaults for common parameters
      if (model.includes('flux')) {
        // Flux models (black-forest-labs/flux-schnell, black-forest-labs/flux-dev, etc.)
        if (!input.num_inference_steps) input.num_inference_steps = 4;
        if (!input.guidance_scale) input.guidance_scale = 3.5;
        if (!input.width) input.width = 1024;
        if (!input.height) input.height = 1024;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else if (model.includes('sdxl') || model.includes('stable-diffusion')) {
        // SDXL/Stable Diffusion models (stability-ai/sdxl, stability-ai/stable-diffusion, etc.)
        if (!input.num_inference_steps) input.num_inference_steps = 20;
        if (!input.guidance_scale) input.guidance_scale = 7.5;
        if (!input.width) input.width = 1024;
        if (!input.height) input.height = 1024;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else if (model.includes('midjourney') || model.includes('mj')) {
        // Midjourney-style models
        if (!input.width) input.width = 1024;
        if (!input.height) input.height = 1024;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 95;
      } else if (model.includes('dalle') || model.includes('dall-e')) {
        // DALL-E style models
        if (!input.width) input.width = 1024;
        if (!input.height) input.height = 1024;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else if (model.includes('controlnet')) {
        // ControlNet models
        if (!input.num_inference_steps) input.num_inference_steps = 20;
        if (!input.guidance_scale) input.guidance_scale = 7.5;
        if (!input.width) input.width = 512;
        if (!input.height) input.height = 512;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else if (model.includes('kandinsky')) {
        // Kandinsky models
        if (!input.num_inference_steps) input.num_inference_steps = 50;
        if (!input.guidance_scale) input.guidance_scale = 4.0;
        if (!input.width) input.width = 512;
        if (!input.height) input.height = 512;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else if (model.includes('dreamshaper') || model.includes('realistic-vision')) {
        // Community fine-tuned models
        if (!input.num_inference_steps) input.num_inference_steps = 25;
        if (!input.guidance_scale) input.guidance_scale = 7.0;
        if (!input.width) input.width = 512;
        if (!input.height) input.height = 512;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else if (model.includes('playground') || model.includes('openjourney')) {
        // Playground AI and OpenJourney models
        if (!input.num_inference_steps) input.num_inference_steps = 25;
        if (!input.guidance_scale) input.guidance_scale = 7.0;
        if (!input.width) input.width = 512;
        if (!input.height) input.height = 512;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else if (model.includes('waifu') || model.includes('anime')) {
        // Anime/Waifu models
        if (!input.num_inference_steps) input.num_inference_steps = 28;
        if (!input.guidance_scale) input.guidance_scale = 7.0;
        if (!input.width) input.width = 512;
        if (!input.height) input.height = 768;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else if (model.includes('lcm') || model.includes('lightning')) {
        // LCM and Lightning models (fast generation)
        if (!input.num_inference_steps) input.num_inference_steps = 4;
        if (!input.guidance_scale) input.guidance_scale = 1.0;
        if (!input.width) input.width = 1024;
        if (!input.height) input.height = 1024;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else if (model.includes('protogen') || model.includes('vintedois')) {
        // Protogen and Vintedois models
        if (!input.num_inference_steps) input.num_inference_steps = 20;
        if (!input.guidance_scale) input.guidance_scale = 7.5;
        if (!input.width) input.width = 512;
        if (!input.height) input.height = 512;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      } else {
        // Default fallbacks for unknown models
        if (!input.num_inference_steps) input.num_inference_steps = 20;
        if (!input.guidance_scale) input.guidance_scale = 7.5;
        if (!input.width) input.width = 512;
        if (!input.height) input.height = 512;
        if (!input.output_format) input.output_format = 'png';
        if (!input.output_quality) input.output_quality = 90;
      }
      
      // Run the model
      const output = await replicate.run(model as `${string}/${string}`, { input });
      
      // Handle different output formats
      let imageUrls: string[] = [];
      if (Array.isArray(output)) {
        imageUrls = output.map(item => {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object' && 'url' in item && typeof item.url === 'function') {
            return item.url();
          }
          return String(item);
        });
      } else if (typeof output === 'string') {
        imageUrls = [output];
      } else if (output && typeof output === 'object' && 'url' in output && typeof (output as any).url === 'function') {
        imageUrls = [(output as any).url()];
      }
      
      return {
        content: [
          {
            type: "text",
            text: `Generated ${imageUrls.length} image(s) using model: ${model}`,
          },
          ...imageUrls.map(url => ({
            type: "image" as const,
            data: url,
            mimeType: `image/${input.output_format}`,
          })),
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error generating image: ${errorMessage}`,
          },
        ],
      };
    }
  }
);


// Start the server
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
