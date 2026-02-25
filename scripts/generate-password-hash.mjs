import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("Usage: node scripts/generate-password-hash.mjs <password>");
  process.exit(1);
}

const salt = randomBytes(16);
const digest = scryptSync(password, salt, 64);

console.log(`scrypt:${salt.toString("hex")}:${digest.toString("hex")}`);
