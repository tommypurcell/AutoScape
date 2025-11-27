# Freepik Integration - CORS Proxy Setup

## Problem
Freepik's API cannot be called directly from the browser due to CORS (Cross-Origin Resource Sharing) restrictions.

## Solution
We've created a local proxy server that:
1. Runs on `localhost:3001`
2. Receives requests from the React app
3. Forwards them to Freepik's API with proper authentication
4. Returns the response to the React app

## Setup Instructions

### 1. Add Freepik API Key to `.env`

```bash
VITE_FREEPIK_API_KEY=your_freepik_api_key_here
```

Get your API key from: https://www.freepik.com/api

### 2. Run Both Servers

You need to run **two** servers simultaneously:

**Option A: Two Terminal Windows**

Terminal 1 - Proxy Server:
```bash
npm run server
```

Terminal 2 - Vite Dev Server:
```bash
npm run dev
```

**Option B: Single Command (Background)**
```bash
npm run dev:all
```

This runs both servers, but the proxy runs in the background.

### 3. Verify Setup

1. **Proxy Server**: http://localhost:3001/health
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **React App**: http://localhost:3000
   - Should load normally

## How It Works

### Development Mode
```
React App (localhost:3000)
    ↓ fetch request
Proxy Server (localhost:3001)
    ↓ with API key
Freepik API (api.freepik.com)
    ↓ response
Proxy Server
    ↓ response
React App
```

### Production Mode
In production, you'll need to deploy the proxy server separately or use a serverless function (Vercel, Netlify, etc.).

## Files

- **`server.js`** - Express proxy server
- **`services/freepikService.ts`** - Client-side service (auto-detects dev/prod)
- **`package.json`** - Scripts for running servers

## Troubleshooting

### "Freepik API key not configured"
- Check that `.env` has `VITE_FREEPIK_API_KEY` or `FREEPIK_API_KEY`
- Restart the proxy server after adding the key

### "Failed to fetch"
- Make sure proxy server is running on port 3001
- Check `npm run server` output for errors
- Verify no other service is using port 3001

### CORS errors still appearing
- Confirm you're using `http://localhost:3000` (not a different port)
- Clear browser cache
- Check browser console for the actual request URL

## Port Configuration

- **Proxy Server**: `3001` (configurable via `PORT` env var)
- **Vite Dev Server**: `3000` (default)

To change proxy port:
```bash
PORT=4000 npm run server
```

Then update `freepikService.ts`:
```typescript
const FREEPIK_API_URL = import.meta.env.DEV 
  ? 'http://localhost:4000/api/freepik/generate'
  : '...';
```

## Production Deployment

For production, you'll need to:

1. **Deploy the proxy server** to a hosting service
2. **Update the production URL** in `freepikService.ts`
3. **Set environment variables** on your hosting platform

Example for Vercel:
- Create `api/freepik.js` serverless function
- Update `FREEPIK_API_URL` to use your Vercel URL
