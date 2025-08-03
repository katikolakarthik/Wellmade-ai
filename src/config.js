// Configuration for different environments
const config = {
  development: {
    apiUrl: 'https://welmed.vercel.app/api'
  },
  production: {
    apiUrl: 'https://welmed.vercel.app/api' // Relative URL for production (same domain)
  }
};

const environment = import.meta.env.MODE || 'development';
export const API_BASE_URL = config[environment].apiUrl; 
