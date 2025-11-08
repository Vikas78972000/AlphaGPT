import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import serverless from 'serverless-http';
import chatRoutes from './routes/chat.js';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:5173', 'https://alpha-gpt-liard.vercel.app'],
    credentials: true,
  })
);

app.use(express.json());

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const options = {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      tls: true,
      tlsAllowInvalidCertificates: process.env.NODE_ENV === 'development',
    };
    cached.promise = mongoose.connect(MONGO_URI, options).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: 'db_connection_failed', message: err.message });
  }
});

app.use('/api', chatRoutes);

if (!process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Local server on port ${PORT}`));
}

// Export only the serverless handler
export const handler = serverless(app);
