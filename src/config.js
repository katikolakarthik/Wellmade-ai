// Configuration for different environments
const config = {
  development: {
    apiUrl: 'http://localhost:5000/api'
  },
  production: {
    apiUrl: '/api' // Relative URL for production (same domain)
  }
};

const environment = import.meta.env.MODE || 'development';
export const API_BASE_URL = config[environment].apiUrl; 