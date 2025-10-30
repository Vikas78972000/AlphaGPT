import express from 'express';
import Thread from '../models/thread.js';
import getOpenAIAPIResponse from '../utils/openai.js';

const router = express.Router();

// ✅ Get all threads
router.get('/thread', async (req, res) => {
  try {
    const threads = await Thread.find({}).sort({ updatedAt: -1 });
    res.json(threads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// ✅ Get a specific thread by ID
router.get('/thread/:threadId', async (req, res) => {
  const { threadId } = req.params;
  try {
    const thread = await Thread.findOne({ threadId });
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.json(thread.messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// ✅ Delete a thread
router.delete('/thread/:threadId', async (req, res) => {
  const { threadId } = req.params;
  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId });
    if (!deletedThread) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    res.status(200).json({ success: 'Thread deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

// ✅ Chat route
router.post('/chat', async (req, res) => {
  const { threadId, message } = req.body;
  console.log(message);

  if (!threadId || !message) {
    return res.status(400).json({ error: 'missing fields required' });
  }

  try {
    let thread = await Thread.findOne({ threadId });

    if (!thread) {
      // Create a new thread
      thread = new Thread({
        threadId,
        title: message.slice(0, 50),
        messages: [{ role: 'user', content: message }],
      });
    } else {
      thread.messages.push({ role: 'user', content: message });
    }

    // Get assistant reply from OpenRouter
    const assistantReply = await getOpenAIAPIResponse(message);

    thread.messages.push({ role: 'assistant', content: assistantReply });
    thread.updatedAt = new Date();

    await thread.save();

    res.json({ reply: assistantReply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'something went wrong' });
  }
});

export default router;
