const mongoose = require("mongoose");

let connectionPromise;

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (!connectionPromise) {
      connectionPromise = mongoose.connect(process.env.MONGODB_URI);
    }

    await connectionPromise;
    console.log(`MongoDB connected`);
  } catch (error) {
    connectionPromise = null;
    console.error("MongoDB connection error:", error.message);
    if (process.env.VERCEL === "1") {
      throw error;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
