const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const sharp = require('sharp');
const { MongoClient } = require('mongodb');

// Load environment variables from Railway
const token = process.env.TELEGRAM_TOKEN;
const mongoUri = process.env.MONGODB_URI;

const bot = new TelegramBot(token, { polling: true });

const client = new MongoClient(mongoUri);
let db;
client.connect()
  .then(() => {
    db = client.db('telegramBot');
    db.collection('users').createIndex({ userId: 1 }, { unique: true });
  })
  .catch(console.error);

// In-memory session storage: { userId: { fileId, chatId } }
const sessions = {};

// When a photo is received
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  try {
    await db.collection('users').updateOne(
      { userId },
      { $set: { lastUsed: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('DB error:', err);
  }

  // Get highest resolution photo
  const photoArray = msg.photo;
  const fileId = photoArray[photoArray.length - 1].file_id;
  sessions[userId] = { fileId, chatId };

  bot.sendMessage(chatId, 'Photo received. Enter width and height (e.g., "800 600"), or type "back" to cancel.');
});

// When a text message is received
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (!sessions[userId]) return; // No active session

  if (text.toLowerCase() === 'back') {
    delete sessions[userId];
    bot.sendMessage(chatId, 'Operation cancelled. Send a new photo to start over.');
    return;
  }

  const dims = text.split(' ');
  if (dims.length < 2) {
    bot.sendMessage(chatId, 'Please provide two numbers separated by a space, e.g., "800 600".');
    return;
  }

  const width = parseInt(dims[0], 10);
  const height = parseInt(dims[1], 10);
  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    bot.sendMessage(chatId, 'Invalid dimensions. Enter positive numbers, e.g., "800 600".');
    return;
  }

  try {
    const { fileId } = sessions[userId];
    delete sessions[userId]; // Clear session once processing starts

    // Retrieve file URL
    const file = await bot.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

    // Download the image
    const response = await axios({ url: fileUrl, responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Resize image with specified dimensions
    const resizedBuffer = await sharp(buffer)
      .resize(width, height)
      .toBuffer();

    await bot.sendPhoto(chatId, resizedBuffer);
  } catch (err) {
    console.error('Processing error:', err);
    bot.sendMessage(chatId, 'Error processing image. Try again.');
  }
});

