const socketio = require('socket.io');

/**
 * Sets up Socket.IO server with proper configuration and event handlers
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO server instance
 */
const setupSocket = (server) => {
  // When serving frontend from the same server, we can use '*' for origin
  const frontendURL = '*';

  // Configure Socket.IO with security settings
  const io = socketio(server, {
    cors: {
      origin: frontendURL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Add security and performance options
    pingTimeout: 30000,
    pingInterval: 25000,
    cookie: {
      name: 'io',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'
    }
  });

  // Track active users by document
  const activeUsers = new Map();

  // Set up connection event handler
  io.on('connection', (socket) => {
    console.log(`New WebSocket connection: ${socket.id}`);

    // Track which documents a socket has joined to prevent duplicate join events
    const joinedDocuments = new Set();

    // Handle document room joining
    socket.on('joinDocument', (docId) => {
      if (!docId) {
        return socket.emit('error', { message: 'Document ID is required' });
      }

      // Check if socket has already joined this document
      if (joinedDocuments.has(docId)) {
        return; // Skip if already joined
      }

      // Add to joined documents set
      joinedDocuments.add(docId);

      // Join the room
      socket.join(docId);
      console.log(`User ${socket.id} joined document ${docId}`);
    });

    // Handle document updates
    socket.on('updateDocument', (data) => {
      if (!data || !data._id) {
        return socket.emit('error', { message: 'Invalid document data' });
      }

      // Ensure content is at least an empty string, not null or undefined
      const safeData = {
        ...data,
        content: data.content || ''
      };

      // Validate content before broadcasting
      if (safeData.content === null || safeData.content === undefined) {
        safeData.content = '';
      }

      // Broadcast to all clients in the document room
      io.to(data._id).emit('documentUpdated', safeData);
    });

    // Handle document title updates
    socket.on('updateDocumentTitle', (data) => {
      if (!data || !data.docId || !data.title) {
        return socket.emit('error', { message: 'Invalid document title data' });
      }

      // Broadcast title update to all clients in the document room
      io.to(data.docId).emit('documentTitleUpdated', {
        docId: data.docId,
        title: data.title,
        updatedBy: data.userId
      });
    });

    // Handle cursor movement and selection
    socket.on('cursorMove', (data) => {
      if (!data || !data.docId || !data.position) {
        return socket.emit('error', { message: 'Invalid cursor data' });
      }

      // Store user's cursor position and selection in active users
      if (activeUsers.has(data.docId)) {
        const docUsers = activeUsers.get(data.docId);
        if (docUsers.has(data.userId)) {
          const userData = docUsers.get(data.userId);
          userData.position = data.position;
          userData.selection = data.selection;
          docUsers.set(data.userId, userData);
        }
      }

      // Broadcast cursor position to all clients in the document room except sender
      socket.to(data.docId).emit('cursorMove', data);
    });

    // Track which documents a user has announced joining to prevent duplicate notifications
    const announcedJoins = new Set();

    // Handle user joined
    socket.on('userJoined', (userData) => {
      if (!userData || !userData.docId) {
        return socket.emit('error', { message: 'Invalid user data' });
      }

      // Create a unique key for this user and document
      const joinKey = `${userData.userId}-${userData.docId}`;

      // Add user to active users for this document
      if (!activeUsers.has(userData.docId)) {
        activeUsers.set(userData.docId, new Map());
      }

      const docUsers = activeUsers.get(userData.docId);

      // Check if this is a new join or a reconnection
      const isNewJoin = !docUsers.has(userData.userId);

      // Update user data in the active users map
      docUsers.set(userData.userId, {
        ...userData,
        lastActive: new Date(),
        status: 'active'
      });

      // Only broadcast join event if this is a new join and not already announced
      if (isNewJoin && !announcedJoins.has(joinKey)) {
        // Mark as announced
        announcedJoins.add(joinKey);

        // Broadcast to all OTHER clients in the document room
        socket.to(userData.docId).emit('userJoined', userData);
      }

      // Always send current active users to the joining user
      const currentUsers = Array.from(docUsers.values());
      socket.emit('activeUsers', { docId: userData.docId, users: currentUsers });
    });

    // Handle user activity status updates
    socket.on('userActivity', (data) => {
      if (!data || !data.docId || !data.userId) {
        return socket.emit('error', { message: 'Invalid user activity data' });
      }

      // Update user status in active users
      if (activeUsers.has(data.docId)) {
        const docUsers = activeUsers.get(data.docId);
        if (docUsers.has(data.userId)) {
          const userData = docUsers.get(data.userId);
          userData.status = data.status || 'active';
          userData.lastActive = new Date();
          userData.activity = data.activity;
          docUsers.set(data.userId, userData);

          // Broadcast status update to all clients in the document room
          io.to(data.docId).emit('userActivity', {
            docId: data.docId,
            userId: data.userId,
            status: userData.status,
            activity: userData.activity
          });
        }
      }
    });

    // Handle user left
    socket.on('userLeft', (userData) => {
      if (!userData || !userData.docId) return;

      // Remove user from active users
      if (activeUsers.has(userData.docId)) {
        const docUsers = activeUsers.get(userData.docId);
        docUsers.delete(userData.userId);

        if (docUsers.size === 0) {
          activeUsers.delete(userData.docId);
        }
      }

      // Broadcast to all clients in the document room
      io.to(userData.docId).emit('userLeft', userData);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error from ${socket.id}:`, error);
    });

    // Handle comments
    socket.on('addComment', (data) => {
      if (!data || !data.docId || !data.comment) {
        return socket.emit('error', { message: 'Invalid comment data' });
      }

      // Broadcast new comment to all clients in the document room
      io.to(data.docId).emit('commentAdded', data);
    });

    // Handle comment replies
    socket.on('addCommentReply', (data) => {
      if (!data || !data.docId || !data.commentId || !data.reply) {
        return socket.emit('error', { message: 'Invalid comment reply data' });
      }

      // Broadcast new reply to all clients in the document room
      io.to(data.docId).emit('commentReplyAdded', data);
    });

    // Handle text formatting
    socket.on('applyFormat', (data) => {
      if (!data || !data.docId || !data.format) {
        return socket.emit('error', { message: 'Invalid format data' });
      }

      // Broadcast format to all clients in the document room except sender
      socket.to(data.docId).emit('formatApplied', data);
    });

    // Handle format removal
    socket.on('removeFormat', (data) => {
      if (!data || !data.docId || !data.formatId) {
        return socket.emit('error', { message: 'Invalid format removal data' });
      }

      // Broadcast format removal to all clients in the document room except sender
      socket.to(data.docId).emit('formatRemoved', data);
    });

    // Handle clearing all formats
    socket.on('clearFormats', (data) => {
      if (!data || !data.docId) {
        return socket.emit('error', { message: 'Invalid clear formats data' });
      }

      // Broadcast clear formats to all clients in the document room except sender
      socket.to(data.docId).emit('formatsCleared', data);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`User ${socket.id} disconnected: ${reason}`);

      // Remove user from all documents they were active in
      activeUsers.forEach((docUsers, docId) => {
        if (docUsers.has(socket.id)) {
          // Get user data before removing
          const userData = docUsers.get(socket.id);

          // Delete the user from the document's active users
          docUsers.delete(socket.id);

          if (docUsers.size === 0) {
            activeUsers.delete(docId);
          }

          // Remove from announced joins to allow re-announcing if they rejoin
          const joinKey = `${socket.id}-${docId}`;
          announcedJoins.delete(joinKey);

          // Notify others that user has left
          io.to(docId).emit('userLeft', {
            docId,
            userId: socket.id,
            username: userData?.username || 'User'
          });
        }
      });

      // Clear joined documents set
      joinedDocuments.clear();
    });
  });

  return io;
};

module.exports = setupSocket;
