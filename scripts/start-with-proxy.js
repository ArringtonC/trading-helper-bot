#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Trading Helper Bot with SEC EDGAR Proxy...\n');

// Start proxy server
console.log('📡 Starting SEC EDGAR Proxy Server on port 3001...');
const proxyServer = spawn('node', ['server/sec-edgar-proxy-server.js'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

// Wait a moment for proxy to start
setTimeout(() => {
  console.log('⚛️  Starting React Development Server on port 3000...');
  
  // Start React development server
  const reactServer = spawn('npm', ['start'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    proxyServer.kill();
    reactServer.kill();
    process.exit(0);
  });

  proxyServer.on('exit', (code) => {
    if (code !== 0) {
      console.log(`❌ Proxy server exited with code ${code}`);
    }
    reactServer.kill();
    process.exit(code);
  });

  reactServer.on('exit', (code) => {
    if (code !== 0) {
      console.log(`❌ React server exited with code ${code}`);
    }
    proxyServer.kill();
    process.exit(code);
  });

}, 2000);

console.log('\n📋 Instructions:');
console.log('• SEC EDGAR Proxy: http://localhost:3001/health');
console.log('• React App: http://localhost:3000');
console.log('• Press Ctrl+C to stop both servers');
console.log('\n✨ Both servers will start automatically...\n'); 