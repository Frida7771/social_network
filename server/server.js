require('dotenv').config();
const http = require('http');
const app = require('./app');
const socketIo = require('socket.io');
const connectDB = require('./config/database');

// Connect to MongoDB
connectDB();

const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Socket.io setup for real-time features
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:4200",
    methods: ["GET", "POST"]
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle new posts
  socket.on('new-post', (postData) => {
    socket.broadcast.emit('post-created', postData);
  });

  // Handle real-time notifications
  socket.on('send-notification', (data) => {
    io.to(data.userId).emit('notification', data.notification);
  });

  // Handle messages
  socket.on('send-message', (messageData) => {
    io.to(messageData.receiverId).emit('new-message', messageData);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available in routes
app.set('io', io);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});