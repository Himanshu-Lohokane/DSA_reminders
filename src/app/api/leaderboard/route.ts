import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db/drizzle';
import { users, dailyStats } from '@/db/schema';
import { ne, notLike, eq, and, desc } from 'drizzle-orm';
import { getRateLimitHeaders, checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rateLimit';
import { updateDailyStatsForUser } from '@/lib/leetcode';
import { getTodayDate } from '@/lib/utils';

// Vercel-optimized caching for serverless
interface CacheEntry {
  data: any;
  timestamp: number;
}

// For serverless: Return cache headers instead of in-memory caching
function getCacheHeaders(maxAge: number = 120) {
  return {
    'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=60`,
    'CDN-Cache-Control': `public, s-maxage=${maxAge}`,
    'Vercel-CDN-Cache-Control': `public, s-maxage=${maxAge}`,
  };
}

export async function GET(request: NextRequest) {
  const clientId = getClientIdentifier(request);
  const rateLimitResult = checkRateLimit(clientId, RATE_LIMITS.LEADERBOARD);

  if (!rateLimitResult.allowed) {
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(rateLimitResult),
        },
      }
    );
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get('type') || 'daily';

    // Fetch all non-admin users
    const allUsers = await db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      leetcodeUsername: users.leetcodeUsername,
      gfgUsername: users.gfgUsername,
      github: users.github,
      linkedin: users.linkedin,
    })
      .from(users)
      .where(ne(users.role, 'admin'));

    const today = getTodayDate();

    // Fetch today's daily stats for all users (leetcode)
    const todayStats = await db.select().from(dailyStats)
      .where(and(
        eq(dailyStats.date, today),
        eq(dailyStats.platform, 'leetcode')
      ));

    // If no stats for today, fetch the most recent stats per user
    const latestStats = todayStats.length > 0 ? todayStats :
      await db.select().from(dailyStats)
        .where(eq(dailyStats.platform, 'leetcode'))
        .orderBy(desc(dailyStats.date));

    // Create a map of userId -> stats (most recent per user)
    const statsMap = new Map<number, typeof latestStats[number]>();
    for (const stat of latestStats) {
      if (!statsMap.has(stat.userId)) {
        statsMap.set(stat.userId, stat);
      }
    }

    // GFG stats query disabled — re-enable when GFG integration is fixed
    // const gfgStats = await db.select().from(dailyStats)
    //   .where(and(
    //     eq(dailyStats.date, today),
    //     eq(dailyStats.platform, 'gfg')
    //   ));
    // const gfgMap = new Map<number, typeof gfgStats[number]>();
    // for (const stat of gfgStats) {
    //   gfgMap.set(stat.userId, stat);
    // }

    // SWR Pattern: Identify stale users to refresh in background
    const staleUsers = allUsers
      .filter(u => !u.leetcodeUsername.startsWith('pending_'))
      .filter(u => !statsMap.has(u.id))
      .slice(0, 3);

    staleUsers.forEach(u =>
      updateDailyStatsForUser(u.id, u.leetcodeUsername).catch(err =>
        console.error(`SWR Background Refresh failed for ${u.leetcodeUsername}:`, err)
      )
    );

    // Filter out pending users and transform
    const leaderboardData = allUsers
      .filter(u => !u.leetcodeUsername.startsWith('pending_'))
      .map(u => {
        const stat = statsMap.get(u.id);
        // const gfg = gfgMap.get(u.id); // GFG disabled
        const easy = stat?.easy || 0;
        const medium = stat?.medium || 0;
        const hard = stat?.hard || 0;
        const totalScore = easy * 1 + medium * 3 + hard * 6;

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          leetcodeUsername: u.leetcodeUsername,
          gfgUsername: u.gfgUsername,
          github: u.github,
          linkedin: u.linkedin,
          todayPoints: stat?.todayPoints || 0,
          easy,
          medium,
          hard,
          totalProblems: stat?.total || 0,
          gfgSolved: 0, // GFG disabled
          gfgScore: 0, // GFG disabled
          ranking: stat?.ranking || 0,
          avatar: stat?.avatar || '',
          country: stat?.country || '',
          streak: stat?.streak || 0,
          lastSubmission: stat?.lastSubmission || null,
          recentProblems: stat?.recentProblems || [],
          lastUpdated: stat?.date || null,
          totalScore,
          rank: 0,
        };
      });

    // Sort based on type
    if (type === 'daily') {
      leaderboardData.sort((a, b) => (b.todayPoints || 0) - (a.todayPoints || 0) || b.totalScore - a.totalScore);
    } else {
      leaderboardData.sort((a, b) => b.totalScore - a.totalScore || (b.todayPoints || 0) - (a.todayPoints || 0));
    }

    // Add rank
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Collect recent activities from all users' recentProblems JSON
    let activities: any[] = [];
    const seventyTwoHoursAgo = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60);

    leaderboardData.forEach(user => {
      const problems = Array.isArray(user.recentProblems) ? user.recentProblems : [];
      problems.forEach((p: any) => {
        const problemTs = Number(p.timestamp);
        if (problemTs >= seventyTwoHoursAgo) {
          activities.push({
            ...p,
            userName: user.name,
            leetcodeUsername: user.leetcodeUsername,
            avatar: user.avatar
          });
        }
      });
    });

    // Sort activities by timestamp descending
    activities.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    activities = activities.slice(0, 50);

    const responseData = {
      entries: leaderboardData,
      activities
    };

    // For Vercel: Use CDN-level caching with proper headers
    const isRecentActivity = activities.length > 0 && 
      activities.some(a => (Date.now() / 1000) - Number(a.timestamp) < 300); // 5 min
    
    const cacheHeaders = isRecentActivity 
      ? getCacheHeaders(30) // Short cache if recent activity
      : getCacheHeaders(120); // Longer cache if no recent updates

    return new NextResponse(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache-Status': 'FRESH',
        'X-Recent-Activity': isRecentActivity.toString(),
        ...cacheHeaders,
        ...getRateLimitHeaders(rateLimitResult),
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Leaderboard error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
