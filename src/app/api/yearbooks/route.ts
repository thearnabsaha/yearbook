import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const projects = await db
      .collection('yearbook_projects')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, projects });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data.id || !data.title) {
      return NextResponse.json({ success: false, error: 'Missing id or title' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const now = Date.now();

    await db.collection('yearbook_projects').updateOne(
      { id: data.id },
      {
        $set: {
          title: data.title,
          description: data.description || '',
          aspectRatio: data.aspectRatio || '9:16',
          startDate: data.startDate,
          updatedAt: data.updatedAt || now,
        },
        $setOnInsert: {
          createdAt: data.createdAt || now,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    await Promise.all([
      db.collection('yearbook_projects').deleteOne({ id }),
      db.collection('yearbook_entries').deleteMany({ yearbookId: id }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
