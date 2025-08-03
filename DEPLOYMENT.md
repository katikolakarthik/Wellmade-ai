# **Production Deployment Guide**

## **Prerequisites**
- Node.js 16+ installed
- Your OpenAI API key
- A hosting platform (Heroku, Vercel, Railway, etc.)

## **Environment Variables for Production**

Create these environment variables on your hosting platform:

```bash
NODE_ENV=production
PORT=5000
OPENAI_API_KEY=your_actual_openai_api_key
```

## **Deployment Options**

### **Option 1: Heroku**
1. Install Heroku CLI
2. Create a new Heroku app
3. Set environment variables in Heroku dashboard
4. Deploy:

```bash
git add .
git commit -m "Production ready"
git push heroku main
```

### **Option 2: Vercel**
1. Connect your GitHub repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### **Option 3: Railway**
1. Connect your GitHub repo to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically

## **Build Commands**

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

## **Security Checklist**

- API key stored server-side only
- Environment variables configured
- CORS properly configured
- Error handling implemented
- Static files served correctly
- Health check endpoint available

## **Testing Production**

1. Test the health endpoint: `https://your-domain.com/api/health`
2. Test the chat functionality
3. Verify all features work correctly

## **Monitoring**

- Monitor API usage in OpenAI dashboard
- Set up error logging
- Monitor server performance 