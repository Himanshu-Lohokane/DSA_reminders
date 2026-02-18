import { NextRequest, NextResponse } from 'next/server';

const MAIN_APP_URL = process.env.MAIN_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET || 'BcndjbeihGgdw9hed';

/**
 * Proxy for /api/cron/time-slot-sender on the main app (REAL SENDER)
 * This will actually send messages to users in the current time slot
 */
export async function GET(request: NextRequest) {
  try {
    const url = `${MAIN_APP_URL}/api/cron/time-slot-sender`;

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
