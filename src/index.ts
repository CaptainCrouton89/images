#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Replicate from "replicate";
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
// Create the MCP server
const server = new McpServer({
  name: "image-tools",
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
    save_path: z.string().optional().describe("Relative path to save images (default: 'images')"),
  },
  async ({ model, prompt, size, width, height, quality, num_inference_steps, guidance_scale, seed, num_outputs, aspect_ratio, output_format, output_quality, disable_safety_checker, scheduler, negative_prompt, strength, image, mask, control_image, lora_scale, refine, high_noise_frac, apply_watermark, replicate_weights, save_path }) => {
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
      
      // Handle different output formats and convert URLs to base64
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
      
      // Set up save directory
      const saveDir = save_path || 'images';
      const fullSaveDir = path.resolve(process.cwd(), saveDir);
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(fullSaveDir)) {
        fs.mkdirSync(fullSaveDir, { recursive: true });
      }
      
      // Download and save images
      const savedFiles: string[] = [];
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i];
        try {
          console.error(`Fetching image from URL: ${url}`);
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Generate filename
          const extension = input.output_format || 'png';
          const filename = imageUrls.length === 1 
            ? `image_${timestamp}.${extension}`
            : `image_${timestamp}_${i + 1}.${extension}`;
          const filePath = path.join(fullSaveDir, filename);
          
          // Save file
          fs.writeFileSync(filePath, buffer);
          savedFiles.push(path.relative(process.cwd(), filePath));
          console.error(`Successfully saved image to: ${filePath}`);
        } catch (error) {
          console.error(`Failed to save image from ${url}:`, error);
          return {
            content: [
              {
                type: "text",
                text: `Error saving image: ${error instanceof Error ? error.message : String(error)}`,
              },
            ],
          };
        }
      }
      
      // Return success message with file paths
      const successMessage = savedFiles.length === 1
        ? `Successfully generated and saved 1 image using model: ${model}\nSaved to: ${savedFiles[0]}`
        : `Successfully generated and saved ${savedFiles.length} images using model: ${model}\nSaved to:\n${savedFiles.map(f => `- ${f}`).join('\n')}`;
      
      return {
        content: [
          {
            type: "text",
            text: successMessage,
          },
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

// Tool: Apply filters to images
server.tool(
  "apply-filter",
  "Apply various filters to an image (blur, sharpen, brightness, contrast, etc.)",
  {
    input_path: z.string().describe("Path to the input image file"),
    output_path: z.string().optional().describe("Path to save the filtered image (optional)"),
    filter: z.enum(["blur", "sharpen", "brightness", "contrast", "saturation", "hue", "gamma", "grayscale", "sepia", "negate"]).describe("Filter to apply"),
    amount: z.number().optional().describe("Filter intensity (varies by filter type)"),
  },
  async ({ input_path, output_path, filter, amount }) => {
    try {
      if (!fs.existsSync(input_path)) {
        throw new Error(`Input file not found: ${input_path}`);
      }

      let image = sharp(input_path);

      switch (filter) {
        case "blur":
          image = image.blur(amount || 3);
          break;
        case "sharpen":
          image = image.sharpen({ sigma: amount || 1 });
          break;
        case "brightness":
          image = image.modulate({ brightness: amount || 1.2 });
          break;
        case "contrast":
          image = image.modulate({ brightness: 1, saturation: 1 });
          image = image.linear(amount || 1.2, 0);
          break;
        case "saturation":
          image = image.modulate({ saturation: amount || 1.5 });
          break;
        case "hue":
          image = image.modulate({ hue: amount || 90 });
          break;
        case "gamma":
          image = image.gamma(amount || 2.2);
          break;
        case "grayscale":
          image = image.grayscale();
          break;
        case "sepia":
          image = image.tint({ r: 255, g: 236, b: 139 });
          break;
        case "negate":
          image = image.negate();
          break;
      }

      const outputPath = output_path || input_path.replace(/(\.[^.]+)$/, `_${filter}$1`);
      await image.toFile(outputPath);

      return {
        content: [
          {
            type: "text",
            text: `Successfully applied ${filter} filter to image. Saved to: ${outputPath}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error applying filter: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Tool: Crop images
server.tool(
  "crop-image",
  "Crop an image to specified dimensions and position",
  {
    input_path: z.string().describe("Path to the input image file"),
    output_path: z.string().optional().describe("Path to save the cropped image (optional)"),
    x: z.number().describe("X coordinate of the crop area (left edge)"),
    y: z.number().describe("Y coordinate of the crop area (top edge)"),
    width: z.number().describe("Width of the crop area"),
    height: z.number().describe("Height of the crop area"),
  },
  async ({ input_path, output_path, x, y, width, height }) => {
    try {
      if (!fs.existsSync(input_path)) {
        throw new Error(`Input file not found: ${input_path}`);
      }

      const outputPath = output_path || input_path.replace(/(\.[^.]+)$/, "_cropped$1");
      
      await sharp(input_path)
        .extract({ left: x, top: y, width, height })
        .toFile(outputPath);

      return {
        content: [
          {
            type: "text",
            text: `Successfully cropped image. Saved to: ${outputPath}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error cropping image: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Tool: Resize/scale images
server.tool(
  "resize-image",
  "Resize or scale an image to specified dimensions",
  {
    input_path: z.string().describe("Path to the input image file"),
    output_path: z.string().optional().describe("Path to save the resized image (optional)"),
    width: z.number().optional().describe("New width in pixels"),
    height: z.number().optional().describe("New height in pixels"),
    scale: z.number().optional().describe("Scale factor (e.g., 0.5 for 50%, 2.0 for 200%)"),
    fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).optional().describe("How to fit the image"),
    maintain_aspect_ratio: z.boolean().optional().describe("Maintain aspect ratio (default: true)"),
  },
  async ({ input_path, output_path, width, height, scale, fit, maintain_aspect_ratio }) => {
    try {
      if (!fs.existsSync(input_path)) {
        throw new Error(`Input file not found: ${input_path}`);
      }

      const outputPath = output_path || input_path.replace(/(\.[^.]+)$/, "_resized$1");
      let image = sharp(input_path);

      if (scale) {
        const metadata = await image.metadata();
        const newWidth = Math.round((metadata.width || 1) * scale);
        const newHeight = Math.round((metadata.height || 1) * scale);
        image = image.resize(newWidth, newHeight);
      } else if (width || height) {
        const resizeOptions: any = {};
        if (width) resizeOptions.width = width;
        if (height) resizeOptions.height = height;
        if (fit) resizeOptions.fit = fit;
        if (maintain_aspect_ratio === false) resizeOptions.withoutEnlargement = false;
        
        image = image.resize(resizeOptions);
      }

      await image.toFile(outputPath);

      return {
        content: [
          {
            type: "text",
            text: `Successfully resized image. Saved to: ${outputPath}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error resizing image: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Tool: Get image metadata
server.tool(
  "get-image-metadata",
  "Extract metadata information from an image",
  {
    input_path: z.string().describe("Path to the input image file"),
  },
  async ({ input_path }) => {
    try {
      if (!fs.existsSync(input_path)) {
        throw new Error(`Input file not found: ${input_path}`);
      }

      const metadata = await sharp(input_path).metadata();
      const stats = fs.statSync(input_path);

      const info = {
        filename: path.basename(input_path),
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        density: metadata.density,
        hasAlpha: metadata.hasAlpha,
        hasProfile: metadata.hasProfile,
        space: metadata.space,
        fileSize: stats.size,
        fileSizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        created: stats.birthtime,
        modified: stats.mtime,
      };

      return {
        content: [
          {
            type: "text",
            text: `Image Metadata for ${info.filename}:
Format: ${info.format}
Dimensions: ${info.width}x${info.height}
Channels: ${info.channels}
Density: ${info.density}
Has Alpha: ${info.hasAlpha}
Has Profile: ${info.hasProfile}
Color Space: ${info.space}
File Size: ${info.fileSizeFormatted}
Created: ${info.created}
Modified: ${info.modified}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error getting image metadata: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Tool: Convert image format
server.tool(
  "convert-image-format",
  "Convert an image to a different format",
  {
    input_path: z.string().describe("Path to the input image file"),
    output_path: z.string().optional().describe("Path to save the converted image (optional)"),
    format: z.enum(["jpeg", "png", "webp", "avif", "tiff", "gif"]).describe("Output format"),
    quality: z.number().optional().describe("Quality for lossy formats (1-100)"),
  },
  async ({ input_path, output_path, format, quality }) => {
    try {
      if (!fs.existsSync(input_path)) {
        throw new Error(`Input file not found: ${input_path}`);
      }

      const outputPath = output_path || input_path.replace(/\.[^.]+$/, `.${format}`);
      let image = sharp(input_path);

      switch (format) {
        case "jpeg":
          image = image.jpeg({ quality: quality || 90 });
          break;
        case "png":
          image = image.png({ quality: quality || 90 });
          break;
        case "webp":
          image = image.webp({ quality: quality || 90 });
          break;
        case "avif":
          image = image.avif({ quality: quality || 90 });
          break;
        case "tiff":
          image = image.tiff({ quality: quality || 90 });
          break;
        case "gif":
          image = image.gif();
          break;
      }

      await image.toFile(outputPath);

      return {
        content: [
          {
            type: "text",
            text: `Successfully converted image to ${format.toUpperCase()}. Saved to: ${outputPath}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error converting image: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Tool: Rotate image
server.tool(
  "rotate-image",
  "Rotate an image by a specified angle",
  {
    input_path: z.string().describe("Path to the input image file"),
    output_path: z.string().optional().describe("Path to save the rotated image (optional)"),
    angle: z.number().describe("Rotation angle in degrees (positive for clockwise)"),
    background: z.string().optional().describe("Background color for empty areas (hex color, e.g., '#ffffff')"),
  },
  async ({ input_path, output_path, angle, background }) => {
    try {
      if (!fs.existsSync(input_path)) {
        throw new Error(`Input file not found: ${input_path}`);
      }

      const outputPath = output_path || input_path.replace(/(\.[^.]+)$/, "_rotated$1");
      
      await sharp(input_path)
        .rotate(angle, { background: background || '#000000' })
        .toFile(outputPath);

      return {
        content: [
          {
            type: "text",
            text: `Successfully rotated image by ${angle} degrees. Saved to: ${outputPath}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error rotating image: ${errorMessage}`,
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
