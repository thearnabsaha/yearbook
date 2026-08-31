import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        connected: false,
        message: 'MONGODB_URI is not configured in Vercel Environment Variables.',
      });
    }

    const { db } = await connectToDatabase();
    const [projectCount, entryCount, photoCount] = await Promise.all([
      db.collection('yearbook_projects').countDocuments(),
      db.collection('yearbook_entries').countDocuments(),
      db.collection('photos').countDocuments(),
    ]);

    return NextResponse.json({
      connected: true,
      database: db.databaseName,
      stats: {
        projects: projectCount,
        yearbookEntries: entryCount,
        photos: photoCount,
      },
    });
  } catch (err: any) {
    console.error('Vercel Function: MongoDB sync status error:', err);
    return NextResponse.json(
      {
        connected: false,
        error: err.message || 'Failed to connect to MongoDB',
      },
      { status: 500 }
    );
  }
}
