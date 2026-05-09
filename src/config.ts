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

export const config = {
  port: readInteger("PORT", 8788),
  nodeEnv: readOptional("NODE_ENV") ?? "development",
  gatewayToken: readRequired("TOWNINO_AI_GATEWAY_TOKEN"),
  allowedOrigins: readList("TOWNINO_ALLOWED_ORIGINS", []),
  openaiApiKey: readRequired("OPENAI_API_KEY"),
  openaiBaseUrl: readOptional("OPENAI_BASE_URL"),
  imageModel: readOptional("TOWNINO_IMAGE_MODEL") ?? "gpt-image-2",
  allowedImageModels: new Set(readList("TOWNINO_ALLOWED_IMAGE_MODELS", ["gpt-image-2"])),
  maxJsonBytes: readInteger("TOWNINO_MAX_JSON_BYTES", 10 * 1024 * 1024),
  maxImageBytes: readInteger("TOWNINO_MAX_IMAGE_BYTES", 8 * 1024 * 1024),
  dailyRequestLimit: readInteger("TOWNINO_DAILY_REQUEST_LIMIT", 100),
};

export type AppConfig = typeof config;
