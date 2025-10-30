import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import serverless from 'serverless-http';  // ✅ Added for Vercel support
import chatRoutes from './routes/chat.js';

const app = express();

// ✅ Middlewares remain same
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection (changed)
const connectDB = async () => {
  // ✅ Prevent multiple connections on Vercel cold starts
  if (mongoose.connection.readyState !== 0) return;

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB Error:", err.message);
  }
};

// ✅ Always ensure DB connected before API gets request
await connectDB();

// ✅ Your API routes
app.use('/api', chatRoutes);

// ✅ Test route remains same
app.post('/api/test', async (req, res) => {
  const { message } = req.body;

  if (!message)
    return res.status(400).json({ error: 'Message is required' });

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
    res.status(500).json({ error: err.message });
  }
});

/* ❌ REMOVED this (Not allowed in Vercel serverless)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
});
*/

// ✅ ✅ ✅ REQUIRED Export for Vercel Serverless Function
export const handler = serverless(app);
