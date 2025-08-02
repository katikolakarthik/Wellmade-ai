const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

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
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React build in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// PDF upload and processing endpoint
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const pdfBuffer = req.file.buffer;
    const pdfData = await pdfParse(pdfBuffer);
    
    // Extract text content from PDF
    const pdfText = pdfData.text;
    const pageCount = pdfData.numpages;
    
    res.json({
      success: true,
      filename: req.file.originalname,
      text: pdfText,
      pageCount: pageCount,
      message: `PDF processed successfully. Extracted ${pdfText.length} characters from ${pageCount} pages.`
    });
  } catch (error) {
    console.error('PDF processing error:', error);
    res.status(500).json({
      error: 'PDF processing failed',
      details: error.message
    });
  }
});

// OpenAI API proxy endpoint with PDF context
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, pdfContext, model = 'gpt-4o-mini', max_tokens = 1000, temperature = 0.7 } = req.body;

    // If PDF context is provided, enhance the system message
    let enhancedMessages = [...messages];
    
    if (pdfContext && pdfContext.text) {
      const systemMessage = enhancedMessages.find(msg => msg.role === 'system');
      if (systemMessage) {
        systemMessage.content = `You are a helpful medical coding assistant. A PDF document has been uploaded with the following content:

${pdfContext.text.substring(0, 8000)}${pdfContext.text.length > 8000 ? '...' : ''}

Please provide clear, accurate answers about DRG codes, CPT codes, medical coding guidelines, and related topics. When answering questions, consider the content of the uploaded PDF document and reference specific information from it when relevant. Format your responses in a structured way similar to ChatGPT with clear sections, bullet points, and explanations. Use markdown formatting for better readability.`;
      }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        messages: enhancedMessages,
        max_tokens,
        temperature
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API Error:', data);
      return res.status(response.status).json({
        error: 'OpenAI API Error',
        details: data.error?.message || 'Unknown error'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', environment: process.env.NODE_ENV || 'development' });
});

// Serve React app for all other routes in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
}); 