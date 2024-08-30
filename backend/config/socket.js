const socketio = require('socket.io');

const setupSocket = (server) => {
  const io = socketio(server, {
    cors: {
      origin: 'http://localhost:3000', // Replace with your frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('New WebSocket connection');

    socket.on('joinDocument', (docId) => {
      socket.join(docId);
      console.log(`User joined document ${docId}`);
    });

    socket.on('updateDocument', (data) => {
      io.to(data._id).emit('documentUpdated', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
};

module.exports = setupSocket;
