import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

// ✅ CORS: allow frontend hosted on Vercel
app.use(cors({
  origin: 'https://wellmade-ai.vercel.app',
  credentials: true,
}));

app.use(express.json());

// ✅ PDF Analysis endpoint
app.post('/api/analyze-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfBuffer = req.file.buffer;
    const pdfData = await pdfParse(pdfBuffer);
    
    res.json({
      success: true,
      text: pdfData.text,
      pages: pdfData.numpages,
      info: pdfData.info
    });
  } catch (error) {
    console.error('PDF Analysis Error:', error);
    res.status(500).json({
      error: 'PDF Analysis Error',
      details: error.message,
    });
  }
});

// ✅ OpenAI API proxy endpoint with PDF context
app.post('/api/chat', async (req, res) => {
  try {
    const {
      messages,
      pdfContent,
      model = 'gpt-4o-mini',
      max_tokens = 1000,
      temperature = 0.7,
    } = req.body;

    // Prepare messages with PDF context if available
    let finalMessages = [...messages];
    
    if (pdfContent) {
      // Add PDF context to the system message
      const systemMessage = finalMessages.find(msg => msg.role === 'system');
      if (systemMessage) {
        systemMessage.content = `You are a helpful medical coding assistant. A PDF document has been uploaded for analysis. Here is the PDF content:

${pdfContent}

Please provide clear, accurate answers about DRG codes, CPT codes, medical coding guidelines, and related topics. When answering questions, consider both the user's question and the content from the uploaded PDF document. Format your responses in a structured way similar to ChatGPT with clear sections, bullet points, and explanations. Use markdown formatting for better readability.`;
      } else {
        finalMessages.unshift({
          role: 'system',
          content: `You are a helpful medical coding assistant. A PDF document has been uploaded for analysis. Here is the PDF content:

${pdfContent}

Please provide clear, accurate answers about DRG codes, CPT codes, medical coding guidelines, and related topics. When answering questions, consider both the user's question and the content from the uploaded PDF document. Format your responses in a structured way similar to ChatGPT with clear sections, bullet points, and explanations. Use markdown formatting for better readability.`
        });
      }
    }

    // Check if request was aborted
    if (req.aborted) {
      return res.status(499).json({ error: 'Request aborted' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: finalMessages,
        max_tokens,
        temperature,
      }),
    });

    // Check if request was aborted after fetch
    if (req.aborted) {
      return res.status(499).json({ error: 'Request aborted' });
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('OpenAI API Error:', data);
      return res.status(response.status).json({
        error: 'OpenAI API Error',
        details: data.error?.message || 'Unknown error',
      });
    }

    res.json(data);
  } catch (error) {
    if (error.name === 'AbortError' || req.aborted) {
      return res.status(499).json({ error: 'Request aborted' });
    }
    console.error('Server Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message,
    });
  }
});

// ✅ Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ✅ No static frontend serving needed

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 CORS allowed from: https://wellmade-ai.vercel.app`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📄 PDF Analysis endpoint: http://localhost:${PORT}/api/analyze-pdf`);
});

export default app;