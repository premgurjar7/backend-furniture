// ./config/database.js
const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://localhost:27017/furniture_shop';
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_URI;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ MongoDB Connected:', conn.connection.host + ':' + conn.connection.port);
    console.log('🔎 Connected DB Name:', conn.connection.name);
    console.log('🔎 MONGO_URI used:', MONGO_URI);

    // optional helpful listeners
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected');
    });
    mongoose.connection.on('reconnected', () => {
      console.log('🔁 Mongoose reconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // exit if DB is required for app
    process.exit(1);
  }
};

module.exports = connectDB;
