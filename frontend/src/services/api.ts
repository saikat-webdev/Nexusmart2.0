import axios from 'axios';

// Access the environment variable.
// process.env.REACT_APP_... is how create-react-app exposes .env variables.
const API_BASE_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    // 'Accept': 'application/json' // Often defaults, but can be explicit
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add interceptors for future use (e.g., auth, logging)
// Example of a response interceptor for error handling:
api.interceptors.response.use(
  (response) => {
    // If the request was successful, just return the response
    return response;
  },
  (error) => {
    // Handle specific errors globally if you want
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
      console.error('API Error Headers:', error.response.headers);
      
      // You might want to trigger a global error message or redirect to login
      if (error.response.status === 401) {
          console.error("Unauthorized access detected. Please log in.");
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response Received:', error.request);
      if (error.request.status === 0) {
        console.error("Could not connect to the API. Is the Laravel server running?");
      }
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Request Setup Error:', error.message);
    }
    return Promise.reject(error); // Propagate the error
  }
);


export default api;