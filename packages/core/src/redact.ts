const sensitiveKey =
  /(authorization|cookie|database_url|secret|token|password|private_key|api_key)/i;
const connectionString = /\b(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s]+/gi;
const bearerToken = /\bBearer\s+[^\s]+/gi;
const clerkKey = /\b(?:pk|sk)_(?:test|live)_[A-Za-z0-9_-]+/g;

export function redactText(value: string) {
  return value
    .replace(connectionString, "[REDACTED_CONNECTION_STRING]")
    .replace(bearerToken, "Bearer [REDACTED]")
    .replace(clerkKey, "[REDACTED_CLERK_KEY]")
    .replace(/(^|\n)([A-Z][A-Z0-9_]*)(=)([^\r\n]*)/g, (line, prefix, key, equals) =>
      sensitiveKey.test(key) ? `${prefix}${key}${equals}[REDACTED]` : line,
    );
}

export function redactRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      sensitiveKey.test(key) ? "[REDACTED]" : typeof value === "string" ? redactText(value) : value,
    ]),
  );
}
