require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const friendsRoutes = require('./routes/friends');
const chatsRoutes = require('./routes/chats');
const notificationsRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(helmet());
app.use(morgan('dev'));
app.use((req, res, next) => {
  // Sanitize all incoming data
  req.body = mongoSanitize(req.body);
  req.io = io;
  next();
});

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected............');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Test Route
app.get('/', (req, res) => {
  res.send('ChaTo Server is running and secure!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.io basic connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided.'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (_) {
    return next(new Error('Authentication error: Invalid or expired token.'));
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}.............`);
}); 