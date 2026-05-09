import "dotenv/config";

function readOptional(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readRequired(name: string) {
  const value = readOptional(name);
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function readInteger(name: string, fallback: number) {
  const raw = readOptional(name);
  if (!raw) {
    return fallback;
  }

  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function readList(name: string, fallback: string[]) {
  const raw = readOptional(name);
  if (!raw) {
    return fallback;
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function readEnum<const T extends readonly string[]>(name: string, fallback: T[number], allowed: T): T[number] {
  const raw = readOptional(name);
  if (!raw) {
    return fallback;
  }

  if ((allowed as readonly string[]).includes(raw)) {
    return raw as T[number];
  }

  throw new Error(`${name} must be one of: ${allowed.join(", ")}.`);
}

const imageOutputFormats = ["jpeg", "png", "webp"] as const;
const imageQualities = ["low", "medium", "high", "auto"] as const;
const imageSizes = ["1024x1024", "1536x1024", "1024x1536", "auto"] as const;

export const config = {
  port: readInteger("PORT", 8788),
  nodeEnv: readOptional("NODE_ENV") ?? "development",
  gatewayToken: readRequired("TOWNINO_AI_GATEWAY_TOKEN"),
  allowedOrigins: readList("TOWNINO_ALLOWED_ORIGINS", []),
  openaiApiKey: readRequired("OPENAI_API_KEY"),
  openaiBaseUrl: readOptional("OPENAI_BASE_URL"),
  imageModel: readOptional("TOWNINO_IMAGE_MODEL") ?? "gpt-image-2",
  imageOutputFormat: readEnum("TOWNINO_IMAGE_OUTPUT_FORMAT", "jpeg", imageOutputFormats),
  imageQuality: readEnum("TOWNINO_IMAGE_QUALITY", "medium", imageQualities),
  imageSize: readEnum("TOWNINO_IMAGE_SIZE", "1536x1024", imageSizes),
  maxJsonBytes: readInteger("TOWNINO_MAX_JSON_BYTES", 10 * 1024 * 1024),
  maxImageBytes: readInteger("TOWNINO_MAX_IMAGE_BYTES", 8 * 1024 * 1024),
  dailyRequestLimit: readInteger("TOWNINO_DAILY_REQUEST_LIMIT", 100),
};

export type AppConfig = typeof config;
