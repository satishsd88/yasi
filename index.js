const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(cors());
app.use(express.static('public'));

// Helper function to convert buffer to stream
const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

// API endpoint for processing audio
app.post('/api/process-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Create a file-like object for OpenAI API
    const file = {
      buffer: req.file.buffer,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      stream: bufferToStream(req.file.buffer)
    };

    // Transcribe audio with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1"
    });

    // Get GPT response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "user", content: transcription.text }
      ]
    });

    res.json({
      transcript: transcription.text,
      answer: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("Detailed error:", error);
    res.status(500).json({ 
      error: 'Error processing audio',
      details: error.message
    });
  }
});

// Results page
app.get('/results', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'results.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
