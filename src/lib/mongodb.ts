import { MongoClient, Db } from 'mongodb';

export function getMongoUri(): string | undefined {
  return (
    process.env.YearBook_MONGODB_URI ||
    process.env.YEARBOOK_MONGODB_URI ||
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.DATABASE_URL
  );
}

export function getDbName(): string {
  return (
    process.env.MONGODB_DB ||
    process.env.YearBook_MONGODB_DB ||
    process.env.YEARBOOK_MONGODB_DB ||
    'yearbook'
  );
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  const uri = getMongoUri();
  const dbName = getDbName();

  if (!uri) {
    throw new Error(
      'Please configure MONGODB_URI or YearBook_MONGODB_URI in your Vercel Environment Variables.'
    );
  }

  let clientPromise: Promise<MongoClient>;

  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production / Vercel Serverless mode
    if (!global._mongoClientPromise) {
      const client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  }

  const activeClient = await clientPromise;
  const db = activeClient.db(dbName);
  return { client: activeClient, db };
}

export default connectToDatabase;
