// Utility helper functions for TweekChat backend

/**
 * Generate a unique username from email or name
 */
const generateUsername = (email, name) => {
  if (email) {
    return email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
  }
  if (name) {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  }
  return `user_${Date.now()}`;
};

/**
 * Sanitize user input to prevent XSS
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Format date for display
 */
const formatDate = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

/**
 * Generate random color for user avatars
 */
const generateAvatarColor = (userId) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
    '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
    '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
  ];
  const hash = userId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Validate file type for uploads
 */
const isValidFileType = (filename, allowedTypes) => {
  const ext = filename.split('.').pop().toLowerCase();
  return allowedTypes.includes(ext);
};

/**
 * Calculate file size in readable format
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate notification message
 */
const generateNotificationMessage = (type, data) => {
  switch (type) {
    case 'follow':
      return `${data.username} started following you`;
    case 'message':
      return `New message from ${data.username}`;
    case 'group_invite':
      return `${data.username} added you to ${data.groupName}`;
    case 'group_message':
      return `New message in ${data.groupName}`;
    default:
      return 'New notification';
  }
};

/**
 * Paginate results
 */
const paginate = (page = 1, limit = 20) => {
  const parsedPage = parseInt(page);
  const parsedLimit = parseInt(limit);
  const skip = (parsedPage - 1) * parsedLimit;
  return { skip, limit: parsedLimit, page: parsedPage };
};

/**
 * Create pagination metadata
 */
const createPaginationMeta = (total, page, limit) => {
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total
  };
};

/**
 * Generate JWT token expiry time
 */
const getTokenExpiry = () => {
  return Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days
};

/**
 * Check if user is online (last seen within 5 minutes)
 */
const isUserOnline = (lastSeen) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastSeen) > fiveMinutesAgo;
};

/**
 * Generate room name for Socket.io
 */
const generateRoomName = (userId1, userId2) => {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `chat_${ids[0]}_${ids[1]}`;
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Create success response
 */
const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    data
  };
};

/**
 * Create error response
 */
const errorResponse = (message, errors = null) => {
  return {
    success: false,
    message,
    errors
  };
};

/**
 * Sleep/delay function for testing
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

module.exports = {
  generateUsername,
  sanitizeInput,
  formatDate,
  generateAvatarColor,
  isValidFileType,
  formatFileSize,
  generateNotificationMessage,
  paginate,
  createPaginationMeta,
  getTokenExpiry,
  isUserOnline,
  generateRoomName,
  isValidObjectId,
  successResponse,
  errorResponse,
  sleep
};
