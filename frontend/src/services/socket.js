import io from 'socket.io-client';
import CONSTANTS from '../utils/constants';

let socket = null;

const socketService = {
  // Initialize socket connection
  connect: (token) => {
    if (socket) return socket;
    
    socket = io(CONSTANTS.SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return socket;
  },

  // Disconnect socket
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  // Get socket instance
  getSocket: () => socket,

  // Check if connected
  isConnected: () => socket?.connected || false,

  // Emit events
  emit: (event, data) => {
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected');
    }
  },

  // Listen for events
  on: (event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  },

  // Remove event listener
  off: (event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  },

  // User Events
  userOnline: (userId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.USER_ONLINE, { userId });
  },

  userOffline: (userId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.USER_OFFLINE, { userId });
  },

  userTyping: (chatId, userId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.USER_TYPING, { chatId, userId });
  },

  userStopTyping: (chatId, userId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.USER_STOP_TYPING, { chatId, userId });
  },

  // Chat Events
  sendMessage: (chatId, message) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.SEND_MESSAGE, { chatId, message });
  },

  onMessageReceived: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_RECEIVED, callback);
  },

  editMessage: (messageId, content) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.EDIT_MESSAGE, { messageId, content });
  },

  onMessageEdited: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_EDITED, callback);
  },

  deleteMessage: (messageId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.DELETE_MESSAGE, { messageId });
  },

  onMessageDeleted: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_DELETED, callback);
  },

  // Message Reactions
  reactMessage: (messageId, reaction) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.REACT_MESSAGE, { messageId, reaction });
  },

  onMessageReaction: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.MESSAGE_REACTION, callback);
  },

  // Online Users
  onOnlineUsersUpdated: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.ONLINE_USERS_UPDATED, callback);
  },

  // Notifications
  onNotification: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.NOTIFICATION, callback);
  },

  // Call Events
  initiateCall: (recipientId, callData) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.CALL_INITIATED, { recipientId, ...callData });
  },

  onCallIncoming: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.CALL_INCOMING, callback);
  },

  acceptCall: (callId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.CALL_ACCEPTED, { callId });
  },

  onCallAccepted: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.CALL_ACCEPTED, callback);
  },

  rejectCall: (callId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.CALL_REJECTED, { callId });
  },

  onCallRejected: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.CALL_REJECTED, callback);
  },

  endCall: (callId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.CALL_ENDED, { callId });
  },

  onCallEnded: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.CALL_ENDED, callback);
  },

  // Group Events
  userJoinedGroup: (groupId, userId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.USER_JOINED_GROUP, { groupId, userId });
  },

  onUserJoinedGroup: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.USER_JOINED_GROUP, callback);
  },

  userLeftGroup: (groupId, userId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.USER_LEFT_GROUP, { groupId, userId });
  },

  onUserLeftGroup: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.USER_LEFT_GROUP, callback);
  },

  // Story Events
  storyPublished: (storyId, storyData) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.STORY_PUBLISHED, { storyId, ...storyData });
  },

  onStoryPublished: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.STORY_PUBLISHED, callback);
  },

  storyViewed: (storyId, userId) => {
    socketService.emit(CONSTANTS.SOCKET_EVENTS.STORY_VIEWED, { storyId, userId });
  },

  onStoryViewed: (callback) => {
    socketService.on(CONSTANTS.SOCKET_EVENTS.STORY_VIEWED, callback);
  },
};

export default socketService;
