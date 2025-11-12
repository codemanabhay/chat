// Application Constants

// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_EMAIL: '/api/auth/verify-email',
  
  // Users
  USERS: '/api/users',
  USER_PROFILE: '/api/users/profile',
  UPDATE_PROFILE: '/api/users/profile',
  SEARCH_USERS: '/api/users/search',
  USER_STATUS: '/api/users/status',
  
  // Messages
  MESSAGES: '/api/messages',
  SEND_MESSAGE: '/api/messages/send',
  DELETE_MESSAGE: '/api/messages',
  EDIT_MESSAGE: '/api/messages',
  
  // Groups
  GROUPS: '/api/groups',
  CREATE_GROUP: '/api/groups/create',
  JOIN_GROUP: '/api/groups/join',
  LEAVE_GROUP: '/api/groups/leave',
  GROUP_MEMBERS: '/api/groups/members',
  
  // Media
  UPLOAD_IMAGE: '/api/upload/image',
  UPLOAD_FILE: '/api/upload/file',
  UPLOAD_AUDIO: '/api/upload/audio',
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // User Events
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_STATUS: 'user_status',
  
  // Message Events
  SEND_MESSAGE: 'send_message',
  RECEIVE_MESSAGE: 'receive_message',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_ERROR: 'message_error',
  MESSAGE_DELETED: 'message_deleted',
  MESSAGE_EDITED: 'message_edited',
  
  // Group Events
  SEND_GROUP_MESSAGE: 'send_group_message',
  RECEIVE_GROUP_MESSAGE: 'receive_group_message',
  JOIN_GROUP: 'join_group',
  LEAVE_GROUP: 'leave_group',
  
  // Typing Indicators
  TYPING: 'typing',
  USER_TYPING: 'user_typing',
  STOP_TYPING: 'stop_typing',
  
  // Call Events
  CALL_INITIATED: 'call_initiated',
  CALL_ACCEPTED: 'call_accepted',
  CALL_REJECTED: 'call_rejected',
  CALL_ENDED: 'call_ended',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
  CHAT_HISTORY: 'chat_history',
};

// Animation Variants for Framer Motion
export const ANIMATION_VARIANTS = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } },
  },
  slideInRight: {
    hidden: { x: 100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4 } },
  },
  slideInLeft: {
    hidden: { x: -100, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.4 } },
  },
  slideInUp: {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  },
  slideInDown: {
    hidden: { y: -100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  },
  zoomIn: {
    hidden: { scale: 0.5, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 0.3 } },
  },
  rotate3D: {
    hidden: { rotateY: -90, opacity: 0 },
    visible: { rotateY: 0, opacity: 1, transition: { duration: 0.6 } },
  },
};

// Message Types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  FILE: 'file',
  VOICE: 'voice',
};

// User Status
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away',
  BUSY: 'busy',
};

// Theme Options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// File Size Limits (in bytes)
export const FILE_SIZE_LIMITS = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  VIDEO: 50 * 1024 * 1024, // 50MB
  AUDIO: 10 * 1024 * 1024, // 10MB
  FILE: 20 * 1024 * 1024, // 20MB
};

// Allowed File Types
export const ALLOWED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  AUDIO: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'],
  FILE: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar'],
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// Debounce Delays (in milliseconds)
export const DEBOUNCE_DELAYS = {
  SEARCH: 500,
  INPUT: 300,
  RESIZE: 200,
};

// Routes
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  DASHBOARD: '/dashboard',
  CHAT: '/chat',
  CHAT_ID: '/chat/:id',
  PROFILE: '/profile',
  PROFILE_ID: '/profile/:id',
  SETTINGS: '/settings',
  GROUPS: '/groups',
  GROUP_ID: '/groups/:id',
  NOTIFICATIONS: '/notifications',
  SEARCH: '/search',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_SERVICE: '/terms-of-service',
  COOKIE_POLICY: '/cookie-policy',
  NOT_FOUND: '*',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'Unauthorized. Please login again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the limit.',
  INVALID_FILE_TYPE: 'Invalid file type.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully!',
  REGISTER_SUCCESS: 'Registration successful!',
  MESSAGE_SENT: 'Message sent successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  URL: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
};

// Creator Information
export const CREATOR_INFO = {
  NAME: 'Abhay (codemanabhay)',
  ROLE: 'Full Stack Developer',
  BIO: 'Passionate developer creating innovative solutions with modern technologies. Specialized in MERN stack, real-time applications, and 3D web experiences.',
  SKILLS: ['React', 'Node.js', 'MongoDB', 'Express', 'Socket.io', 'Three.js', 'GSAP', 'Framer Motion'],
  GITHUB: 'https://github.com/codemanabhay',
  EMAIL: 'contact@example.com',
  SOCIAL: {
    twitter: '#',
    linkedin: '#',
    portfolio: '#',
  },
};

export default {
  API_BASE_URL,
  SOCKET_URL,
  API_ENDPOINTS,
  SOCKET_EVENTS,
  STORAGE_KEYS,
  ANIMATION_VARIANTS,
  MESSAGE_TYPES,
  USER_STATUS,
  THEMES,
  ROUTES,
  CREATOR_INFO,
};
