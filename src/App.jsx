import React, { useState, useRef } from 'react';
import { Brain, FileText, Mic, CheckCircle, Bookmark, MessageSquare } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('topic-doubt');
  const [question, setQuestion] = useState('Ask Anything');
  const [answer, setAnswer] = useState('DRG 291 represents Heart Failure & Shock with MCC.\n\nExample: A 65-year-old admitted with CHF and AKI undergoing treatment would be categorized under this DRG due to major complications.');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleAskAI = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': import.meta.env.VITE_GOOGLE_GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `answer  like chatgpt : ${question}. 
`
            }]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const aiResponse = data.candidates[0].content.parts[0].text;
        setAnswer(aiResponse);
      } else {
        setAnswer('I apologize, but I encountered an issue processing your request. Please try again.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setAnswer('I apologize, but I encountered an error while processing your request. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const promptTemplates = [
    'Give CPT for cholecystectomy with explanation',
    'Summarize PSI vs HAC differences',
    'Mock MCQ for UHDDS with detailed analysis',
    'PCS code for hip surgery with guidelines'
  ];

  const handleTemplateClick = (template) => {
    setQuestion(template);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
        // Read the PDF and extract text (simplified version)
        const reader = new FileReader();
        reader.onload = (e) => {
          // For now, we'll just show the filename
          // In a real implementation, you'd use a PDF parsing library
          setQuestion(`Uploaded PDF: ${file.name}\n\nPlease analyze this medical case and provide coding recommendations.`);
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  };

  const handleUploadClick = () => {
    if (uploadedFile) {
      // If file is already uploaded, clear it
      setUploadedFile(null);
      setQuestion('What is DRG 291 with MCC? Explain with example');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      // Otherwise, open file picker
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="title-section">
            <Brain className="brain-icon" />
            <h1>WellMed AI - Your AI Coding Assistant</h1>
          </div>
          <p className="tagline">Helping you master Medical Coding, IP-DRG, CPC, CDI & more.</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'topic-doubt' ? 'active' : ''}`}
            onClick={() => setActiveTab('topic-doubt')}
          >
            Topic Doubt
          </button>
          <button 
            className={`tab ${activeTab === 'coding-practice' ? 'active' : ''}`}
            onClick={() => setActiveTab('coding-practice')}
          >
            Coding Practice
          </button>
          <button 
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
        </div>

        {/* Question Section */}
        <div className="question-section">
          <h3>Ask a question or upload your summary below:</h3>
          <div className="input-container">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask your medical coding question..."
              className="question-input"
            />
            <div className="button-group">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                style={{ display: 'none' }}
              />
              <button 
                className={`upload-btn ${uploadedFile ? 'uploaded' : ''}`} 
                onClick={handleUploadClick}
              >
                <FileText />
                {uploadedFile ? `Remove PDF: ${uploadedFile.name}` : 'Upload Case PDF'}
              </button>
              <button className="speak-btn">
                <Mic />
                Speak to Ask
              </button>
              <button 
                className="ask-btn"
                onClick={handleAskAI}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Ask AI'}
              </button>
            </div>
          </div>
        </div>

        {/* Answer Section */}
        <div className="answer-section">
          <div className="answer-header">
            <Brain className="brain-icon" />
            <h3>Answer:</h3>
          </div>
          <div className="answer-content">
            {answer.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>

        {/* Tip Section */}
        <div className="tip-section">
          <div className="tip-header">
            <CheckCircle className="check-icon" />
            <h4>Tip:</h4>
          </div>
          <p>MCC increases reimbursement; watch for renal codes when coding heart failure cases.</p>
        </div>

        {/* Action Links */}
        <div className="action-links">
          <button className="action-link">
            <MessageSquare />
            Ask for Clarification
          </button>
          <button className="action-link">
            <Bookmark />
            Bookmark this Answer
          </button>
        </div>

        {/* Prompt Templates */}
        <div className="prompt-templates">
          <h4>Prompt Templates:</h4>
          <div className="template-grid">
            {promptTemplates.map((template, index) => (
              <button
                key={index}
                className="template-btn"
                onClick={() => handleTemplateClick(template)}
              >
                {template}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
