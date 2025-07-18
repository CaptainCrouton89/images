import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import Replicate from "replicate";
import * as fs from "fs";
import * as path from "path";

export function registerGenerateImageTool(server: McpServer, replicate: Replicate) {
  server.tool(
    "generate-image",
    "Generate an image using various Replicate models",
    {
      model: z.string().describe("The model to use for generation (e.g., 'black-forest-labs/flux-schnell', 'stability-ai/sdxl')"),
      prompt: z.union([z.string(), z.array(z.string())]).describe("The text prompt(s) describing the image(s) to generate - can be a single string or array of strings"),
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
        const prompts = Array.isArray(prompt) ? prompt : [prompt];
        
        const buildInput = (promptText: string) => {
          const input: any = { prompt: promptText };
          
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
          
          if (model.includes('flux')) {
            if (!input.num_inference_steps) input.num_inference_steps = 4;
            if (!input.guidance_scale) input.guidance_scale = 3.5;
            if (!input.width) input.width = 1024;
            if (!input.height) input.height = 1024;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else if (model.includes('sdxl') || model.includes('stable-diffusion')) {
            if (!input.num_inference_steps) input.num_inference_steps = 20;
            if (!input.guidance_scale) input.guidance_scale = 7.5;
            if (!input.width) input.width = 1024;
            if (!input.height) input.height = 1024;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else if (model.includes('midjourney') || model.includes('mj')) {
            if (!input.width) input.width = 1024;
            if (!input.height) input.height = 1024;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 95;
          } else if (model.includes('dalle') || model.includes('dall-e')) {
            if (!input.width) input.width = 1024;
            if (!input.height) input.height = 1024;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else if (model.includes('controlnet')) {
            if (!input.num_inference_steps) input.num_inference_steps = 20;
            if (!input.guidance_scale) input.guidance_scale = 7.5;
            if (!input.width) input.width = 512;
            if (!input.height) input.height = 512;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else if (model.includes('kandinsky')) {
            if (!input.num_inference_steps) input.num_inference_steps = 50;
            if (!input.guidance_scale) input.guidance_scale = 4.0;
            if (!input.width) input.width = 512;
            if (!input.height) input.height = 512;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else if (model.includes('dreamshaper') || model.includes('realistic-vision')) {
            if (!input.num_inference_steps) input.num_inference_steps = 25;
            if (!input.guidance_scale) input.guidance_scale = 7.0;
            if (!input.width) input.width = 512;
            if (!input.height) input.height = 512;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else if (model.includes('playground') || model.includes('openjourney')) {
            if (!input.num_inference_steps) input.num_inference_steps = 25;
            if (!input.guidance_scale) input.guidance_scale = 7.0;
            if (!input.width) input.width = 512;
            if (!input.height) input.height = 512;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else if (model.includes('waifu') || model.includes('anime')) {
            if (!input.num_inference_steps) input.num_inference_steps = 28;
            if (!input.guidance_scale) input.guidance_scale = 7.0;
            if (!input.width) input.width = 512;
            if (!input.height) input.height = 768;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else if (model.includes('lcm') || model.includes('lightning')) {
            if (!input.num_inference_steps) input.num_inference_steps = 4;
            if (!input.guidance_scale) input.guidance_scale = 1.0;
            if (!input.width) input.width = 1024;
            if (!input.height) input.height = 1024;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else if (model.includes('protogen') || model.includes('vintedois')) {
            if (!input.num_inference_steps) input.num_inference_steps = 20;
            if (!input.guidance_scale) input.guidance_scale = 7.5;
            if (!input.width) input.width = 512;
            if (!input.height) input.height = 512;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          } else {
            if (!input.num_inference_steps) input.num_inference_steps = 20;
            if (!input.guidance_scale) input.guidance_scale = 7.5;
            if (!input.width) input.width = 512;
            if (!input.height) input.height = 512;
            if (!input.output_format) input.output_format = 'png';
            if (!input.output_quality) input.output_quality = 90;
          }
          
          return input;
        };
        
        const generationPromises = prompts.map(async (promptText, index) => {
          const input = buildInput(promptText);
          console.error(`Starting generation ${index + 1}/${prompts.length} for prompt: "${promptText.substring(0, 50)}${promptText.length > 50 ? '...' : ''}"`);
          
          try {
            const output = await replicate.run(model as `${string}/${string}`, { input });
            return { output, promptText, index };
          } catch (error) {
            console.error(`Generation ${index + 1} failed:`, error);
            throw new Error(`Generation ${index + 1} failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        });
        
        const results = await Promise.all(generationPromises);
        
        const allImageUrls: { url: string; promptText: string; index: number }[] = [];
        
        for (const result of results) {
          const { output, promptText, index } = result;
          
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
          
          imageUrls.forEach(url => {
            allImageUrls.push({ url, promptText, index });
          });
        }
        
        const saveDir = save_path || 'images';
        const fullSaveDir = path.resolve(process.cwd(), saveDir);
        
        if (!fs.existsSync(fullSaveDir)) {
          fs.mkdirSync(fullSaveDir, { recursive: true });
        }
        
        const savedFiles: string[] = [];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const downloadPromises = allImageUrls.map(async ({ url, promptText, index }, imageIndex) => {
          try {
            console.error(`Downloading image ${imageIndex + 1}/${allImageUrls.length} from URL: ${url}`);
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            const extension = buildInput(promptText).output_format || 'png';
            let filename: string;
            
            if (prompts.length === 1 && allImageUrls.length === 1) {
              filename = `image_${timestamp}.${extension}`;
            } else if (prompts.length === 1) {
              filename = `image_${timestamp}_${imageIndex + 1}.${extension}`;
            } else {
              filename = `image_${timestamp}_prompt${index + 1}_${imageIndex + 1}.${extension}`;
            }
            
            const filePath = path.join(fullSaveDir, filename);
            
            fs.writeFileSync(filePath, buffer);
            const relativePath = path.relative(process.cwd(), filePath);
            console.error(`Successfully saved image to: ${filePath}`);
            
            return relativePath;
          } catch (error) {
            console.error(`Failed to download image from ${url}:`, error);
            throw new Error(`Failed to download image: ${error instanceof Error ? error.message : String(error)}`);
          }
        });
        
        const downloadResults = await Promise.all(downloadPromises);
        savedFiles.push(...downloadResults);
        
        const successMessage = prompts.length === 1
          ? (savedFiles.length === 1
              ? `Successfully generated and saved 1 image using model: ${model}\nSaved to: ${savedFiles[0]}`
              : `Successfully generated and saved ${savedFiles.length} images using model: ${model}\nSaved to:\n${savedFiles.map(f => `- ${f}`).join('\n')}`)
          : `Successfully generated and saved ${savedFiles.length} images from ${prompts.length} prompts using model: ${model}\nSaved to:\n${savedFiles.map(f => `- ${f}`).join('\n')}`;
        
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
              text: `Error generating images: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );
}