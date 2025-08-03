# WellMed AI - Medical Coding Assistant

A secure medical coding assistant with AI-powered responses for **DRG codes**, **CPT codes**, and medical coding guidelines.

## **Security Features**

- **Secure API Key Management**: API keys are stored server-side and never exposed to the client
- **Backend Proxy**: All OpenAI API calls go through a secure backend server
- **Environment Variables**: Sensitive data is protected using environment variables

## **Quick Setup**

### **1. Install Dependencies**

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm install express cors node-fetch dotenv concurrently
```

### **2. Environment Setup**

Create a `.env` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### **3. Start the Application**

```bash
# Start both frontend and backend
npm run dev:full

# Or start them separately:
# Backend: npm run server
# Frontend: npm run dev
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## **Project Structure**

```
wellmed-ai/
├── src/                 # React frontend
│   ├── components/      # React components
│   └── assets/         # Static assets
├── server.js           # Backend server
├── .env               # Environment variables (not in git)
└── package.json       # Dependencies and scripts
```

## **Available Scripts**

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend server
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## **Security Notes**

- API key is stored server-side only
- No sensitive data in client-side code
- CORS enabled for local development
- Environment variables protected by `.gitignore`

## **Important**

Never commit your `.env` file to version control. It's already added to `.gitignore` to prevent accidental commits.

## **Features**

- Medical coding assistance
- **DRG code** analysis
- **CPT code** explanations
- Voice input support
- File upload (PDF)
- Dark/Light theme
- Responsive design
- Fullscreen chat mode