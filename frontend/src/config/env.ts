function requirePublicEnv(name: "NEXT_PUBLIC_API_URL"): string {
  const value = process.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.local.example to .env.local and set it.`,
    );
  }

  return value;
}

export const env = {
  apiUrl: requirePublicEnv("NEXT_PUBLIC_API_URL"),
} as const;
