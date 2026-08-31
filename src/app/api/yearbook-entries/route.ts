import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const yearbookId = searchParams.get('yearbookId');

    const { db } = await connectToDatabase();
    const query = yearbookId ? { yearbookId } : {};

    const entries = await db
      .collection('yearbook_entries')
      .find(query)
      .sort({ date: 1 })
      .toArray();

    return NextResponse.json({ success: true, entries });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data.id || !data.yearbookId || !data.date) {
      return NextResponse.json(
        { success: false, error: 'Missing id, yearbookId, or date' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const now = Date.now();

    await db.collection('yearbook_entries').updateOne(
      { id: data.id },
      {
        $set: {
          yearbookId: data.yearbookId,
          date: data.date,
          photoBase64: data.photoBase64,
          thumbnailBase64: data.thumbnailBase64,
          caption: data.caption || '',
          captionY: data.captionY ?? 75,
          captionStyle: data.captionStyle || 'snapchat',
          aspectRatio: data.aspectRatio || '9:16',
          showDateStamp: data.showDateStamp ?? true,
          showDayCount: data.showDayCount ?? true,
          alignment: data.alignment,
          crop: data.crop,
          filters: data.filters,
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
    await db.collection('yearbook_entries').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
