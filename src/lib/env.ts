const requiredSecrets = ["AUTH_SECRET", "APP_PASSWORD_HASH"] as const;

export function getEnvSecret(name: (typeof requiredSecrets)[number]): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
