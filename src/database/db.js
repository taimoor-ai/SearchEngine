import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 20,      // Maximum connections
      minPoolSize: 5,       // Minimum maintained connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,            // Use IPv4
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ MongoDB Connected");
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`🗄️ Database: ${conn.connection.name}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━");

    mongoose.connection.on("connected", () => {
      console.log("🟢 MongoDB connection established");
    });

    mongoose.connection.on("error", (err) => {
      console.error("🔴 MongoDB Error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("🟡 MongoDB disconnected");
    });

    process.on("SIGINT", async () => {
      await mongoose.connection.close();

      console.log(
        "🛑 MongoDB connection closed due to application termination"
      );

      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);

    process.exit(1);
  }
};

export default connectDB;