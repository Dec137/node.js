const express = require('express');
const puppeteer = require('puppeteer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint to handle webhook requests
app.post('/webhook', async (req, res) => {
  const { message } = req.body;

  if (!message || !message.text) {
    return res.status(400).json({ status: 'error', message: 'Invalid request' });
  }

  const chatId = message.chat.id;
  const messageText = message.text;

  // Look for a valid URL in the message
  const urlMatch = messageText.match(/(https?:\/\/[^\s]+)/);
  if (!urlMatch) {
    return res.status(400).json({ status: 'error', message: 'Please provide a valid URL.' });
  }

  const url = urlMatch[0];

  try {
    // Scrape the page title using Puppeteer
    const title = await scrapeTitle(url);
    const responseMessage = `Scraped Title from the provided URL:\n${title}`;

    // Send the response back to Telegram
    await sendMessage(chatId, responseMessage);

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Function to scrape the title of a dynamic page
async function scrapeTitle(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'], // Required for Render
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });

  const title = await page.title();
  await browser.close();

  return title;
}

// Function to send a message to Telegram
async function sendMessage(chatId, text) {
  const telegramToken = '7031299961:AAHy0waGghDRRR4ll593q6vRs7PCDchxUdo'; // Replace with your bot token
  const telegramUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

  const payload = {
    chat_id: chatId,
    text: text,
  };

  const response = await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
