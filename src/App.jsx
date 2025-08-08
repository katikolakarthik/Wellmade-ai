import React, { useState, useRef, useEffect } from 'react';
import { Brain, FileText, Mic, CheckCircle, Bookmark, MessageSquare, Sun, Moon, Square, Loader2 } from 'lucide-react';
import Chat from './components/Chat';
import { API_BASE_URL } from './config';
import pencilIcon from './assets/pencil.png';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    // Load active tab from localStorage, default to 'topic-doubt'
    const savedTab = localStorage.getItem('wellmed_active_tab');
    return savedTab || 'topic-doubt';
  });
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pdfContent, setPdfContent] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const questionInputRef = useRef(null);
  const editInputRef = useRef(null);









  // Markdown rendering function for structured responses
  const renderMarkdownContent = (content) => {
    // Simple markdown rendering for topic doubt answers
    return content
      .split('\n')
      .map((line, index) => {
        // Handle headers
        if (line.startsWith('### ')) {
          return <h3 key={index} className="markdown-h3">{line.replace('### ', '')}</h3>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="markdown-h2">{line.replace('## ', '')}</h2>;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="markdown-h1">{line.replace('# ', '')}</h1>;
        }
        
        // Handle bullet points
        if (line.startsWith('* ') || line.startsWith('- ')) {
          const content = line.replace(/^[\*\-]\s/, '');
          return <li key={index} className="markdown-li">{parseInlineFormatting(content)}</li>;
        }
        
        // Handle numbered lists
        if (/^\d+\.\s/.test(line)) {
          const content = line.replace(/^\d+\.\s/, '');
          return <li key={index} className="markdown-li">{parseInlineFormatting(content)}</li>;
        }
        
        // Handle empty lines
        if (line.trim() === '') {
          return <br key={index} />;
        }
        
        // Regular paragraph with inline formatting
        return <p key={index} className="markdown-p">{parseInlineFormatting(line)}</p>;
      });
  };

  // Helper function to parse inline formatting (bold, italic, code)
  const parseInlineFormatting = (text) => {
    if (!text) return text;
    
    // Handle inline code with backticks
    const codeRegex = /`([^`]+)`/g;
    let result = text.replace(codeRegex, (match, code) => {
      return `<code class="inline-code">${code}</code>`;
    });
    
    // Handle bold text with **
    const boldRegex = /\*\*([^*]+)\*\*/g;
    result = result.replace(boldRegex, (match, boldText) => {
      return `<strong>${boldText}</strong>`;
    });
    
    // Handle italic text with *
    const italicRegex = /\*([^*]+)\*/g;
    result = result.replace(italicRegex, (match, italicText) => {
      return `<em>${italicText}</em>`;
    });
    
    // Convert to JSX elements
    return result.split(/(<[^>]+>[^<]*<\/[^>]+>)/).map((part, i) => {
      if (part.startsWith('<code class="inline-code">')) {
        const code = part.match(/<code class="inline-code">([^<]+)<\/code>/);
        return <code key={i} className="inline-code">{code[1]}</code>;
      }
      if (part.startsWith('<strong>')) {
        const bold = part.match(/<strong>([^<]+)<\/strong>/);
        return <strong key={i}>{bold[1]}</strong>;
      }
      if (part.startsWith('<em>')) {
        const italic = part.match(/<em>([^<]+)<\/em>/);
        return <em key={i}>{italic[1]}</em>;
      }
      return part;
    });
  };

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



  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wellmed_active_tab', activeTab);
  }, [activeTab]);

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
    const newMessages = [
      ...(pdfContent
        ? [{ role: "system", content: `Reference PDF content:\n${pdfContent}` }]
        : []),
      { role: "user", content: question }
    ];

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: newMessages,
        max_tokens: 3500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
setAnswer(data.choices?.[0]?.message?.content || "No answer received.");

  } catch (err) {
    console.error("Error asking AI:", err);
    setAnswer("Error retrieving answer.");
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

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
    }
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

  

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.type === 'application/pdf') {
      setIsPdfUploading(true);
      setUploadedFile(file);

      try {
        const formData = new FormData();
        formData.append('pdf', file);
      

        const response = await fetch(`${API_BASE_URL}/analyze-pdf`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setPdfContent(data.text);
          setQuestion(`Uploaded PDF: ${file.name}\n\nPlease analyze this medical case and provide coding recommendations based on the document content.`);
        } else {
          throw new Error(data.error || 'Failed to analyze PDF');
        }
      } catch (error) {
        console.error('PDF Analysis Error:', error);
        alert(`Failed to analyze PDF: ${error.message}. Please try uploading a different PDF file.`);
        setUploadedFile(null);
        setPdfContent('');
      } finally {
        setIsPdfUploading(false);
      }
    } else {
      alert('Please upload a PDF file.');
    }
  }
};




  const handleUploadClick = () => {
    if (uploadedFile) {
      // If file is already uploaded, clear it
      setUploadedFile(null);
      setPdfContent('');
      setQuestion('What is DRG 291 with MCC? Explain with example');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      // Otherwise, open file picker
      fileInputRef.current?.click();
    }
  };

  const handleEditQuestion = () => {
    setIsEditing(true);
    setEditText(question);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    setQuestion(editText);
    setIsEditing(false);
    setEditText('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText('');
  };

  const handleEditKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // Focus edit input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [isEditing, editText.length]);

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
                {isEditing ? (
                  <div className="edit-question-container">
                    <textarea
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyPress={handleEditKeyPress}
                      placeholder="Edit your question..."
                      className="edit-question-input"
                      style={{ color: isDarkMode ? '#e2e8f0' : '#2d3748' }}
                      rows={Math.max(3, editText.split('\n').length)}
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button
                        onClick={handleSaveEdit}
                        className="submit-edit-btn"
                        title="Submit edit"
                      >
                        Submit
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="cancel-edit-btn"
                        title="Cancel edit"
                      >
                        X
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="question-input-wrapper">
                      <textarea
                        ref={questionInputRef}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        placeholder="Ask your medical coding question..."
                        className="question-input"
                        style={{ color: isDarkMode ? '#e2e8f0' : '#2d3748' }}
                      />
                      <button
                        onClick={handleEditQuestion}
                        className="edit-question-btn"
                        title="Edit question"
                        disabled={!question.trim()}
                      >
                        <img 
                          src={pencilIcon} 
                          alt="Edit" 
                          style={{ 
                            width: '16px', 
                            height: '16px',
                            filter: 'brightness(0.6)',
                            transition: 'filter 0.3s ease'
                          }} 
                        />
                      </button>
                    </div>
                    <div className="button-group">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".pdf"
                        style={{ display: 'none' }}
                      />
                      <button 
                        className={`upload-btn ${uploadedFile ? 'uploaded' : ''} ${isPdfUploading ? 'uploading' : ''}`} 
                        onClick={handleUploadClick}
                        disabled={isPdfUploading}
                      >
                        {isPdfUploading ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <FileText />
                            {uploadedFile ? `Remove PDF: ${uploadedFile.name}` : 'Upload Case PDF'}
                          </>
                        )}
                      </button>
                      <button 
                        className={`speak-btn ${isListening ? 'listening' : ''}`}
                        onClick={handleSpeakToAsk}
                        disabled={isLoading || isPdfUploading}
                      >
                        <Mic />
                        {isListening ? 'Listening...' : 'Speak to Ask'}
                      </button>
                      <button 
                        className="ask-btn"
                        onClick={handleAskAI}
                        disabled={isLoading || isPdfUploading || !question.trim()}
                      >
                        {isLoading ? 'Processing...' : 'Ask AI'}
                      </button>
                      {isLoading && (
                        <button 
                          className="stop-btn"
                          onClick={handleStopGeneration}
                          title="Stop generation"
                        >
                          <Square size={16} />
                          Stop
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Answer Section */}
            <div className="answer-section">
              <div className="answer-header">
                <Brain className="brain-icon" />
                <h3>Answer:</h3>
              </div>
              <div className="answer-content">
                {renderMarkdownContent(answer)}
              </div>
            </div>
        
          </>
        )}
      </div>
    </div>
  );
}

export default App;
