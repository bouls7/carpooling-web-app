// src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:5080/api', // Change to your backend URL and port
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
