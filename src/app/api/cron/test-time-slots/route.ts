import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { settings } from '@/db/schema';
import { getCurrentTimeSlot, isInCurrentTimeSlot, getTimeSlotDebugInfo } from '@/lib/timeSlots';

/**
 * Test endpoint to verify time slot functionality
 * GET /api/cron/test-time-slots
 */
export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const [s] = await db.select().from(settings).limit(1);
        const timeZone = s?.timezone ?? 'Asia/Kolkata';

        const debugInfo = getTimeSlotDebugInfo(timeZone);
        const currentSlot = getCurrentTimeSlot(timeZone);
        
        // Test times
        const testTimes = [
            '09:15', // Should match if current time is in 09:00-09:30
            '09:45', // Should match if current time is in 09:30-10:00
            '14:00', // Test afternoon slot
            '23:59', // Test late night
        ];
        
        const testResults = testTimes.map(time => ({
            time,
            isInCurrentSlot: isInCurrentTimeSlot(time, timeZone),
            slot: currentSlot.label
        }));
        
        return NextResponse.json({
            success: true,
            debugInfo,
            currentSlot,
            testResults,
            timeZone,
            instructions: [
                'This endpoint shows the current 30-minute time slot',
                'Test times show which ones would match the current slot',
                'Use this to verify time slot detection is working correctly'
            ]
        });
        
    } catch (error) {
        console.error('Time slot test error:', error);
        return NextResponse.json(
            { error: 'Failed to test time slots' },
            { status: 500 }
        );
    }
}