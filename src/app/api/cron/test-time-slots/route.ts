import { NextResponse } from 'next/server';
import { getCurrentTimeSlot, isInCurrentTimeSlot, getTimeSlotDebugInfo } from '@/lib/timeSlots';

/**
 * Test endpoint to verify time slot functionality
 * GET /api/cron/test-time-slots
 */
export async function GET() {
    try {
        const debugInfo = getTimeSlotDebugInfo();
        const currentSlot = getCurrentTimeSlot();
        
        // Test times
        const testTimes = [
            '09:15', // Should match if current time is in 09:00-09:30
            '09:45', // Should match if current time is in 09:30-10:00
            '14:00', // Test afternoon slot
            '23:59', // Test late night
        ];
        
        const testResults = testTimes.map(time => ({
            time,
            isInCurrentSlot: isInCurrentTimeSlot(time),
            slot: currentSlot.label
        }));
        
        return NextResponse.json({
            success: true,
            debugInfo,
            currentSlot,
            testResults,
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