import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

export const fileService = {
  upload: (formData, onProgress) => api.post('/files/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }),
  getMyFiles: (search = '') => api.get(`/files/my-files?search=${search}`),
  deleteFile: (id) => api.delete(`/files/${id}`),
  getFileInfo: (shareLink) => api.get(`/files/info/${shareLink}`),
  downloadFile: (shareLink) => `${API_URL}/files/download/${shareLink}`
};

export default api;
