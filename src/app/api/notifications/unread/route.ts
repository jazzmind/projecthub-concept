import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/lib/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get unread notifications
    const notifications = await Notification._getUnreadByUser({ userId, organizationId });
    
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
