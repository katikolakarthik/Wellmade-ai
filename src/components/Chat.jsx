import React, { useState, useRef, useEffect } from 'react';
import { User, Bot, Loader2, FileText, X, Check, X as XIcon, Sun, Moon } from 'lucide-react';
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
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editText, setEditText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const editInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        setUploadedFile(file);
        // Add a message showing the uploaded file
        const fileMessage = {
          id: Date.now(),
          type: 'user',
          content: `📎 Uploaded PDF: ${file.name}`,
          timestamp: new Date(),
          isFileUpload: true
        };
        setMessages(prev => [...prev, fileMessage]);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
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
    // Enable the main chat input for editing
    setInputMessage(content);
  };

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
    setInputMessage(''); // Clear the main input

    // Regenerate AI response
    await generateAIResponse(editText);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditText('');
    setInputMessage(''); // Clear the main input
  };

  const generateAIResponse = async (userMessage) => {
    setIsLoading(true);
    setStreamingMessage('');

    try {
      // Prepare the prompt with file context if available
      let prompt = `You are a helpful medical coding assistant. Answer the following question in a conversational, helpful manner: ${userMessage}`;
      
      if (uploadedFile) {
        prompt = `You are a helpful medical coding assistant. A PDF file "${uploadedFile.name}" has been uploaded for analysis. Please answer the following question in a conversational, helpful manner, considering the uploaded document: ${userMessage}`;
      }

      const response = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful medical coding assistant. Provide clear, accurate answers about DRG codes, CPT codes, medical coding guidelines, and related topics. Answer in a conversational, helpful manner.'
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        
        // Simulate streaming effect
        let streamedText = '';
        const words = aiResponse.split(' ');
        
        for (let i = 0; i < words.length; i++) {
          streamedText += words[i] + ' ';
          setStreamingMessage(streamedText.trim());
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: aiResponse,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setStreamingMessage('');
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
      console.error('Error calling Gemini API:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please check your connection and try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
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
              <div className="message-text">
                {message.isFileUpload ? (
                  <div className="file-upload-message">
                    <FileText size={16} />
                    <span>{message.content}</span>
                  </div>
                ) : (
                  message.content.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                  ))
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
                    {streamingMessage}
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
            disabled={isLoading}
            style={{ resize: 'none', minHeight: '44px', maxHeight: '120px' }}
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
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleUploadClick}
              className="upload-file-btn"
              title="Upload PDF file"
            >
              <FileText size={16} />
            </button>
          )}
          
          <button
            onClick={handleSpeakToAsk}
            disabled={isLoading || editingMessageId}
            className={`mic-button ${isListening ? 'listening' : ''}`}
            title={isListening ? 'Stop listening' : 'Speak to type'}
          >
            <img src={voiceIcon} alt="Voice" className="voice-icon" />
          </button>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className={`send-button ${editingMessageId ? 'editing' : ''}`}
          >
            {editingMessageId ? <Check size={20} /> : <img src={sendIcon} alt="Send" className="send-icon" />}
          </button>
        </div>
        <div className="input-hint">
          Press Enter to send, Shift+Enter for new line, or click the microphone to speak
        </div>
      </div>
    </div>
  );
};

export default Chat; 