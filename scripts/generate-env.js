const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
let envVars = {};

// Check if .env.local exists before trying to load it
if (fs.existsSync(envPath)) {
  console.log(`Loading environment variables from ${envPath}`);
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  envVars = { ...envConfig };

  // Merge with process.env
  for (const key in envVars) {
    process.env[key] = envVars[key];
  }
} else {
  console.warn(
    ".env.local file not found. Using existing environment variables."
  );
}

// Helper to safely retrieve env vars with fallback
const getEnvVar = (name, fallback = "") =>
  process.env[name] || envVars[name] || fallback;

// Angular-compatible environment file content
const environmentFileContent = `export const environment = {
  production: ${
    getEnvVar("NODE_ENV") === "production" || getEnvVar("production") === "true"
  },
  apiUrl: '${getEnvVar("apiUrl", "https://api.example.com")}',
  FRONTEND_BASE_URL: '${getEnvVar(
    "FRONTEND_BASE_URL",
    "http://localhost:4200"
  )}',
  apiKey: '${getEnvVar("apiKey")}',
  authDomain: '${getEnvVar("authDomain")}',
  projectId: '${getEnvVar("projectId")}',
  storageBucket: '${getEnvVar("storageBucket")}',
  messagingSenderId: '${getEnvVar("messagingSenderId")}',
  appId: '${getEnvVar("appId")}',
  gcpProjectId: '${getEnvVar("gcpProjectId")}',
  storyGenerationLimit: ${getEnvVar("storyGenerationLimit", 3)},
  enableStoryGenerationLimit: ${
    getEnvVar("enableStoryGenerationLimit", "false") === "true"
  },
  adminPassword: '${getEnvVar("ADMIN_PASSWORD")}',
  rateLimiterUrl: '${getEnvVar("rateLimiterUrl")}',
  validatePasswordUrl: '${getEnvVar("validatePasswordUrl")}',
};
`;

// Ensure the environments directory exists
const envDir = path.resolve("./src/environments");
if (!fs.existsSync(envDir)) {
  fs.mkdirSync(envDir, { recursive: true });
  console.log("Created directory: ./src/environments");
}

// Write or overwrite environment files
const writeEnvFile = (fileName) => {
  const filePath = path.join(envDir, fileName);
  fs.writeFileSync(filePath, environmentFileContent);
  console.log(`${fileName} generated successfully.`);
};

writeEnvFile("environment.ts");
writeEnvFile("environment.prod.ts");

// Debug log
console.log("Environment variables loaded:");
console.log({
  apiUrl: getEnvVar("apiUrl", "https://api.example.com"),
  FRONTEND_BASE_URL: getEnvVar("FRONTEND_BASE_URL", "http://localhost:4200"),
  apiKey: getEnvVar("apiKey") ? "****" : "not set",
  authDomain: getEnvVar("authDomain"),
  projectId: getEnvVar("projectId"),
  storageBucket: getEnvVar("storageBucket"),
  messagingSenderId: getEnvVar("messagingSenderId"),
  appId: getEnvVar("appId") ? "****" : "not set",
  gcpProjectId: getEnvVar("gcpProjectId"),
  storyGenerationLimit: getEnvVar("storyGenerationLimit", 3),
  enableStoryGenerationLimit:
    getEnvVar("enableStoryGenerationLimit", "false") === "true",
  adminPassword: getEnvVar("ADMIN_PASSWORD") ? "****" : "not set",
  rateLimiterUrl: getEnvVar("rateLimiterUrl", "not set"),
  validatePasswordUrl: getEnvVar("validatePasswordUrl", "not set"),
});
