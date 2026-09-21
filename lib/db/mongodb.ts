import mongoose from "mongoose";

// Ensure all models are registered for Mongoose populate() across Next.js routes
import "@/models/User";
import "@/models/Category";
import "@/models/Post";
import "@/models/Comment";
import "@/models/Newsletter";

// TEMPORARY DEBUG - remove after testing
console.log("=== ENV DEBUG ===");
console.log("TEST_VAR:", process.env.TEST_VAR);
console.log("MONGODB_URI exists:", !!process.env.MONGODB_URI);
console.log("MONGODB_URI value:", process.env.MONGODB_URI);
console.log("All env keys with MONGO:", Object.keys(process.env).filter(k => k.includes("MONGO")));
console.log("=================");

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not defined");
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;

    console.log("MongoDB connected successfully");

    return cached.conn;
  } catch (error) {
    cached.promise = null;

    console.error("Mongoose connection error:", error);

    throw error;
  }
}

export async function isDatabaseConnected(): Promise<boolean> {
  try {
    const conn = await connectToDatabase();

    return conn.connection.readyState === 1;
  } catch {
    return false;
  }
}