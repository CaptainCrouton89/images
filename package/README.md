# MCP Image Tools Server

A comprehensive MCP (Model Context Protocol) server that provides AI image generation and editing capabilities. This server integrates with Claude, Cursor, or other MCP-compatible AI assistants to offer powerful image manipulation tools.

## Purpose

This server provides a complete suite of image tools for AI assistants, including:

- AI image generation using various models (FLUX, SDXL, Stable Diffusion, etc.)
- Image processing and editing (filters, cropping, resizing, rotation)
- Format conversion and metadata extraction
- Comprehensive model information and recommendations

## Features

- **Image Generation**: Support for multiple AI models including FLUX, SDXL, ControlNet, and more
- **Image Processing**: Apply filters, crop, resize, rotate, and convert images
- **Model Information**: Get detailed information about available AI models, pricing, and performance
- **TypeScript Support**: Fully typed with proper type definitions
- **Modular Architecture**: Well-organized code structure with separate tool modules
- **Easy Installation**: Scripts for different MCP clients

## Available Tools

### Image Generation
- `generate-image`: Generate images using various Replicate models with extensive customization options

### Image Processing
- `apply-filter`: Apply filters (blur, sharpen, brightness, contrast, etc.)
- `crop-image`: Crop images to specified dimensions
- `resize-image`: Resize or scale images with various fitting options
- `rotate-image`: Rotate images by specified angles
- `convert-image-format`: Convert between different image formats
- `get-image-metadata`: Extract detailed metadata from images

### Model Information
- `get-models`: Get comprehensive information about available AI models including parameters, costs, and performance characteristics

## Getting Started

```bash
# Clone the repository
git clone <your-repo-url>
cd mcp-images

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your REPLICATE_API_TOKEN

# Build the project
pnpm run build

# Start the server
pnpm start
```

## Installation Scripts

This server includes convenient installation scripts for different MCP clients:

```bash
# For Claude Desktop
pnpm run install-desktop

# For Cursor
pnpm run install-cursor

# For Claude Code
pnpm run install-code

# Generic installation
pnpm run install-server
```

These scripts will build the project and automatically update the appropriate configuration files.

## Usage with Claude Desktop

The installation script will automatically add the configuration, but you can also manually add it to your `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "image-tools": {
      "command": "node",
      "args": ["/path/to/your/dist/index.js"],
      "env": {
        "REPLICATE_API_TOKEN": "your-replicate-api-token"
      }
    }
  }
}
```

Then restart Claude Desktop to connect to the server.

## Usage Examples

### Generating Images

```bash
# Generate an image using FLUX
generate-image --model "black-forest-labs/flux-schnell" --prompt "A beautiful sunset over mountains"

# Generate multiple images with different prompts
generate-image --model "stability-ai/sdxl" --prompt ["A cat", "A dog"] --num_outputs 2

# Generate with specific parameters
generate-image --model "black-forest-labs/flux-dev" --prompt "Cyberpunk cityscape" --width 1024 --height 1024 --guidance_scale 7.5
```

### Processing Images

```bash
# Apply a blur filter
apply-filter --input_path "image.jpg" --filter "blur" --amount 5

# Crop an image
crop-image --input_path "image.jpg" --x 100 --y 100 --width 500 --height 500

# Resize an image
resize-image --input_path "image.jpg" --width 800 --height 600 --fit "cover"

# Convert format
convert-image-format --input_path "image.jpg" --format "png" --quality 90
```

### Getting Model Information

```bash
# List all available models
get-models --category "all"

# Get information about a specific model
get-models --model_name "black-forest-labs/flux-schnell"

# Filter by category
get-models --category "flux" --include_pricing true
```

## Environment Variables

Create a `.env` file in the root directory:

```
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

You can get a Replicate API token from https://replicate.com/account/api-tokens

## Project Structure

```
├── src/
│   ├── index.ts                    # Main server entry point
│   └── tools/                      # Tool implementations
│       ├── generate-image.ts       # Image generation tool
│       ├── image-processing.ts     # Image processing tools
│       └── model-info.ts          # Model information tool
├── scripts/                        # Installation and utility scripts
├── dist/                          # Compiled JavaScript (generated)
├── images/                        # Default directory for generated images
├── .env.example                   # Environment variable template
├── package.json                   # Project configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                     # This file
```

## Development

1. Make changes to files in `src/`
2. Run `pnpm run build` to compile
3. Test your server with `pnpm start`
4. Use the installation scripts to update your MCP client configuration

## Supported Models

The server supports a wide range of AI models including:

- **FLUX Models**: flux-schnell, flux-dev (fast, high-quality)
- **SDXL Models**: stability-ai/sdxl (high-resolution, detailed)
- **Stable Diffusion**: Various versions for different use cases
- **ControlNet**: For controlled generation with input images
- **Specialized Models**: Anime, realistic, artistic styles

Use the `get-models` tool to see detailed information about all available models, including pricing, performance metrics, and optimal use cases.

## License

MIT
