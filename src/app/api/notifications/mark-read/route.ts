import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/lib/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userId } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: 'Notification ID and User ID are required' }, { status: 400 });
    }

    const result = await Notification.markAsRead({ id, userId });
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
