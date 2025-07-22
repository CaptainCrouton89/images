import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

async function compressImageIfNeeded(inputPath: string): Promise<string> {
  const stats = fs.statSync(inputPath);
  
  if (stats.size <= MAX_FILE_SIZE) {
    return inputPath;
  }
  
  const compressedPath = inputPath.replace(/(\.[^.]+)$/, "_compressed$1");
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Calculate target quality to get under 5MB
  let quality = 80;
  let outputBuffer: Buffer;
  
  do {
    outputBuffer = await image
      .jpeg({ quality })
      .toBuffer();
    
    if (outputBuffer.length <= MAX_FILE_SIZE || quality <= 20) {
      break;
    }
    
    quality -= 10;
  } while (quality > 20);
  
  // If still too large, resize the image
  if (outputBuffer.length > MAX_FILE_SIZE && metadata.width && metadata.height) {
    const scaleFactor = Math.sqrt(MAX_FILE_SIZE / outputBuffer.length);
    const newWidth = Math.round(metadata.width * scaleFactor);
    const newHeight = Math.round(metadata.height * scaleFactor);
    
    outputBuffer = await sharp(inputPath)
      .resize(newWidth, newHeight)
      .jpeg({ quality: 80 })
      .toBuffer();
  }
  
  fs.writeFileSync(compressedPath, outputBuffer);
  return compressedPath;
}

export function registerImageProcessingTools(server: McpServer) {
  server.tool(
    "compress-image",
    "Compress an image to reduce file size (automatically triggered for images over 5MB)",
    {
      input_path: z.string().describe("Path to the input image file"),
      output_path: z.string().optional().describe("Path to save the compressed image (optional)"),
      max_size_mb: z.number().optional().describe("Maximum file size in MB (default: 5)"),
      quality: z.number().optional().describe("JPEG quality (1-100, default: 80)"),
    },
    async ({ input_path, output_path, max_size_mb, quality }) => {
      try {
        if (!fs.existsSync(input_path)) {
          throw new Error(`Input file not found: ${input_path}`);
        }

        const maxSize = (max_size_mb || 5) * 1024 * 1024;
        const stats = fs.statSync(input_path);
        
        if (stats.size <= maxSize) {
          return {
            content: [
              {
                type: "text",
                text: `Image is already under ${max_size_mb || 5}MB (${(stats.size / 1024 / 1024).toFixed(2)}MB). No compression needed.`,
              },
            ],
          };
        }

        const outputPath = output_path || input_path.replace(/(\.[^.]+)$/, "_compressed$1");
        const image = sharp(input_path);
        const metadata = await image.metadata();
        
        let targetQuality = quality || 80;
        let outputBuffer: Buffer;
        
        do {
          outputBuffer = await image
            .jpeg({ quality: targetQuality })
            .toBuffer();
          
          if (outputBuffer.length <= maxSize || targetQuality <= 20) {
            break;
          }
          
          targetQuality -= 10;
        } while (targetQuality > 20);
        
        // If still too large, resize the image
        if (outputBuffer.length > maxSize && metadata.width && metadata.height) {
          const scaleFactor = Math.sqrt(maxSize / outputBuffer.length);
          const newWidth = Math.round(metadata.width * scaleFactor);
          const newHeight = Math.round(metadata.height * scaleFactor);
          
          outputBuffer = await sharp(input_path)
            .resize(newWidth, newHeight)
            .jpeg({ quality: 80 })
            .toBuffer();
        }
        
        fs.writeFileSync(outputPath, outputBuffer);
        
        const originalSizeMB = (stats.size / 1024 / 1024).toFixed(2);
        const compressedSizeMB = (outputBuffer.length / 1024 / 1024).toFixed(2);
        const compressionRatio = ((1 - outputBuffer.length / stats.size) * 100).toFixed(1);

        return {
          content: [
            {
              type: "text",
              text: `Successfully compressed image from ${originalSizeMB}MB to ${compressedSizeMB}MB (${compressionRatio}% reduction). Saved to: ${outputPath}`,
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error compressing image: ${errorMessage}`,
            },
          ],
        };
      }
    }
  );

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
}