// API Configuration
const BASE_URL = 'http://localhost:8000';

// Helper function to construct full API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${BASE_URL}/${cleanEndpoint}`;
};

// Export the base URL for direct use if needed
export { BASE_URL };

export default { BASE_URL };
