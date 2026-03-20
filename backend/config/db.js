const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.DATABASE_URL ||
      'mongodb://127.0.0.1:27017/reimbursement_request';

    if (typeof mongoUri !== 'string' || mongoUri.trim().length === 0) {
      throw new Error('MongoDB URI is missing or invalid');
    }

    if (!process.env.MONGO_URI && !process.env.MONGODB_URI && !process.env.DATABASE_URL) {
      console.warn(
        'No Mongo URI env var found (MONGO_URI, MONGODB_URI, DATABASE_URL). Falling back to local MongoDB.'
      );
    }

    const conn = await mongoose.connect(mongoUri.trim());
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
