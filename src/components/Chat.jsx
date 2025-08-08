import React, { useState, useRef, useEffect } from 'react';
import { User, Bot, Loader2, FileText, X, Check, X as XIcon, Sun, Moon, Square } from 'lucide-react';
import { API_BASE_URL } from '../config';
import pencilIcon from '../assets/pencil.png';
import sendIcon from '../assets/send.png';
import voiceIcon from '../assets/voice-command.png';
import expandIcon from '../assets/expand.png';

const Chat = ({ isDarkMode, toggleTheme }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! I\'m your WellMed AI assistant. I can help you with medical coding, DRG analysis, CPT codes, and more. How can I assist you today?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [pdfContent, setPdfContent] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const editInputRef = useRef(null);


const [sessionId, setSessionId] = useState('user23');

useEffect(() => {
  let storedSessionId = localStorage.getItem('wellmed_session_id');
  if (!storedSessionId) {
    storedSessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('wellmed_session_id', storedSessionId);
  }
  setSessionId(storedSessionId);
}, []);












  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat data from localStorage on component mount
  useEffect(() => {
    const savedChatData = localStorage.getItem('wellmed_chat_data');
    if (savedChatData) {
      try {
        const parsedData = JSON.parse(savedChatData);
        if (parsedData.messages && Array.isArray(parsedData.messages)) {
          // Convert timestamp strings back to Date objects
          const messagesWithDates = parsedData.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(messagesWithDates);
        }
        if (parsedData.pdfContent) {
          setPdfContent(parsedData.pdfContent);
        }
        if (parsedData.uploadedFileName) {
          // Create a mock file object for display purposes
          setUploadedFile({ name: parsedData.uploadedFileName });
        }
      } catch (error) {
        console.error('Error loading chat data from localStorage:', error);
        // If there's an error, start with default welcome message
        setMessages([
          {
            id: 1,
            type: 'assistant',
            content: 'Hello! I\'m your WellMed AI assistant. I can help you with medical coding, DRG analysis, CPT codes, and more. How can I assist you today?',
            timestamp: new Date()
          }
        ]);
      }
    }
  }, []);

  // Save chat data to localStorage whenever messages, pdfContent, or uploadedFile changes
  useEffect(() => {
    const chatData = {
      messages: messages,
      pdfContent: pdfContent,
      uploadedFileName: uploadedFile?.name || null
    };
    localStorage.setItem('wellmed_chat_data', JSON.stringify(chatData));
  }, [messages, pdfContent, uploadedFile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

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
        setInputMessage(transcript);
      }
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error('Chat speech recognition error:', event.error);
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
      console.error('Error starting chat speech recognition:', error);
      alert('Error starting speech recognition. Please try again.');
      setIsListening(false);
    }
  };

  

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    if (file.type === 'application/pdf') {
      setIsPdfUploading(true);
      setUploadedFile(file);

      const fileMessage = {
        id: Date.now(),
        type: 'user',
        content: `📎 Uploaded PDF: ${file.name}`,
        timestamp: new Date(),
        isFileUpload: true
      };
      setMessages(prev => [...prev, fileMessage]);

      try {
        const formData = new FormData();
        formData.append('pdf', file);

        // ✅ Pass the sessionId from your app state
        formData.append('sessionId', sessionId); // make sure sessionId is defined!

        const response = await fetch(`${API_BASE_URL}/analyze-pdf`, {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setPdfContent(data.text);

          const analysisMessage = {
            id: Date.now() + 1,
            type: 'assistant',
            content: `✅ PDF analyzed successfully! I've extracted ${data.pages} pages of content. I can now answer questions based on this document.`,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, analysisMessage]);
        } else {
          throw new Error(data.error || 'Failed to analyze PDF');
        }
      } catch (error) {
        console.error('PDF Analysis Error:', error);

        const errorMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: `❌ Failed to analyze PDF: ${error.message}. Please try uploading a different PDF file.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
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







  const handleRemoveFile = () => {
    setUploadedFile(null);
    setPdfContent('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    if (uploadedFile) {
      handleRemoveFile();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleEditMessage = (messageId, content) => {
    setEditingMessageId(messageId);
    setEditText(content);
    // Don't set the main input for editing, use separate edit state
  };

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [editingMessageId, editText.length]);

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;

    // Update the message content
    setMessages(prev => prev.map(msg => 
      msg.id === editingMessageId 
        ? { ...msg, content: editText }
        : msg
    ));

    // Remove all messages after the edited message
    setMessages(prev => {
      const editedIndex = prev.findIndex(msg => msg.id === editingMessageId);
      return prev.slice(0, editedIndex + 1);
    });

    setEditingMessageId(null);
    setEditText('');

    // Regenerate AI response
    await generateAIResponse(editText);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
  };

  

const generateAIResponse = async (userMessage) => {
  const controller = new AbortController();
  setAbortController(controller);
  setIsLoading(true);
  setStreamingMessage('');

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      ...messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ],
    pdfContent: pdfContent,
    max_tokens: 3500,
    temperature: 0.7
  }),
  signal: controller.signal
});

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const aiResponse = data.choices[0].message.content;

      // Simulate streaming effect
      let streamedText = '';
      const words = aiResponse.split(' ');

      for (let i = 0; i < words.length; i++) {
        if (controller.signal.aborted) {
          break;
        }
        streamedText += words[i] + ' ';
        setStreamingMessage(streamedText.trim());
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      if (!controller.signal.aborted) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setStreamingMessage('');
      }
    } else {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I apologize, but I encountered an issue processing your request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Request was aborted');
      const stoppedMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Response generation was stopped.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, stoppedMessage]);
      setStreamingMessage('');
    } else {
      console.error('Error calling API:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please check your connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  } finally {
    setIsLoading(false);
    setAbortController(null);
  }
};







  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    // If we're editing, save the edit instead
    if (editingMessageId) {
      await handleSaveEdit();
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    
    await generateAIResponse(inputMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMarkdownContent = (content) => {
    // Simple markdown rendering for chat messages
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsLoading(false);
      setStreamingMessage('');
    }
  };

  const clearChatHistory = () => {
    if (window.confirm('Are you sure you want to clear the chat history? This action cannot be undone.')) {
      setMessages([
        {
          id: 1,
          type: 'assistant',
          content: 'Hello! I\'m your WellMed AI assistant. I can help you with medical coding, DRG analysis, CPT codes, and more. How can I assist you today?',
          timestamp: new Date()
        }
      ]);
      setPdfContent('');
      setUploadedFile(null);
      localStorage.removeItem('wellmed_chat_data');
    }
  };

  return (
    <div className={`chat-container ${isFullscreen ? 'fullscreen' : ''}`}>
              <div className="chat-header">
          <div className="chat-header-content">
            <div>
              <h2>WellMed AI Chat</h2>
              <p>Ask me anything about medical coding, DRG analysis, CPT codes, and more!</p>
            </div>
            <div className="header-buttons">
              <button
                onClick={clearChatHistory}
                className="clear-chat-btn"
                title="Clear Chat History"
              >
                <X size={16} />
              </button>
              {isFullscreen && (
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
              )}
              <button
                onClick={toggleFullscreen}
                className="fullscreen-toggle"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                <img src={expandIcon} alt="Expand" className="expand-icon" />
              </button>
            </div>
          </div>
        </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">
              {message.type === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className="message-content">
              {editingMessageId === message.id ? (
                <div className="edit-message-container">
                  <textarea
                    ref={editInputRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={handleEditKeyPress}
                    className="edit-message-input"
                    style={{ color: isDarkMode ? '#e2e8f0' : '#2d3748' }}
                    rows={Math.max(2, editText.split('\n').length)}
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
                  <div className="message-text">
                    {message.isFileUpload ? (
                      <div className="file-upload-message">
                        <FileText size={16} />
                        <span>{message.content}</span>
                      </div>
                    ) : (
                      renderMarkdownContent(message.content)
                    )}
                  </div>
                  <div className="message-footer">
                    <div className="message-time">
                      {formatTime(message.timestamp)}
                    </div>
                    {message.type === 'user' && !message.isFileUpload && (
                      <button
                        onClick={() => handleEditMessage(message.id, message.content)}
                        className="edit-message-btn"
                        title="Edit message"
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          background: '#f7fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          color: '#4a5568',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          marginLeft: '8px'
                        }}
                      >
                        <img 
                          src={pencilIcon} 
                          alt="Edit" 
                          style={{ 
                            width: '14px', 
                            height: '14px',
                            filter: 'brightness(0.6)',
                            transition: 'filter 0.3s ease'
                          }} 
                        />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="message-text">
                {streamingMessage ? (
                  <>
                    {renderMarkdownContent(streamingMessage)}
                    <span className="cursor">|</span>
                  </>
                ) : (
                  <div className="loading-dots">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={editingMessageId ? "Edit your message..." : "Type your message here..."}
            className={`chat-input ${editingMessageId ? 'editing' : ''}`}
            rows={1}
            disabled={isLoading || isPdfUploading}
            style={{ 
              resize: 'none', 
              minHeight: '44px', 
              maxHeight: '120px',
              color: isDarkMode ? '#e2e8f0' : '#2d3748'
            }}
          />
          
          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf"
            style={{ display: 'none' }}
          />
          {uploadedFile ? (
            <div className="uploaded-file">
              <FileText size={16} />
              <span className="file-name">{uploadedFile.name}</span>
              <button
                onClick={handleRemoveFile}
                className="remove-file-btn"
                title="Remove file"
                disabled={isPdfUploading}
              >
                X
              </button>
            </div>
          ) : (
            <button
              onClick={handleUploadClick}
              className={`upload-file-btn ${isPdfUploading ? 'uploading' : ''}`}
              title="Upload PDF file"
              disabled={isPdfUploading}
            >
              {isPdfUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileText size={16} />
              )}
            </button>
          )}
          
          <button
            onClick={handleSpeakToAsk}
            disabled={isLoading || editingMessageId || isPdfUploading}
            className={`mic-button ${isListening ? 'listening' : ''}`}
            title={isListening ? 'Stop listening' : 'Speak to type'}
          >
            <img src={voiceIcon} alt="Voice" className="voice-icon" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading || isPdfUploading}
            className={`send-button ${editingMessageId ? 'editing' : ''}`}
          >
            {editingMessageId ? <Check size={20} /> : <img src={sendIcon} alt="Send" className="send-icon" />}
          </button>
          {isLoading && (
            <button 
              onClick={handleStopGeneration}
              className="stop-btn"
              title="Stop generation"
            >
              <Square size={16} />
              Stop
            </button>
          )}
        </div>
        <div className="input-hint">
          Press Enter to send, Shift+Enter for new line, or click the microphone to speak
        </div>
      </div>
    </div>
  );
};

export default Chat; 
