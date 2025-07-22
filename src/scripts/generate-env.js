const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
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
  console.warn('.env.local file not found. Using existing environment variables.');
}

// Get environment variables with fallbacks
const getEnvVar = (name, fallback = '') => process.env[name] || envVars[name] || fallback;

// Here process.env is available because this runs in Node.js during build
const environmentFileContent = `
export const environment = {
  production: ${getEnvVar('NODE_ENV') === 'production' || getEnvVar('production') === 'true'},
  apiUrl: '${getEnvVar('apiUrl', 'https://api.example.com')}',
  FRONTEND_BASE_URL: '${getEnvVar('FRONTEND_BASE_URL', 'http://localhost:4200')}',
  apiKey: '${getEnvVar('apiKey')}',
  authDomain: '${getEnvVar('authDomain')}',
  projectId: '${getEnvVar('projectId')}',
  storageBucket: '${getEnvVar('storageBucket')}',
  messagingSenderId: '${getEnvVar('messagingSenderId')}',
  appId: '${getEnvVar('appId')}',
  gcpProjectId: '${getEnvVar('gcpProjectId')}',
};
`;

// Debug log
console.log('Environment variables loaded:');
console.log({
  apiUrl: getEnvVar('apiUrl', 'https://api.example.com'),
  FRONTEND_BASE_URL: getEnvVar('FRONTEND_BASE_URL', 'http://localhost:4200'),
  // Omit sensitive data from logs
  apiKey: getEnvVar('apiKey') ? '****' : 'not set',
  authDomain: getEnvVar('authDomain'),
  projectId: getEnvVar('projectId'),
  storageBucket: getEnvVar('storageBucket'),
  messagingSenderId: getEnvVar('messagingSenderId'),
  appId: getEnvVar('appId') ? '****' : 'not set',
  gcpProjectId: getEnvVar('gcpProjectId'),
});

fs.writeFileSync('./src/environments/environment.prod.ts', environmentFileContent);
fs.writeFileSync('./src/environments/environment.ts', environmentFileContent);
console.log('Environment files generated');