import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateDailyStatsForUser } from '@/lib/leetcode';

export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Update stats for the current user
        const stat = await updateDailyStatsForUser(user.id, user.leetcodeUsername);

        return NextResponse.json({
            message: 'Stats refreshed',
            todayPoints: stat.todayPoints,
            total: stat.total,
        });
    } catch (error: any) {
        console.error('Refresh error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
