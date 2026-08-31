import { NextResponse, NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function GET() {
  try {
    const { db } = await connectToDatabase();
    const photos = await db
      .collection('photos')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, photos });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data.id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const now = Date.now();

    await db.collection('photos').updateOne(
      { id: data.id },
      {
        $set: {
          title: data.title || 'Untitled',
          caption: data.caption || '',
          tags: data.tags || [],
          originalBase64: data.originalBase64,
          editedBase64: data.editedBase64,
          thumbnailBase64: data.thumbnailBase64,
          width: data.width,
          height: data.height,
          fileSize: data.fileSize,
          mimeType: data.mimeType || 'image/webp',
          isFavorite: Boolean(data.isFavorite),
          albumId: data.albumId,
          editState: data.editState,
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
    await db.collection('photos').deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
