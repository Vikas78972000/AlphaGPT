import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = 8080;
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected with Database!');
  } catch (err) {
    console.error('❌ Failed to connect with DB!', err);
  }
};

app.use(express.json());
app.use(cors());
app.use('/api', chatRoutes);
app.post('/api/test', async (req, res) => {
  const message = req.body.message;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{ role: 'user', content: message }],
    }),
  };

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', options);
    const data = await response.json();

    if (data?.choices?.[0]?.message?.content) {
      res.json({ reply: data.choices[0].message.content });
    } else {
      console.error('Unexpected response:', data);
      res.status(500).json({ error: 'Unexpected API response', details: data });
    }
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Failed to connect to OpenRouter', details: err.message });
  }
});
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
});


