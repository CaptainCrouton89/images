import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface ModelParameter {
  required: boolean;
  type: string;
  description: string;
  default?: number | string;
  range?: string;
  options?: string[];
}

interface ModelInfo {
  name: string;
  category: string;
  type: string;
  description: string;
  quality: string;
  speed: string;
  cost: string;
  pricing: {
    per_image: string;
    per_second: string;
  };
  performance: {
    typical_time: string;
    steps: number;
    max_resolution: string;
    batch_size: number;
  };
  parameters: Record<string, ModelParameter>;
  strengths: string[];
  weaknesses: string[];
  use_cases: string[];
}

const models: Record<string, ModelInfo> = {
  "black-forest-labs/flux-schnell": {
    name: "FLUX.1 [schnell]",
    category: "flux",
    type: "Text-to-Image",
    description: "Fast, high-quality image generation with excellent prompt following",
    quality: "High",
    speed: "Very Fast",
    cost: "Low",
    pricing: {
      per_image: "$0.003",
      per_second: "$0.0006"
    },
    performance: {
      typical_time: "2-4 seconds",
      steps: 4,
      max_resolution: "1024x1024",
      batch_size: 4
    },
    parameters: {
      prompt: { required: true, type: "string", description: "Text description of the image to generate" },
      width: { required: false, type: "number", default: 1024, range: "256-1024", description: "Image width" },
      height: { required: false, type: "number", default: 1024, range: "256-1024", description: "Image height" },
      num_outputs: { required: false, type: "number", default: 1, range: "1-4", description: "Number of images to generate" },
      guidance_scale: { required: false, type: "number", default: 3.5, range: "1-20", description: "How closely to follow the prompt" },
      num_inference_steps: { required: false, type: "number", default: 4, range: "1-50", description: "Number of denoising steps" },
      seed: { required: false, type: "number", description: "Random seed for reproducibility" },
      output_format: { required: false, type: "string", default: "webp", options: ["webp", "jpg", "png"], description: "Output format for the generated image" },
      output_quality: { required: false, type: "number", default: 80, range: "0-100", description: "Output quality for lossy formats" }
    },
    strengths: ["Very fast generation", "High quality", "Excellent prompt adherence", "Good for batch processing"],
    weaknesses: ["Limited to 1024x1024", "Fewer style options than SDXL"],
    use_cases: ["Rapid prototyping", "Batch generation", "Real-time applications", "Commercial use"]
  },
  
  "black-forest-labs/flux-dev": {
    name: "FLUX.1 [dev]",
    category: "flux",
    type: "Text-to-Image",
    description: "Development version of FLUX with more control and higher quality",
    quality: "Very High",
    speed: "Fast",
    cost: "Medium",
    pricing: {
      per_image: "$0.055",
      per_second: "$0.0011"
    },
    performance: {
      typical_time: "10-15 seconds",
      steps: 28,
      max_resolution: "1024x1024",
      batch_size: 4
    },
    parameters: {
      prompt: { required: true, type: "string", description: "Text description of the image to generate" },
      width: { required: false, type: "number", default: 1024, range: "256-1024", description: "Image width" },
      height: { required: false, type: "number", default: 1024, range: "256-1024", description: "Image height" },
      num_outputs: { required: false, type: "number", default: 1, range: "1-4", description: "Number of images to generate" },
      guidance_scale: { required: false, type: "number", default: 3.5, range: "1-20", description: "How closely to follow the prompt" },
      num_inference_steps: { required: false, type: "number", default: 28, range: "1-50", description: "Number of denoising steps" },
      seed: { required: false, type: "number", description: "Random seed for reproducibility" },
      output_format: { required: false, type: "string", default: "webp", options: ["webp", "jpg", "png"], description: "Output format for the generated image" },
      output_quality: { required: false, type: "number", default: 80, range: "0-100", description: "Output quality for lossy formats" }
    },
    strengths: ["Highest quality", "Better control", "More detailed outputs", "Professional grade"],
    weaknesses: ["Higher cost", "Slower than schnell", "Still limited resolution"],
    use_cases: ["Professional work", "High-quality art", "Detailed illustrations", "Marketing materials"]
  },
  
  "stability-ai/sdxl": {
    name: "Stable Diffusion XL",
    category: "sdxl",
    type: "Text-to-Image",
    description: "High-resolution image generation with excellent detail and composition",
    quality: "High",
    speed: "Medium",
    cost: "Medium",
    pricing: {
      per_image: "$0.04",
      per_second: "$0.0012"
    },
    performance: {
      typical_time: "15-25 seconds",
      steps: 20,
      max_resolution: "1024x1024",
      batch_size: 4
    },
    parameters: {
      prompt: { required: true, type: "string", description: "Text description of the image to generate" },
      negative_prompt: { required: false, type: "string", description: "What to avoid in the image" },
      width: { required: false, type: "number", default: 1024, range: "512-1024", description: "Image width" },
      height: { required: false, type: "number", default: 1024, range: "512-1024", description: "Image height" },
      num_outputs: { required: false, type: "number", default: 1, range: "1-4", description: "Number of images to generate" },
      guidance_scale: { required: false, type: "number", default: 7.5, range: "1-20", description: "How closely to follow the prompt" },
      num_inference_steps: { required: false, type: "number", default: 20, range: "1-50", description: "Number of denoising steps" },
      seed: { required: false, type: "number", description: "Random seed for reproducibility" },
      refine: { required: false, type: "string", default: "expert_ensemble_refiner", options: ["expert_ensemble_refiner", "base_image_refiner"], description: "Refiner model for enhanced quality" },
      high_noise_frac: { required: false, type: "number", default: 0.8, range: "0-1", description: "Fraction of noise to use for base model" }
    },
    strengths: ["High resolution", "Excellent detail", "Good composition", "Wide style range"],
    weaknesses: ["Slower generation", "Higher memory usage", "More expensive"],
    use_cases: ["High-res artwork", "Professional illustrations", "Detailed scenes", "Print materials"]
  },
  
  "jagilley/controlnet-canny": {
    name: "ControlNet Canny",
    category: "controlnet",
    type: "Controlled Generation",
    description: "Generate images based on edge detection from input images",
    quality: "High",
    speed: "Medium",
    cost: "Medium",
    pricing: {
      per_image: "$0.08",
      per_second: "$0.0024"
    },
    performance: {
      typical_time: "20-30 seconds",
      steps: 20,
      max_resolution: "512x512",
      batch_size: 1
    },
    parameters: {
      prompt: { required: true, type: "string", description: "Text description of the image to generate" },
      image: { required: true, type: "string", description: "Input image URL for edge detection" },
      negative_prompt: { required: false, type: "string", description: "What to avoid in the image" },
      num_outputs: { required: false, type: "number", default: 1, range: "1-4", description: "Number of images to generate" },
      guidance_scale: { required: false, type: "number", default: 7.5, range: "1-20", description: "How closely to follow the prompt" },
      num_inference_steps: { required: false, type: "number", default: 20, range: "1-50", description: "Number of denoising steps" },
      seed: { required: false, type: "number", description: "Random seed for reproducibility" },
      controlnet_conditioning_scale: { required: false, type: "number", default: 1.0, range: "0-2", description: "Control strength" }
    },
    strengths: ["Precise control", "Maintains structure", "Good for transformations", "Consistent composition"],
    weaknesses: ["Requires input image", "Limited resolution", "More complex setup"],
    use_cases: ["Image transformations", "Style transfer", "Architectural visualization", "Product mockups"]
  },
  
  "prompthero/openjourney": {
    name: "OpenJourney",
    category: "anime",
    type: "Text-to-Image (Anime/Artistic)",
    description: "Midjourney-style artistic image generation",
    quality: "High",
    speed: "Medium",
    cost: "Low",
    pricing: {
      per_image: "$0.02",
      per_second: "$0.0006"
    },
    performance: {
      typical_time: "15-20 seconds",
      steps: 25,
      max_resolution: "512x512",
      batch_size: 4
    },
    parameters: {
      prompt: { required: true, type: "string", description: "Text description with artistic style keywords" },
      negative_prompt: { required: false, type: "string", description: "What to avoid in the image" },
      width: { required: false, type: "number", default: 512, range: "256-512", description: "Image width" },
      height: { required: false, type: "number", default: 512, range: "256-512", description: "Image height" },
      num_outputs: { required: false, type: "number", default: 1, range: "1-4", description: "Number of images to generate" },
      guidance_scale: { required: false, type: "number", default: 7.0, range: "1-20", description: "How closely to follow the prompt" },
      num_inference_steps: { required: false, type: "number", default: 25, range: "1-50", description: "Number of denoising steps" },
      seed: { required: false, type: "number", description: "Random seed for reproducibility" }
    },
    strengths: ["Artistic style", "Good for creative work", "Affordable", "Consistent quality"],
    weaknesses: ["Limited resolution", "Specific art style", "Less photorealistic"],
    use_cases: ["Artistic illustrations", "Creative projects", "Concept art", "Game assets"]
  },
  
  "bytedance/sdxl-lightning-4step": {
    name: "SDXL Lightning",
    category: "fast",
    type: "Text-to-Image (Fast)",
    description: "Ultra-fast SDXL variant with 4-step generation",
    quality: "Medium-High",
    speed: "Very Fast",
    cost: "Low",
    pricing: {
      per_image: "$0.004",
      per_second: "$0.0008"
    },
    performance: {
      typical_time: "2-5 seconds",
      steps: 4,
      max_resolution: "1024x1024",
      batch_size: 4
    },
    parameters: {
      prompt: { required: true, type: "string", description: "Text description of the image to generate" },
      negative_prompt: { required: false, type: "string", description: "What to avoid in the image" },
      width: { required: false, type: "number", default: 1024, range: "512-1024", description: "Image width" },
      height: { required: false, type: "number", default: 1024, range: "512-1024", description: "Image height" },
      num_outputs: { required: false, type: "number", default: 1, range: "1-4", description: "Number of images to generate" },
      guidance_scale: { required: false, type: "number", default: 1.0, range: "1-3", description: "How closely to follow the prompt" },
      num_inference_steps: { required: false, type: "number", default: 4, range: "1-8", description: "Number of denoising steps" },
      seed: { required: false, type: "number", description: "Random seed for reproducibility" }
    },
    strengths: ["Ultra-fast", "Good quality", "High resolution", "Cost effective"],
    weaknesses: ["Less fine control", "Limited steps", "Newer model"],
    use_cases: ["Rapid prototyping", "Real-time generation", "High-volume production", "Interactive applications"]
  },
  
  "stability-ai/stable-diffusion-2-1": {
    name: "Stable Diffusion 2.1",
    category: "realistic",
    type: "Text-to-Image (Realistic)",
    description: "Improved version of SD2 with better prompt following and less NSFW content",
    quality: "Medium-High",
    speed: "Medium",
    cost: "Low",
    pricing: {
      per_image: "$0.018",
      per_second: "$0.0009"
    },
    performance: {
      typical_time: "10-15 seconds",
      steps: 20,
      max_resolution: "768x768",
      batch_size: 4
    },
    parameters: {
      prompt: { required: true, type: "string", description: "Text description of the image to generate" },
      negative_prompt: { required: false, type: "string", description: "What to avoid in the image" },
      width: { required: false, type: "number", default: 768, range: "512-768", description: "Image width" },
      height: { required: false, type: "number", default: 768, range: "512-768", description: "Image height" },
      num_outputs: { required: false, type: "number", default: 1, range: "1-4", description: "Number of images to generate" },
      guidance_scale: { required: false, type: "number", default: 7.5, range: "1-20", description: "How closely to follow the prompt" },
      num_inference_steps: { required: false, type: "number", default: 20, range: "1-50", description: "Number of denoising steps" },
      seed: { required: false, type: "number", description: "Random seed for reproducibility" }
    },
    strengths: ["Realistic images", "Good prompt following", "Affordable", "Reliable"],
    weaknesses: ["Lower resolution", "Less creative", "Older architecture"],
    use_cases: ["Realistic portraits", "Photography simulation", "Commercial use", "Educational content"]
  }
};

export function registerModelInfoTool(server: McpServer) {
  server.tool(
    "get-models",
    "Get comprehensive information about available AI models including parameters, costs, and performance characteristics",
    {
      category: z.enum(["all", "flux", "sdxl", "stable-diffusion", "controlnet", "anime", "fast", "realistic", "artistic"]).optional().describe("Filter models by category (optional)"),
      model_name: z.string().optional().describe("Get details for a specific model (optional)"),
      include_pricing: z.boolean().optional().describe("Include pricing information (default: true)"),
      include_performance: z.boolean().optional().describe("Include performance metrics (default: true)"),
    },
    async ({ category, model_name, include_pricing = true, include_performance = true }) => {
      try {
        let filteredModels = { ...models };
        
        if (model_name) {
          const exactMatch = Object.keys(models).find(key => 
            key.toLowerCase() === model_name.toLowerCase() || 
            models[key].name.toLowerCase() === model_name.toLowerCase()
          );
          if (exactMatch) {
            filteredModels = { [exactMatch]: models[exactMatch] };
          } else {
            return {
              content: [{
                type: "text",
                text: `Model "${model_name}" not found. Use category "all" to see all available models.`
              }]
            };
          }
        } else if (category && category !== "all") {
          filteredModels = Object.fromEntries(
            Object.entries(models).filter(([_, model]) => model.category === category)
          );
        }
        
        let output = "";
        
        if (model_name && Object.keys(filteredModels).length === 1) {
          const [modelId, model] = Object.entries(filteredModels)[0];
          output = `# ${model.name} (${modelId})

**Type**: ${model.type}
**Category**: ${model.category}
**Quality**: ${model.quality}
**Speed**: ${model.speed}
**Cost**: ${model.cost}

**Description**: ${model.description}

## Performance Metrics${include_performance ? `
- **Typical Generation Time**: ${model.performance.typical_time}
- **Default Steps**: ${model.performance.steps}
- **Max Resolution**: ${model.performance.max_resolution}
- **Max Batch Size**: ${model.performance.batch_size}` : " (hidden)"}

## Pricing${include_pricing ? `
- **Per Image**: ${model.pricing.per_image}
- **Per Second**: ${model.pricing.per_second}` : " (hidden)"}

## Parameters
${Object.entries(model.parameters).map(([param, info]) => 
  `- **${param}**: ${info.required ? "Required" : "Optional"} ${info.type}${info.default !== undefined ? ` (default: ${info.default})` : ""}${info.range ? ` [${info.range}]` : ""}${info.options ? ` [${info.options.join(", ")}]` : ""}
  ${info.description}`
).join("\n")}

## Strengths
${model.strengths.map(s => `- ${s}`).join("\n")}

## Weaknesses
${model.weaknesses.map(w => `- ${w}`).join("\n")}

## Best Use Cases
${model.use_cases.map(u => `- ${u}`).join("\n")}`;
        } else {
          const categoryTitle = category && category !== "all" ? ` (${category.toUpperCase()})` : "";
          output = `# Available AI Models${categoryTitle}

${Object.entries(filteredModels).map(([modelId, model]) => {
  let modelInfo = `## ${model.name} (${modelId})
**Type**: ${model.type} | **Quality**: ${model.quality} | **Speed**: ${model.speed} | **Cost**: ${model.cost}
${model.description}`;
  
  if (include_performance) {
    modelInfo += `\n**Performance**: ${model.performance.typical_time}, ${model.performance.steps} steps, up to ${model.performance.max_resolution}`;
  }
  
  if (include_pricing) {
    modelInfo += `\n**Pricing**: ${model.pricing.per_image} per image, ${model.pricing.per_second} per second`;
  }
  
  modelInfo += `\n**Best for**: ${model.use_cases.slice(0, 2).join(", ")}`;
  
  return modelInfo;
}).join("\n\n")}

---

**Available Categories**: all, flux, sdxl, stable-diffusion, controlnet, anime, fast, realistic, artistic
**Usage**: Use model_name parameter to get detailed information about a specific model.`;
        }
        
        return {
          content: [{
            type: "text",
            text: output
          }]
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [{
            type: "text",
            text: `Error retrieving model information: ${errorMessage}`
          }]
        };
      }
    }
  );
}