import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { dailyStats, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { generatePersonalizedRecommendations } from '@/lib/ai-recommendations';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's recent stats and patterns
        const [latestStats] = await db.select()
            .from(dailyStats)
            .where(eq(dailyStats.userId, user.id))
            .orderBy(desc(dailyStats.date))
            .limit(1);

        if (!latestStats) {
            return NextResponse.json({
                recommendations: [],
                message: "Complete a few problems first to get personalized recommendations!"
            });
        }

        // Generate AI-powered recommendations
        const recommendations = await generatePersonalizedRecommendations({
            userId: user.id,
            userStats: latestStats,
            recentProblems: (latestStats.recentProblems as any[]) || [],
            currentLevel: calculateUserLevel(latestStats)
        });

        return NextResponse.json({
            recommendations,
            message: `Here are ${recommendations.length} problems picked just for you!`
        });

    } catch (error: any) {
        console.error('AI Recommendations error:', error);
        return NextResponse.json({ 
            error: 'Failed to generate recommendations',
            recommendations: []
        }, { status: 500 });
    }
}

function calculateUserLevel(stats: any): 'beginner' | 'intermediate' | 'advanced' {
    const total = stats.total || 0;
    const ratio = (stats.medium + stats.hard * 2) / Math.max(total, 1);
    
    if (total < 20) return 'beginner';
    if (total < 100 || ratio < 0.3) return 'intermediate';
    return 'advanced';
}