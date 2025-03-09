// const TelegramBot = require('node-telegram-bot-api');
// const axios = require('axios');
// const sharp = require('sharp');
// const { MongoClient } = require('mongodb');

// // Environment variables
// const token = process.env.TELEGRAM_TOKEN;
// const mongoUri = process.env.MONGODB_URI;
// const webhookUrl = process.env.WEBHOOK_URL;

// // Database connection
// let dbClient = null;
// async function connectToDatabase() {
//   if (dbClient) return dbClient;
  
//   dbClient = new MongoClient(mongoUri);
//   await dbClient.connect();
  
//   const db = dbClient.db('telegramBot');
//   await db.collection('users').createIndex({ userId: 1 }, { unique: true });
  
//   return dbClient;
// }

// // Initialize bot
// const bot = new TelegramBot(token);

// // Helper functions
// async function handlePhoto(msg) {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
  
//   const client = await connectToDatabase();
//   const db = client.db('telegramBot');
  
//   try {
//     await db.collection('users').updateOne(
//       { userId },
//       { $set: { 
//         lastUsed: new Date(),
//         state: 'waiting_dimensions',
//         fileId: msg.photo[msg.photo.length - 1].file_id
//       }},
//       { upsert: true }
//     );
    
//     await bot.sendMessage(chatId, 'Photo received. Enter width and height (e.g., "800 600"), or type "back" to cancel.');
//   } catch (err) {
//     console.error('DB error:', err);
//     await bot.sendMessage(chatId, 'Error processing request. Please try again later.');
//   }
// }

// async function handleText(msg) {
//   const chatId = msg.chat.id;
//   const userId = msg.from.id;
//   const text = msg.text;
  
//   const client = await connectToDatabase();
//   const db = client.db('telegramBot');
  
//   const user = await db.collection('users').findOne({ userId });
//   if (!user || user.state !== 'waiting_dimensions') return;
  
//   if (text.toLowerCase() === 'back') {
//     await db.collection('users').updateOne(
//       { userId },
//       { $set: { state: null } }
//     );
//     await bot.sendMessage(chatId, 'Operation cancelled. Send a new photo to start over.');
//     return;
//   }
  
//   const dims = text.split(' ');
//   if (dims.length < 2) {
//     await bot.sendMessage(chatId, 'Please provide two numbers separated by a space, e.g., "800 600".');
//     return;
//   }
  
//   const width = parseInt(dims[0], 10);
//   const height = parseInt(dims[1], 10);
//   if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
//     await bot.sendMessage(chatId, 'Invalid dimensions. Enter positive numbers, e.g., "800 600".');
//     return;
//   }
  
//   try {
//     const fileId = user.fileId;
    
//     await db.collection('users').updateOne(
//       { userId },
//       { $set: { state: null } }
//     );
    
//     const file = await bot.getFile(fileId);
//     const fileUrl = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
    
//     const response = await axios({ url: fileUrl, responseType: 'arraybuffer' });
//     const buffer = Buffer.from(response.data, 'binary');
    
//     const resizedBuffer = await sharp(buffer)
//       .resize(width, height)
//       .toBuffer();
    
//     await bot.sendPhoto(chatId, resizedBuffer);
//   } catch (err) {
//     console.error('Processing error:', err);
//     await bot.sendMessage(chatId, 'Error processing image. Try again.');
//   }
// }

// // Main webhook handler
// module.exports = async (req, res) => {
//   try {
//     // Set webhook on first run
//     try {
//       const webhookInfo = await bot.getWebHookInfo();
//       if (webhookInfo.url !== webhookUrl) {
//         await bot.setWebHook(webhookUrl);
//         console.log(`Webhook set to: ${webhookUrl}`);
//       }
//     } catch (error) {
//       console.error('Webhook setup error:', error);
//     }
    
//     if (req.method !== 'POST') {
//       return res.status(200).json({ message: 'Webhook is active' });
//     }
    
//     const update = req.body;
//     const msg = update.message;
    
//     if (!msg) {
//       return res.status(200).send('OK');
//     }
    
//     if (msg.photo && msg.photo.length > 0) {
//       await handlePhoto(msg);
//     } else if (msg.text) {
//       await handleText(msg);
//     }
    
//     return res.status(200).send('OK');
//   } catch (error) {
//     console.error('Webhook error:', error);
//     return res.status(500).send('Error processing webhook');
//   }
// };

// Simple version for testing
module.exports = (req, res) => {
    // Always respond with 200 OK
    console.log('Request received:', req.method, req.url);
    console.log('Request body:', JSON.stringify(req.body));
    
    // Always respond with success
    res.status(200).send('OK');
  };