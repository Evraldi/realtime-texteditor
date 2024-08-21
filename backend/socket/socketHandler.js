module.exports = (io) => {
    io.on('connection', (socket) => {
      console.log('A user connected');
  
      socket.on('updateDocument', (data) => {
        io.emit('documentUpdated', data);
      });
  
      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });
  };
  