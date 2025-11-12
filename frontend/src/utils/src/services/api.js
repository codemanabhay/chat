import axios from 'axios';
import CONSTANTS from '../utils/constants';

const API_BASE_URL = CONSTANTS.API_BASE_URL;

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(CONSTANTS.STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(CONSTANTS.STORAGE_KEYS.TOKEN);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
  register: (userData) =>
    apiClient.post('/auth/register', userData),
  logout: () =>
    apiClient.post('/auth/logout'),
  verifyToken: () =>
    apiClient.get('/auth/verify'),
  refreshToken: () =>
    apiClient.post('/auth/refresh'),
  forgotPassword: (email) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
};

// User API
export const userAPI = {
  getProfile: () =>
    apiClient.get('/users/profile'),
  updateProfile: (userData) =>
    apiClient.put('/users/profile', userData),
  uploadAvatar: (formData) =>
    apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getUsers: (filters = {}) =>
    apiClient.get('/users', { params: filters }),
  getUserById: (userId) =>
    apiClient.get(`/users/${userId}`),
  searchUsers: (query) =>
    apiClient.get('/users/search', { params: { q: query } }),
  followUser: (userId) =>
    apiClient.post(`/users/${userId}/follow`),
  unfollowUser: (userId) =>
    apiClient.post(`/users/${userId}/unfollow`),
};

// Chat API
export const chatAPI = {
  getChats: () =>
    apiClient.get('/chats'),
  getChatById: (chatId) =>
    apiClient.get(`/chats/${chatId}`),
  createChat: (participantIds) =>
    apiClient.post('/chats', { participantIds }),
  deleteChat: (chatId) =>
    apiClient.delete(`/chats/${chatId}`),
  getMessages: (chatId, pagination = {}) =>
    apiClient.get(`/chats/${chatId}/messages`, { params: pagination }),
  sendMessage: (chatId, content) =>
    apiClient.post(`/chats/${chatId}/messages`, { content }),
  editMessage: (chatId, messageId, content) =>
    apiClient.put(`/chats/${chatId}/messages/${messageId}`, { content }),
  deleteMessage: (chatId, messageId) =>
    apiClient.delete(`/chats/${chatId}/messages/${messageId}`),
  markAsRead: (chatId) =>
    apiClient.post(`/chats/${chatId}/mark-read`),
};

// Group Chat API
export const groupChatAPI = {
  getGroups: () =>
    apiClient.get('/groups'),
  getGroupById: (groupId) =>
    apiClient.get(`/groups/${groupId}`),
  createGroup: (groupData) =>
    apiClient.post('/groups', groupData),
  updateGroup: (groupId, groupData) =>
    apiClient.put(`/groups/${groupId}`, groupData),
  deleteGroup: (groupId) =>
    apiClient.delete(`/groups/${groupId}`),
  addMember: (groupId, userId) =>
    apiClient.post(`/groups/${groupId}/members`, { userId }),
  removeMember: (groupId, userId) =>
    apiClient.delete(`/groups/${groupId}/members/${userId}`),
  getGroupMessages: (groupId, pagination = {}) =>
    apiClient.get(`/groups/${groupId}/messages`, { params: pagination }),
  sendGroupMessage: (groupId, content) =>
    apiClient.post(`/groups/${groupId}/messages`, { content }),
};

// Stories API
export const storiesAPI = {
  getStories: () =>
    apiClient.get('/stories'),
  getStoryById: (storyId) =>
    apiClient.get(`/stories/${storyId}`),
  createStory: (formData) =>
    apiClient.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteStory: (storyId) =>
    apiClient.delete(`/stories/${storyId}`),
  viewStory: (storyId) =>
    apiClient.post(`/stories/${storyId}/view`),
  reactToStory: (storyId, reaction) =>
    apiClient.post(`/stories/${storyId}/react`, { reaction }),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: () =>
    apiClient.get('/notifications'),
  markAsRead: (notificationId) =>
    apiClient.put(`/notifications/${notificationId}`, { read: true }),
  deleteNotification: (notificationId) =>
    apiClient.delete(`/notifications/${notificationId}`),
  clearAll: () =>
    apiClient.delete('/notifications'),
};

// File Upload API
export const fileAPI = {
  uploadFile: (formData, onProgress) =>
    apiClient.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    }),
  deleteFile: (fileId) =>
    apiClient.delete(`/files/${fileId}`),
};

// Analytics API
export const analyticsAPI = {
  trackEvent: (eventName, eventData) =>
    apiClient.post('/analytics/events', { eventName, eventData }),
  getStats: () =>
    apiClient.get('/analytics/stats'),
};

export default {
  authAPI,
  userAPI,
  chatAPI,
  groupChatAPI,
  storiesAPI,
  notificationsAPI,
  fileAPI,
  analyticsAPI,
  apiClient,
};
