// server.js
import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import serverless from 'serverless-http';
import chatRoutes from './routes/chat.js';

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Mount Routes ----------
app.use('/api', chatRoutes);

// ---------- Test Route ----------
// app.post('/api/test', async (req, res) => {
//   const { message } = req.body;
//   if (!message) return res.status(400).json({ error: 'Message is required' });

//   try {
//     const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         model: 'google/gemini-2.0-flash-exp:free',
//         messages: [{ role: 'user', content: message }],
//       }),
//     });

//     const data = await response.json();
//     res.json({ reply: data.choices?.[0]?.message?.content || 'No response' });
//   } catch (err) {
//     console.error('Fetch Error:', err);
//     res.status(500).json({ error: err?.message || 'Unknown error' });
//   }
// });

// ---------- MongoDB Safe Connection ----------
mongoose.set('bufferCommands', false); // fail fast instead of buffering

let isConnected = false;

const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5s timeout if cannot connect
  socketTimeoutMS: 45000,
};

async function connectDBOnce() {
  if (isConnected || mongoose.connection.readyState === 1) return;

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error('❌ MONGODB_URI not set in environment');

  try {
    await mongoose.connect(mongoUri, MONGO_OPTIONS);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err?.message || err);
    throw err;
  }
}

// ---------- Serverless Handler ----------
async function serverHandler(req, res) {
  try {
    await connectDBOnce(); // connect lazily on first request (serverless)
    return app(req, res);
  } catch (err) {
    console.error('❌ Function invocation failed:', err?.stack || err);
    res.status(500).json({
      error: 'internal_server_error',
      message: err?.message || 'unknown',
    });
  }
}

// ---------- Local Development (non-serverless) ----------
const PORT = process.env.PORT || 8080;
const runningInServerless =
  !!process.env.VERCEL ||
  !!process.env.AWS_LAMBDA_FUNCTION_NAME ||
  !!process.env.FUNCTIONS_WORKER_RUNTIME;

if (!runningInServerless) {
  (async () => {
    try {
      await connectDBOnce(); // wait for DB connection before starting
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Local server running on port ${PORT}`);
      });
    } catch (err) {
      console.error('Failed to start server due to DB error:', err?.message || err);
      process.exit(1);
    }
  })();
} else {
  console.log('🔁 Running in serverless environment — exporting handler');
}

// ---------- Export Default Handler for Vercel ----------
export default serverless(serverHandler);
