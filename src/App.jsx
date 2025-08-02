import React, { useState, useRef, useEffect } from 'react';
import { Brain, FileText, Mic, CheckCircle, Bookmark, MessageSquare, Sun, Moon } from 'lucide-react';
import Chat from './components/Chat';
import { API_BASE_URL } from './config';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('topic-doubt');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('DRG 291 represents Heart Failure & Shock with MCC.\n\nExample: A 65-year-old admitted with CHF and AKI undergoing treatment would be categorized under this DRG due to major complications.');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const questionInputRef = useRef(null);

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      if (event.results.length > 0 && event.results[0].length > 0) {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        alert('Please allow microphone access to use speech recognition.');
      } else if (event.error === 'no-speech') {
        alert('No speech detected. Please try speaking again.');
      } else {
        alert(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  };

  const handleSpeakToAsk = () => {
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Start listening
    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initializeSpeechRecognition();
      }

      if (recognitionRef.current) {
        recognitionRef.current.start();
      } else {
        alert('Speech recognition is not available. Please use Chrome or Edge browser.');
      }
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      alert('Error starting speech recognition. Please try again.');
      setIsListening(false);
    }
  };



  const handleAskAI = async () => {
    if (!question.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: question
            },
            {
              role: 'user',
              content: question
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        setAnswer(aiResponse);
      } else {
        setAnswer('I apologize, but I encountered an issue processing your request. Please try again.');
      }
    } catch (error) {
      console.error('Error calling API:', error);
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
    // Focus on the input area after setting the question
    setTimeout(() => {
      questionInputRef.current?.focus();
    }, 100);
  };

  const handleAskForClarification = () => {
    const clarificationQuestion = `Please provide more details or clarification about: ${answer}`;
    setQuestion(clarificationQuestion);
    // Focus on the input area after setting the question
    setTimeout(() => {
      questionInputRef.current?.focus();
    }, 100);
  };

  const handleBookmarkAnswer = () => {
    // Store the current Q&A in localStorage
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const newBookmark = {
      id: Date.now(),
      question: question,
      answer: answer,
      timestamp: new Date().toISOString()
    };
    bookmarks.push(newBookmark);
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    
    // Show feedback to user
    alert('Answer bookmarked successfully!');
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
          <div className="header-top">
            <div className="title-section">
              <Brain className="brain-icon" />
              <h1>WellMed AI - Your AI Coding Assistant</h1>
            </div>
            <div className="theme-toggle-switch">
              <button
                onClick={() => !isDarkMode && toggleTheme()}
                className={`theme-option ${!isDarkMode ? 'active' : ''}`}
                title="Light Mode"
              >
                <Sun size={16} />
              </button>
              <button
                onClick={() => isDarkMode && toggleTheme()}
                className={`theme-option ${isDarkMode ? 'active' : ''}`}
                title="Dark Mode"
              >
                <Moon size={16} />
              </button>
            </div>
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
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'chat' ? (
          <Chat isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        ) : (
          <>
            {/* Question Section */}
            <div className="question-section">
              <h3>Ask a question or upload your summary below:</h3>
              <div className="input-container">
                <textarea
                  ref={questionInputRef}
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
                  <button 
                    className={`speak-btn ${isListening ? 'listening' : ''}`}
                    onClick={handleSpeakToAsk}
                    disabled={isLoading}
                  >
                    <Mic />
                    {isListening ? 'Listening...' : 'Speak to Ask'}
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
              <button className="action-link" onClick={handleAskForClarification}>
                <MessageSquare />
                Ask for Clarification
              </button>
              <button className="action-link" onClick={handleBookmarkAnswer}>
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
          </>
        )}
      </div>
    </div>
  );
}

export default App;
