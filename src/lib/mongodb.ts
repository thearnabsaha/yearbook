import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'pixelforge';

if (!uri) {
  console.warn('⚠️ MONGODB_URI is not defined in environment variables. Local fallback will be used.');
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (!uri) {
  // Safe mock promise when URI is absent during local development/build
  clientPromise = Promise.reject(new Error('MONGODB_URI not provided'));
} else {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production / Vercel Serverless mode, create a new client promise
    // that is cached per serverless container lifecycle.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (!uri) {
    throw new Error('Please configure MONGODB_URI in your Vercel Environment Variables.');
  }

  const activeClient = await clientPromise;
  const db = activeClient.db(dbName);
  return { client: activeClient, db };
}

export default clientPromise;
