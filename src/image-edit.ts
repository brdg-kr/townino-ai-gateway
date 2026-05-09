import OpenAI, { toFile } from "openai";
import { z } from "zod";

import { config } from "./config.js";
import { HttpError } from "./errors.js";

const imageDataUrlSchema = z
  .string()
  .regex(/^data:image\/(?:jpeg|jpg|png|webp);base64,/i, "Image must be a jpeg, png, or webp data URL.");

const menuPhotoEditSchema = z.object({
  model: z.string().min(1).max(80).optional(),
  prompt: z.string().min(20).max(6000),
  image: z.object({
    dataUrl: imageDataUrlSchema,
  }),
  outputFormat: z.enum(["jpeg", "png", "webp"]).optional(),
  quality: z.enum(["low", "medium", "high", "auto"]).optional(),
  size: z.enum(["1024x1024", "1536x1024", "1024x1536", "auto"]).optional(),
  user: z.string().trim().min(1).max(120).optional(),
});

export type MenuPhotoEditRequest = {
  model: string;
  prompt: string;
  image: {
    dataUrl: string;
  };
  outputFormat: typeof config.imageOutputFormat;
  quality: typeof config.imageQuality;
  size: typeof config.imageSize;
  user?: string;
};

export type MenuPhotoEditResult = {
  model: string;
  outputFormat: "jpeg" | "png" | "webp";
  contentType: string;
  dataUrl: string;
  revisedPrompt?: string;
  usage?: unknown;
};

export interface ImageEditor {
  editMenuPhoto(input: MenuPhotoEditRequest): Promise<MenuPhotoEditResult>;
}

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
  baseURL: config.openaiBaseUrl,
});

function contentTypeForOutputFormat(format: MenuPhotoEditRequest["outputFormat"]) {
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  return "image/jpeg";
}

function extensionForContentType(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) {
    throw new HttpError(400, "Invalid image data URL.", "invalid_image");
  }

  const contentType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const body = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!body.length) {
    throw new HttpError(400, "Image body is empty.", "invalid_image");
  }
  if (body.length > config.maxImageBytes) {
    throw new HttpError(413, "Image is too large.", "image_too_large");
  }

  return { body, contentType };
}

export function parseMenuPhotoEditRequest(payload: unknown) {
  const parsed = menuPhotoEditSchema.parse(payload);
  if (parsed.model && parsed.model !== config.imageModel) {
    throw new HttpError(400, `Model is not allowed: ${parsed.model}`, "model_not_allowed");
  }
  return {
    prompt: parsed.prompt,
    image: parsed.image,
    user: parsed.user,
    model: config.imageModel,
    outputFormat: config.imageOutputFormat,
    quality: config.imageQuality,
    size: config.imageSize,
  };
}

export async function editMenuPhoto(input: MenuPhotoEditRequest): Promise<MenuPhotoEditResult> {
  const source = parseDataUrl(input.image.dataUrl);
  const sourceFile = await toFile(
    source.body,
    `source.${extensionForContentType(source.contentType)}`,
    { type: source.contentType }
  );

  const response = await openai.images.edit({
    model: input.model,
    image: sourceFile,
    prompt: input.prompt,
    n: 1,
    size: input.size,
    quality: input.quality,
    output_format: input.outputFormat,
    user: input.user,
  } as never);

  const image = response.data?.[0];
  const b64 = image?.b64_json;
  if (!b64) {
    throw new HttpError(502, "OpenAI did not return image data.", "missing_image_data");
  }

  const contentType = contentTypeForOutputFormat(input.outputFormat);
  return {
    model: input.model,
    outputFormat: input.outputFormat,
    contentType,
    dataUrl: `data:${contentType};base64,${b64}`,
    revisedPrompt: image.revised_prompt,
    usage: response.usage,
  };
}
