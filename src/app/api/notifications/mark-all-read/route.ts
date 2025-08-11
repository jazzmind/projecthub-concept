import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/lib/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await Notification.markAllAsRead({ userId, organizationId });
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
