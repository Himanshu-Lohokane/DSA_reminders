import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, settings } from '@/db/schema';
import { eq, ne, notLike, and } from 'drizzle-orm';

/**
 * TEST ENDPOINT for manual time slot testing
 * Requires CRON_SECRET auth header
 */

// Helper function to check if a user's dailyGrindTime falls in specified time slot
function isInSpecificTimeSlot(userTime: string | null, targetSlot: { hour: number, slotStart: number, slotEnd: number }): boolean {
  if (!userTime || !userTime.match(/^\d{2}:\d{2}$/)) return false;
  
  const [userHour, userMin] = userTime.split(':').map(Number);
  
  // Check if user's time falls in target slot
  return userHour === targetSlot.hour && userMin >= targetSlot.slotStart && userMin < targetSlot.slotEnd;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const testTimeSlot = searchParams.get('timeSlot');
    
    if (!testTimeSlot) {
      return NextResponse.json({ 
        error: 'timeSlot parameter required (e.g., ?timeSlot=09:00-09:30)' 
      }, { status: 400 });
    }

    // Parse test time slot (e.g., "09:00-09:30")
    const [startTime, endTime] = testTimeSlot.split('-');
    if (!startTime || !endTime) {
      return NextResponse.json({ 
        error: 'Invalid timeSlot format. Use format like 09:00-09:30' 
      }, { status: 400 });
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const targetSlot = { 
      hour: startHour, 
      slotStart: startMin, 
      slotEnd: startMin + 30,
      label: testTimeSlot
    };

    console.log(`🧪 Testing time slot: ${testTimeSlot}`);

    // Get all users who could receive messages
    const allUsers = await db.select().from(users)
      .where(
        and(
          ne(users.role, 'admin'),
          notLike(users.leetcodeUsername, 'pending_%'),
          eq(users.onboardingCompleted, true)
        )
      );

    // Filter users whose dailyGrindTime falls in target time slot
    const usersInTimeSlot = allUsers.filter(user => 
      user.dailyGrindTime && isInSpecificTimeSlot(user.dailyGrindTime, targetSlot)
    );

    // Group users by roast intensity
    const usersByIntensity: {[key: string]: any[]} = {
      mild: [],
      medium: [],
      savage: []
    };

    usersInTimeSlot.forEach(user => {
      const intensity = user.roastIntensity || 'medium';
      if (usersByIntensity[intensity]) {
        usersByIntensity[intensity].push(user);
      } else {
        usersByIntensity.medium.push(user);
      }
    });

    // Get settings to check for pre-generated messages
    let [settings_data] = await db.select().from(settings).limit(1);
    const hasPreGenerated = settings_data?.aiRoast && (settings_data.aiRoast as any).mild;

    const summary = {
      testMode: true,
      timeSlot: testTimeSlot,
      totalUsers: allUsers.length,
      usersInSlot: usersInTimeSlot.length,
      usersByIntensity: {
        mild: usersByIntensity.mild.length,
        medium: usersByIntensity.medium.length,
        savage: usersByIntensity.savage.length,
      },
      hasPreGeneratedMessages: !!hasPreGenerated,
      usersWithDetails: usersInTimeSlot.map(user => ({
        name: user.name,
        email: user.email,
        dailyGrindTime: user.dailyGrindTime,
        roastIntensity: user.roastIntensity || 'medium',
        phoneNumber: user.phoneNumber ? '***masked***' : null
      }))
    };

    console.log(`🎯 Test results for ${testTimeSlot}:`, summary);

    return NextResponse.json({
      message: `Test completed for time slot ${testTimeSlot}`,
      summary,
      note: 'This is a TEST endpoint - no messages were actually sent'
    });

  } catch (error) {
    console.error('Time-slot test error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Time-slot test failed' 
    }, { status: 500 });
  }
}