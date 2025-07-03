const express = require('express');
const multer = require('multer');
const { OpenAI } = require('openai');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer();
const openai = new OpenAI(process.env.OPENAI_API_KEY);

// Middleware
app.use(cors());
app.use(express.static('public'));

// API endpoint for processing audio
app.post('/api/process-audio', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Transcribe audio with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: req.file,
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
    console.error(error);
    res.status(500).json({ error: 'Error processing audio' });
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
