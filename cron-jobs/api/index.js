const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();

// URLs for the services
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL;
const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cron job server is running' });
});

async function pingService(url, name) {
  try {
    const response = await axios.get(url);
    console.log(`[${new Date().toISOString()}] ${name} responded:`, response.data);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error pinging ${name}:`, error.message);
  }
}

setInterval(() => {
  pingService(AUTH_SERVICE_URL, 'Auth Service');
  pingService(CHAT_SERVICE_URL, 'Chat Service');
}, 3 * 60 * 1000); // 3 minutes

// Initial ping on startup
pingService(AUTH_SERVICE_URL, 'Auth Service');
pingService(CHAT_SERVICE_URL, 'Chat Service');

app.listen(3000, () => {
  console.log(`Cron job server running on port 3000`);
}); 