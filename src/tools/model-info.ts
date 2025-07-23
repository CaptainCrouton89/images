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
  
  "black-forest-labs/flux-1.1-pro": {
    name: "FLUX.1.1 [pro]",
    category: "flux",
    type: "Text-to-Image",
    description: "Best overall image generation model with state-of-the-art performance",
    quality: "Very High",
    speed: "Fast",
    cost: "Medium",
    pricing: {
      per_image: "$0.055",
      per_second: "$0.0011"
    },
    performance: {
      typical_time: "8-12 seconds",
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
    strengths: ["State-of-the-art quality", "Excellent prompt following", "Professional grade", "Fast generation"],
    weaknesses: ["Higher cost than schnell", "Still limited resolution"],
    use_cases: ["Professional work", "High-quality art", "Commercial projects", "Marketing materials"]
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
  
  "stability-ai/stable-diffusion-3.5-large": {
    name: "Stable Diffusion 3.5 Large",
    category: "sdxl",
    type: "Text-to-Image",
    description: "High-resolution image generation with fine details and diverse outputs",
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
      seed: { required: false, type: "number", description: "Random seed for reproducibility" }
    },
    strengths: ["High resolution", "Excellent detail", "Good composition", "Wide style range"],
    weaknesses: ["Slower generation", "Higher memory usage", "More expensive"],
    use_cases: ["High-res artwork", "Professional illustrations", "Detailed scenes", "Print materials"]
  },
  
  "ideogram-ai/ideogram-v3-turbo": {
    name: "Ideogram v3 Turbo",
    category: "realistic",
    type: "Text-to-Image (Text Generation)",
    description: "Fast image generation with excellent text rendering capabilities",
    quality: "High",
    speed: "Fast",
    cost: "Low",
    pricing: {
      per_image: "$0.02",
      per_second: "$0.0008"
    },
    performance: {
      typical_time: "8-12 seconds",
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
      seed: { required: false, type: "number", description: "Random seed for reproducibility" }
    },
    strengths: ["Excellent text rendering", "Fast generation", "Good realism", "Affordable"],
    weaknesses: ["Less artistic styles", "Newer model", "Limited fine control"],
    use_cases: ["Text-heavy designs", "Logos", "Marketing materials", "Social media content"]
  },
  
  "recraft-ai/recraft-v3": {
    name: "Recraft V3",
    category: "artistic",
    type: "Text-to-Image (Artistic)",
    description: "State-of-the-art artistic image generation with wide style support",
    quality: "Very High",
    speed: "Medium",
    cost: "Medium",
    pricing: {
      per_image: "$0.04",
      per_second: "$0.0012"
    },
    performance: {
      typical_time: "12-18 seconds",
      steps: 25,
      max_resolution: "1024x1024",
      batch_size: 4
    },
    parameters: {
      prompt: { required: true, type: "string", description: "Text description with style keywords" },
      negative_prompt: { required: false, type: "string", description: "What to avoid in the image" },
      width: { required: false, type: "number", default: 1024, range: "512-1024", description: "Image width" },
      height: { required: false, type: "number", default: 1024, range: "512-1024", description: "Image height" },
      num_outputs: { required: false, type: "number", default: 1, range: "1-4", description: "Number of images to generate" },
      guidance_scale: { required: false, type: "number", default: 7.0, range: "1-20", description: "How closely to follow the prompt" },
      seed: { required: false, type: "number", description: "Random seed for reproducibility" }
    },
    strengths: ["Wide style range", "Artistic excellence", "High quality", "Professional grade"],
    weaknesses: ["Higher cost", "Slower generation", "Complex style control"],
    use_cases: ["Artistic illustrations", "Creative projects", "Brand design", "Professional artwork"]
  },
  
  "recraft-ai/recraft-v3-svg": {
    name: "Recraft V3 SVG",
    category: "artistic",
    type: "Text-to-SVG",
    description: "Generate high-quality SVG images including logos and icons",
    quality: "High",
    speed: "Medium",
    cost: "Medium",
    pricing: {
      per_image: "$0.04",
      per_second: "$0.0012"
    },
    performance: {
      typical_time: "12-18 seconds",
      steps: 25,
      max_resolution: "1024x1024",
      batch_size: 4
    },
    parameters: {
      prompt: { required: true, type: "string", description: "Text description of the SVG image to generate" },
      width: { required: false, type: "number", default: 1024, range: "512-1024", description: "Image width" },
      height: { required: false, type: "number", default: 1024, range: "512-1024", description: "Image height" },
      num_outputs: { required: false, type: "number", default: 1, range: "1-4", description: "Number of images to generate" },
      seed: { required: false, type: "number", description: "Random seed for reproducibility" }
    },
    strengths: ["SVG format", "Scalable graphics", "Perfect for logos", "Clean designs"],
    weaknesses: ["Limited to simple graphics", "No photorealistic output", "Specific use case"],
    use_cases: ["Logo design", "Icon creation", "Vector graphics", "Scalable illustrations"]
  },
  
  "google/imagen-3": {
    name: "Google Imagen 3",
    category: "realistic",
    type: "Text-to-Image (Photorealistic)",
    description: "Google's high-quality text-to-image model with excellent realism",
    quality: "Very High",
    speed: "Medium",
    cost: "Medium",
    pricing: {
      per_image: "$0.04",
      per_second: "$0.0015"
    },
    performance: {
      typical_time: "15-20 seconds",
      steps: 25,
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
      seed: { required: false, type: "number", description: "Random seed for reproducibility" }
    },
    strengths: ["Photorealistic quality", "Google's technology", "Excellent detail", "Good prompt following"],
    weaknesses: ["Higher cost", "Slower generation", "Limited availability"],
    use_cases: ["Photorealistic images", "Professional photography", "Marketing materials", "High-end projects"]
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