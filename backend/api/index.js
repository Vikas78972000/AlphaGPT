import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import serverless from 'serverless-http';
import chatRoutes from '../routes/chat.js';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'https://alpha-gpt-liard.vercel.app'],
    credentials: true,
  })
);

app.use(express.json());

// IMPORTANT: Do NOT disable buffering globally to avoid the 'find() before connection' error
// Remove or comment out: mongoose.set('bufferCommands', false);

let isConnected = false;

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const CONNECT_OPTS = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  tls: true,
  tlsAllowInvalidCertificates: true, // For dev only; remove in production
  // Do not disable bufferCommands globally here; leave default true
};

async function connectDBOnce() {
  if (isConnected || mongoose.connection.readyState === 1) return;
  if (!MONGO_URI) throw new Error('MONGODB_URI not configured');

  try {
    await mongoose.connect(MONGO_URI, CONNECT_OPTS);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    throw err;
  }
}

// Middleware to ensure connection established before request handlers run
app.use(async (req, res, next) => {
  try {
    await connectDBOnce();
    next();
  } catch (err) {
    res.status(500).json({
      error: 'db_connection_failed',
      message: err.message,
    });
  }
});

app.use('/api', chatRoutes);

if (!process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Local server on port ${PORT}`));
}

export const handler = serverless(app);
