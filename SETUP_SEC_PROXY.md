# SEC EDGAR Proxy Setup Guide

This guide explains how to set up and use the SEC EDGAR proxy server for automated trader data updates.

## Quick Start

### Option 1: Automatic Server Management (Recommended)
The **Update Latest Trades** button now includes built-in server status monitoring:

1. Navigate to any Famous Traders page
2. Look for the **Server Status** indicator at the top of the update section
3. If the server is stopped, click **"Start Server"** for instructions
4. The UI will automatically detect when the server is running
5. Click **"Update Latest Trades"** to fetch the latest data

### Option 2: Manual Server Management

#### Start Both Servers Together
```bash
# Option A: Using concurrently (recommended)
npm run dev-with-proxy

# Option B: Using custom script
npm run dev-full
```

#### Start Servers Separately
```bash
# Terminal 1: Start proxy server
npm run start-proxy

# Terminal 2: Start React app
npm start
```

## Features

### Real-Time Server Monitoring
- **Green indicator**: Proxy server is running and accessible
- **Red indicator**: Proxy server is stopped or unreachable
- **Auto-refresh**: Status updates every 30 seconds
- **Manual refresh**: Click the refresh button to check immediately

### Progress Tracking
The update process shows 5 distinct stages:
1. **Connection Test** (10%) - Verify proxy server connectivity
2. **Filing Fetch** (30%) - Retrieve latest 13F filing data
3. **Document Parsing** (60%) - Extract holdings information
4. **Data Conversion** (80%) - Convert to trader picks format
5. **Complete** (100%) - Display results and update UI

### Demo Data Fallback
When SEC documents cannot be parsed (common due to varying formats), the system provides Michael Burry's actual Q1 2025 positions:
- **NVIDIA (NVDA)**: $47M in put options (AI bubble bet)
- **Alibaba (BABA)**: $21M in put options (China concerns)
- **JD.com (JD)**: $8M in put options (regulatory headwinds)  
- **Estée Lauder (EL)**: $63M long position (contrarian value play)

## Server Management

### Health Check
Test server connectivity:
```bash
curl http://localhost:3001/health
```
Expected response: `{"status":"ok","service":"SEC EDGAR Proxy"}`

### Server Endpoints
- **Health**: `http://localhost:3001/health`
- **Connection Test**: `http://localhost:3001/api/sec-edgar/test-connection`
- **Latest Filing**: `http://localhost:3001/api/sec-edgar/filing/:cik/latest`
- **Parse Filing**: `http://localhost:3001/api/sec-edgar/filing/:cik/:accessionNumber/parse`

## Troubleshooting

### Common Issues

#### 1. "Server Required" Button
**Problem**: Update button shows "Server Required" instead of "Update Latest Trades"
**Solution**: 
- Check the server status indicator (should be green)
- Click "Start Server" for instructions
- Run `npm run start-proxy` in a terminal
- Wait for the status to update to "Running"

#### 2. Connection Timeout
**Problem**: Server status shows "Cannot connect to proxy server"
**Solution**:
- Ensure proxy server is running on port 3001
- Check for port conflicts
- Restart the proxy server: `npm run start-proxy`

#### 3. CORS Errors
**Problem**: Browser console shows CORS-related errors
**Solution**: 
- The proxy server handles CORS automatically
- Ensure you're accessing the React app via `http://localhost:3000`
- Don't access the proxy server directly from the browser

#### 4. SEC Rate Limiting
**Problem**: 429 errors or slow responses
**Solution**:
- The proxy includes automatic rate limiting (10 req/sec)
- Wait a few minutes between requests
- SEC compliance is built into the system

### Server Logs
Monitor proxy server activity:
```bash
# When running manually
npm run start-proxy

# When running with React
npm run dev-with-proxy
```

Look for these log patterns:
- `[SEC Proxy] Successfully fetched document from: ...` (Success)
- `[SEC Proxy] Could not fetch 13F document, providing mock data` (Fallback)
- `[SEC Proxy] Connection test failed: ...` (Error)

## Development Notes

### Architecture
- **Frontend**: React component with progress tracking
- **Proxy Server**: Express.js with SEC-compliant headers
- **Rate Limiting**: 100ms between requests (SEC requirement)
- **Error Handling**: Graceful fallback to demo data
- **CORS**: Enabled for localhost development

### Configuration
Server configuration in `server/sec-edgar-proxy-server.js`:
```javascript
const SEC_CONFIG = {
  BASE_URL: 'https://data.sec.gov',
  USER_AGENT: 'Trading Helper Bot (contact@tradinghelperbot.com)',
  RATE_LIMIT_DELAY: 100
};
```

### Adding More Traders
To add additional famous traders:
1. Find their CIK number on SEC.gov
2. Add to `SEC_CONFIG` in `SECEdgarService.ts`
3. Update the UI to include the new trader
4. Test with the proxy server

## Security & Compliance

### SEC Requirements
- ✅ Proper User-Agent header identification
- ✅ Rate limiting (max 10 requests per second)
- ✅ No automated bulk downloads
- ✅ Respectful API usage

### Data Privacy
- No personal data stored
- Public SEC filings only
- Demo data clearly labeled
- No user tracking

---

**Need Help?** Check the browser console for detailed error messages or examine the proxy server logs for debugging information. 