import { NextRequest, NextResponse } from 'next/server';

const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'BcndjbeihGgdw9hed';

/**
 * Proxy for /api/cron/test-time-slot-sender on the main app (TEST ONLY)
 * Passes through the timeSlot query parameter for testing specific slots
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeSlot = searchParams.get('timeSlot') || '';

    const url = `${MAIN_APP_URL}/api/cron/test-time-slot-sender?timeSlot=${encodeURIComponent(timeSlot)}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: `Failed to reach main app at ${MAIN_APP_URL}: ${error instanceof Error ? error.message : 'Network error'}`
      },
      { status: 502 }
    );
  }
}