import { NextResponse, NextRequest } from 'next/server';
import { db } from '@/db/drizzle';
import { settings } from '@/db/schema';
import { sql } from 'drizzle-orm';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rateLimit';
import { getTodayDate } from '@/lib/utils';

// In-memory cache for leaderboard data
interface CachedLeaderboard {
  data: LeaderboardEntry[];
  timestamp: number;
  type: string;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  email: string;
  leetcodeUsername: string;
  gfgUsername?: string;
  todayPoints: number;
  totalScore: number;
  totalProblems: number;
  easy: number;
  medium: number;
  hard: number;
  ranking: number;
  avatar: string;
  country: string;
  streak: number;
  lastSubmission: string | null;
  recentProblems: string[];
  lastUpdated: string | null;
  github: string | null;
  linkedin: string | null;
  rank: number;
  platforms?: {
    leetcode?: {
      easy: number;
      medium: number;
      hard: number;
      total: number;
      todayPoints: number;
    };
    gfg?: {
      easy: number;
      medium: number;
      hard: number;
      total: number;
      todayPoints: number;
    };
  };
}

// Cache duration: 5 minutes (300000 ms)
const CACHE_DURATION_MS = 5 * 60 * 1000;

// Export cache map for manual invalidation
export const leaderboardCache = new Map<string, CachedLeaderboard>();

export async function GET(request: NextRequest) {
  // Apply rate limiting
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
    const platform = searchParams.get('platform') || 'separate'; // Changed default to 'separate'
    const cacheKey = `leaderboard_${type}_${platform}`;

    // Check cache first
    const cached = leaderboardCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
      return new NextResponse(JSON.stringify(cached.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, must-revalidate',
          'X-Cache': 'HIT',
          'X-Cache-Age': Math.floor((now - cached.timestamp) / 1000).toString(),
          ...getRateLimitHeaders(rateLimitResult),
        },
      });
    }

    const today = getTodayDate();
    let leaderboard: LeaderboardEntry[];

    if (platform === 'separate') {
      leaderboard = await getSeparatePlatformLeaderboard(today);
    } else if (platform === 'combined') {
      leaderboard = await getCombinedLeaderboard(today);
    } else {
      leaderboard = await getPlatformSpecificLeaderboard(today, platform);
    }

    // Sort based on type
    if (type === 'daily') {
      leaderboard.sort((a, b) => b.todayPoints - a.todayPoints || b.totalScore - a.totalScore);
    } else {
      leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.todayPoints - a.todayPoints);
    }

    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    // Update cache
    leaderboardCache.set(cacheKey, {
      data: leaderboard,
      timestamp: now,
      type: `${type}_${platform}`,
    });

    // 1. Fetch AI roast for the day
    let dailyRoast = null;
    try {
      const [s] = await db.select({ aiRoast: settings.aiRoast }).from(settings).limit(1);
      if (s?.aiRoast && (s.aiRoast as any).date === today) {
        dailyRoast = s.aiRoast;
      }
    } catch (e) {
      console.error('Failed to fetch daily roast for leaderboard:', e);
    }

    // 2. Fetch recent activities from all users for the last 3 days
    let activities: any[] = [];
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];

      const recentStats = await db.execute(sql`
        SELECT 
          u.name as "userName",
          u.leetcode_username as "leetcodeUsername",
          ds.avatar,
          ds.recent_problems as "recentProblems"
        FROM daily_stats ds
        JOIN users u ON ds.user_id = u.id
        WHERE ds.date >= ${threeDaysAgoStr}
          AND u.role != 'admin'
          AND u.leetcode_username NOT LIKE 'pending_%'
        ORDER BY ds.date DESC
        LIMIT 100
      `);

      // Flatten and de-duplicate activities
      const seenIds = new Set<string>();
      const nowTs = Math.floor(Date.now() / 1000);
      const seventyTwoHoursAgo = nowTs - (3 * 24 * 60 * 60);

      (recentStats.rows as any[]).forEach(row => {
        const problems = Array.isArray(row.recentProblems) ? row.recentProblems : [];
        problems.forEach((p: any) => {
          const problemTs = Number(p.timestamp);
          // Strict 72-hour filter
          if (!seenIds.has(p.id) && problemTs >= seventyTwoHoursAgo) {
            seenIds.add(p.id);
            activities.push({
              ...p,
              userName: row.userName,
              leetcodeUsername: row.leetcodeUsername,
              avatar: row.avatar
            });
          }
        });
      });

      // Sort by timestamp descending
      activities.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      // Limit to 30 for performance
      activities = activities.slice(0, 30);
    } catch (e) {
      console.error('Failed to fetch recent activities:', e);
    }

    return new NextResponse(JSON.stringify({
      entries: leaderboard,
      dailyRoast,
      activities
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, must-revalidate',
        'X-Cache': 'MISS',
        ...getRateLimitHeaders(rateLimitResult),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Leaderboard error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper function to get separate platform leaderboard (shows both platforms separately)
async function getSeparatePlatformLeaderboard(today: string): Promise<LeaderboardEntry[]> {
  // Get all users first
  const usersResult = await db.execute(sql`
    SELECT id, name, email, leetcode_username as "leetcodeUsername", gfg_username as "gfgUsername", github, linkedin
    FROM users
    WHERE role != 'admin' AND leetcode_username NOT LIKE 'pending_%'
  `);

  const leaderboard: LeaderboardEntry[] = [];

  for (const user of usersResult.rows as any[]) {
    // Get latest stats for both platforms
    const statsResult = await db.execute(sql`
      WITH latest_stats AS (
        SELECT DISTINCT ON (platform) 
          platform,
          easy,
          medium,
          hard,
          total,
          ranking,
          avatar,
          country,
          streak,
          last_submission,
          recent_problems,
          date
        FROM daily_stats
        WHERE user_id = ${user.id}
        ORDER BY platform, date DESC
      ),
      today_stats AS (
        SELECT platform, today_points
        FROM daily_stats
        WHERE user_id = ${user.id} AND date = ${today}
      )
      SELECT 
        l.platform,
        COALESCE(l.easy, 0) as easy,
        COALESCE(l.medium, 0) as medium,
        COALESCE(l.hard, 0) as hard,
        COALESCE(l.total, 0) as total,
        COALESCE(l.ranking, 0) as ranking,
        COALESCE(l.avatar, '') as avatar,
        COALESCE(l.country, '') as country,
        COALESCE(l.streak, 0) as streak,
        l.last_submission as "lastSubmission",
        l.recent_problems as "recentProblems",
        l.date as "lastUpdated",
        COALESCE(t.today_points, 0) as "todayPoints"
      FROM latest_stats l
      LEFT JOIN today_stats t ON l.platform = t.platform
    `);

    // Initialize platform data
    const platforms: any = {
      leetcode: {
        easy: 0,
        medium: 0,
        hard: 0,
        total: 0,
        todayPoints: 0,
        ranking: 0,
        avatar: '',
        country: '',
        streak: 0,
        lastSubmission: null,
        recentProblems: [],
        lastUpdated: null,
      },
      gfg: {
        easy: 0,
        medium: 0,
        hard: 0,
        total: 0,
        todayPoints: 0,
        ranking: 0,
        avatar: '',
        country: '',
        streak: 0,
        lastSubmission: null,
        recentProblems: [],
        lastUpdated: null,
      }
    };

    // Populate platform data from stats
    for (const stat of statsResult.rows as any[]) {
      const platform = stat.platform;
      if (platforms[platform]) {
        platforms[platform] = {
          easy: Number(stat.easy) || 0,
          medium: Number(stat.medium) || 0,
          hard: Number(stat.hard) || 0,
          total: Number(stat.total) || 0,
          todayPoints: Number(stat.todayPoints) || 0,
          ranking: Number(stat.ranking) || 0,
          avatar: stat.avatar || '',
          country: stat.country || '',
          streak: Number(stat.streak) || 0,
          lastSubmission: stat.lastSubmission,
          recentProblems: stat.recentProblems || [],
          lastUpdated: stat.lastUpdated,
        };
      }
    }

    // Use LeetCode as primary data for main fields, with fallbacks
    const primaryPlatform = platforms.leetcode.total > 0 ? platforms.leetcode : platforms.gfg;
    const totalScore = (platforms.leetcode.easy * 1 + platforms.leetcode.medium * 3 + platforms.leetcode.hard * 6) +
                      (platforms.gfg.easy * 1 + platforms.gfg.medium * 3 + platforms.gfg.hard * 6);
    const totalTodayPoints = platforms.leetcode.todayPoints + platforms.gfg.todayPoints;

    // Calculate combined streak considering both platforms (day-based, not problem-based)
    let combinedStreak = 0;
    
    // Get all recent problems from both platforms and organize by day
    const allRecentProblems = [
      ...(platforms.leetcode.recentProblems || []).map((p: any) => ({ ...p, platform: 'leetcode' })),
      ...(platforms.gfg.recentProblems || []).map((p: any) => ({ ...p, platform: 'gfg' }))
    ];
    
    if (allRecentProblems.length > 0) {
      // Sort by timestamp descending (most recent first)
      allRecentProblems.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      
      // Group problems by day (UTC date)
      const problemsByDay = new Map<string, any[]>();
      allRecentProblems.forEach(problem => {
        const date = new Date(Number(problem.timestamp) * 1000);
        const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        if (!problemsByDay.has(dayKey)) {
          problemsByDay.set(dayKey, []);
        }
        problemsByDay.get(dayKey)!.push(problem);
      });
      
      // Calculate streak by checking consecutive days with activity
      const today = new Date();
      let currentDate = new Date(today);
      let streakCount = 0;
      
      // Check if there's activity today (include today's points as indicator)
      const hasTodayActivity = platforms.leetcode.todayPoints > 0 || platforms.gfg.todayPoints > 0;
      
      // Start from today and go backwards
      for (let i = 0; i < 30; i++) { // Check last 30 days max
        const dateKey = currentDate.toISOString().split('T')[0];
        const hasActivityThisDay = problemsByDay.has(dateKey) || (i === 0 && hasTodayActivity);
        
        if (hasActivityThisDay) {
          streakCount++;
        } else {
          // Streak broken - no activity on this day
          break;
        }
        
        // Move to previous day
        currentDate.setDate(currentDate.getDate() - 1);
      }
      
      combinedStreak = streakCount;
    } else {
      // No recent problems, check if there's activity today based on today's points
      const hasTodayActivity = platforms.leetcode.todayPoints > 0 || platforms.gfg.todayPoints > 0;
      combinedStreak = hasTodayActivity ? 1 : 0;
    }

    leaderboard.push({
      id: user.id,
      name: user.name,
      email: user.email,
      leetcodeUsername: user.leetcodeUsername,
      gfgUsername: user.gfgUsername,
      todayPoints: totalTodayPoints,
      totalScore: totalScore,
      totalProblems: platforms.leetcode.total + platforms.gfg.total,
      easy: platforms.leetcode.easy + platforms.gfg.easy,
      medium: platforms.leetcode.medium + platforms.gfg.medium,
      hard: platforms.leetcode.hard + platforms.gfg.hard,
      ranking: primaryPlatform.ranking,
      avatar: primaryPlatform.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1a73e8&color=fff&size=128`,
      country: primaryPlatform.country,
      streak: combinedStreak,
      lastSubmission: platforms.leetcode.lastSubmission || platforms.gfg.lastSubmission,
      recentProblems: [...(platforms.leetcode.recentProblems || []), ...(platforms.gfg.recentProblems || [])].slice(0, 15),
      lastUpdated: platforms.leetcode.lastUpdated || platforms.gfg.lastUpdated,
      github: user.github,
      linkedin: user.linkedin,
      rank: 0,
      platforms: {
        leetcode: platforms.leetcode.total > 0 ? platforms.leetcode : undefined,
        gfg: platforms.gfg, // Always show GFG data (will be zeros for users without GFG usernames)
      },
    });
  }

  return leaderboard;
}

// Helper function to get platform-specific leaderboard
async function getPlatformSpecificLeaderboard(today: string, platform: string): Promise<LeaderboardEntry[]> {
  const result = await db.execute(sql`
    WITH latest_stats AS (
      SELECT DISTINCT ON (user_id) 
        user_id,
        date,
        easy,
        medium,
        hard,
        total,
        ranking,
        avatar,
        country,
        streak,
        last_submission,
        recent_problems
      FROM daily_stats
      WHERE platform = ${platform}
      ORDER BY user_id, date DESC
    ),
    today_stats AS (
      SELECT user_id, today_points
      FROM daily_stats
      WHERE date = ${today} AND platform = ${platform}
    )
    SELECT 
      u.id,
      u.name,
      u.email,
      u.leetcode_username as "leetcodeUsername",
      u.gfg_username as "gfgUsername",
      u.github,
      u.linkedin,
      COALESCE(t.today_points, 0) as "todayPoints",
      COALESCE(l.easy, 0) as easy,
      COALESCE(l.medium, 0) as medium,
      COALESCE(l.hard, 0) as hard,
      COALESCE(l.total, 0) as "totalProblems",
      COALESCE(l.ranking, 0) as ranking,
      COALESCE(l.avatar, '') as avatar,
      COALESCE(l.country, '') as country,
      COALESCE(l.streak, 0) as streak,
      l.last_submission as "lastSubmission",
      l.recent_problems as "recentProblems",
      l.date as "lastUpdated"
    FROM users u
    LEFT JOIN latest_stats l ON u.id = l.user_id
    LEFT JOIN today_stats t ON u.id = t.user_id
    WHERE u.role != 'admin' 
      AND u.leetcode_username NOT LIKE 'pending_%'
  `);

  return (result.rows as any[]).map((row) => {
    const easy = Number(row.easy) || 0;
    const medium = Number(row.medium) || 0;
    const hard = Number(row.hard) || 0;
    const totalScore = easy * 1 + medium * 3 + hard * 6;

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      leetcodeUsername: row.leetcodeUsername,
      gfgUsername: row.gfgUsername,
      todayPoints: Number(row.todayPoints) || 0,
      totalScore,
      totalProblems: Number(row.totalProblems) || 0,
      easy,
      medium,
      hard,
      ranking: Number(row.ranking) || 0,
      avatar: row.avatar || '',
      country: row.country || '',
      streak: Number(row.streak) || 0,
      lastSubmission: row.lastSubmission || null,
      recentProblems: row.recentProblems || [],
      lastUpdated: row.lastUpdated || null,
      github: row.github || null,
      linkedin: row.linkedin || null,
      rank: 0,
    };
  });
}

// Helper function to get combined leaderboard from both platforms
async function getCombinedLeaderboard(today: string): Promise<LeaderboardEntry[]> {
  // Get all users first
  const usersResult = await db.execute(sql`
    SELECT id, name, email, leetcode_username as "leetcodeUsername", gfg_username as "gfgUsername", github, linkedin
    FROM users
    WHERE role != 'admin' AND leetcode_username NOT LIKE 'pending_%'
  `);

  const leaderboard: LeaderboardEntry[] = [];

  for (const user of usersResult.rows as any[]) {
    // Get latest stats for both platforms
    const statsResult = await db.execute(sql`
      WITH latest_stats AS (
        SELECT DISTINCT ON (platform) 
          platform,
          easy,
          medium,
          hard,
          total,
          ranking,
          avatar,
          country,
          streak,
          last_submission,
          recent_problems,
          date
        FROM daily_stats
        WHERE user_id = ${user.id}
        ORDER BY platform, date DESC
      ),
      today_stats AS (
        SELECT platform, today_points
        FROM daily_stats
        WHERE user_id = ${user.id} AND date = ${today}
      )
      SELECT 
        l.platform,
        COALESCE(l.easy, 0) as easy,
        COALESCE(l.medium, 0) as medium,
        COALESCE(l.hard, 0) as hard,
        COALESCE(l.total, 0) as total,
        COALESCE(l.ranking, 0) as ranking,
        COALESCE(l.avatar, '') as avatar,
        COALESCE(l.country, '') as country,
        COALESCE(l.streak, 0) as streak,
        l.last_submission as "lastSubmission",
        l.recent_problems as "recentProblems",
        l.date as "lastUpdated",
        COALESCE(t.today_points, 0) as "todayPoints"
      FROM latest_stats l
      LEFT JOIN today_stats t ON l.platform = t.platform
    `);

    // Combine stats from both platforms
    let combinedEasy = 0, combinedMedium = 0, combinedHard = 0, combinedTotal = 0;
    let combinedTodayPoints = 0, bestRanking = 0, combinedStreak = 0;
    let primaryAvatar = '', primaryCountry = '';
    let lastSubmission: string | null = null;
    let recentProblems: any[] = [];
    let lastUpdated: string | null = null;

    const platforms: any = {};

    for (const stat of statsResult.rows as any[]) {
      const platform = stat.platform;
      const easy = Number(stat.easy) || 0;
      const medium = Number(stat.medium) || 0;
      const hard = Number(stat.hard) || 0;
      const total = Number(stat.total) || 0;
      const todayPoints = Number(stat.todayPoints) || 0;

      combinedEasy += easy;
      combinedMedium += medium;
      combinedHard += hard;
      combinedTotal += total;
      combinedTodayPoints += todayPoints;

      // Use LeetCode as primary for avatar and country, fallback to GFG
      if (platform === 'leetcode' || !primaryAvatar) {
        primaryAvatar = stat.avatar || primaryAvatar;
        primaryCountry = stat.country || primaryCountry;
      }

      // Best ranking (lowest number, excluding 0)
      const ranking = Number(stat.ranking) || 0;
      if (ranking > 0 && (bestRanking === 0 || ranking < bestRanking)) {
        bestRanking = ranking;
      }

      // Max streak
      const streak = Number(stat.streak) || 0;
      if (streak > combinedStreak) {
        combinedStreak = streak;
      }

      // Most recent submission
      if (stat.lastSubmission && (!lastSubmission || stat.lastSubmission > lastSubmission)) {
        lastSubmission = stat.lastSubmission;
      }

      // Combine recent problems
      if (stat.recentProblems && Array.isArray(stat.recentProblems)) {
        recentProblems = [...recentProblems, ...stat.recentProblems];
      }

      // Most recent update
      if (stat.lastUpdated && (!lastUpdated || stat.lastUpdated > lastUpdated)) {
        lastUpdated = stat.lastUpdated;
      }

      // Store platform-specific data
      platforms[platform] = {
        easy,
        medium,
        hard,
        total,
        todayPoints,
      };
    }

    // Calculate combined score
    const combinedScore = combinedEasy * 1 + combinedMedium * 3 + combinedHard * 6;

    // Sort recent problems by timestamp and limit
    recentProblems.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
    recentProblems = recentProblems.slice(0, 15);

    leaderboard.push({
      id: user.id,
      name: user.name,
      email: user.email,
      leetcodeUsername: user.leetcodeUsername,
      gfgUsername: user.gfgUsername,
      todayPoints: combinedTodayPoints,
      totalScore: combinedScore,
      totalProblems: combinedTotal,
      easy: combinedEasy,
      medium: combinedMedium,
      hard: combinedHard,
      ranking: bestRanking,
      avatar: primaryAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1a73e8&color=fff&size=128`,
      country: primaryCountry,
      streak: combinedStreak,
      lastSubmission,
      recentProblems,
      lastUpdated,
      github: user.github,
      linkedin: user.linkedin,
      rank: 0,
      platforms,
    });
  }

  return leaderboard;
}
