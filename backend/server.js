// server.js
import express from 'express';
import 'dotenv/config'; // loads .env automatically
import cors from 'cors';
import mongoose from 'mongoose';
import serverless from 'serverless-http'; // keep for serverless deployments
import chatRoutes from './routes/chat.js';

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// routes
app.use('/api', chatRoutes);

app.post('/api/test', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [{ role: 'user', content: message }],
      }),
    });

    const data = await response.json();
    res.json({ reply: data.choices?.[0]?.message?.content || "No response" });
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

// ---------- MongoDB connect helper ----------
const connectDB = async () => {
  // Avoid reconnects on serverless cold starts
  if (mongoose.connection.readyState !== 0) return;

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ Missing MONGODB_URI (or MONGO_URI) in environment.");
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      // options optional depending on mongoose version
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message || err);
    // do not process.exit in serverless; just log
  }
};

// ensure DB is connected at cold start (top-level await is OK in ESM/node >= 14+)
await connectDB();

// ---------- Start server for local development only ----------
const PORT = process.env.PORT || 8080;


// Detect environment where serverless provider will call the exported handler.
// If we're NOT in a serverless platform, start a local HTTP server.
const runningInServerless =
  !!process.env.VERCEL || // Vercel sets this
  !!process.env.AWS_LAMBDA_FUNCTION_NAME || // AWS Lambda
  !!process.env.FUNCTIONS_WORKER_RUNTIME; // Azure Functions

if (!runningInServerless) {
  app.listen(PORT, () => {
    console.log(`🚀 Local server running on port ${PORT}`);
  });
} else {
  console.log("🔁 Running in serverless environment — exporting handler (no app.listen)");
}

// Export handler for serverless platforms (Vercel, Netlify, Lambda via serverless-http)
export const handler = serverless(app);
