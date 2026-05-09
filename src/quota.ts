import { config } from "./config.js";
import { HttpError } from "./errors.js";

type Usage = {
  day: string;
  used: number;
};

const usageByClient = new Map<string, Usage>();

function currentDay() {
  return new Date().toISOString().slice(0, 10);
}

export function getUsage(clientId: string) {
  const day = currentDay();
  const current = usageByClient.get(clientId);
  if (!current || current.day !== day) {
    return { day, used: 0, limit: config.dailyRequestLimit };
  }
  return { day, used: current.used, limit: config.dailyRequestLimit };
}

export function reserveRequest(clientId: string) {
  const usage = getUsage(clientId);
  if (usage.used >= usage.limit) {
    throw new HttpError(429, "Daily image generation limit exceeded.", "quota_exceeded");
  }

  const next = {
    day: usage.day,
    used: usage.used + 1,
  };
  usageByClient.set(clientId, next);
  return { ...next, limit: usage.limit };
}
