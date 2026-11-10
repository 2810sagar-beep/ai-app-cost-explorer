// Public routing only. Cloud credentials must never be included here.
// Matches the api component route in the deployed DigitalOcean app spec.
// The JSON suffix preserves function error details through App Platform ingress.
export const FUNCTION_PATH='/ai-app-cost-explorer-functions/explorer/api.json';
