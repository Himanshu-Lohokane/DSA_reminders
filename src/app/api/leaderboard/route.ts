import { NextResponse, NextRequest } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { DailyStat } from '@/models/DailyStat';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Exclude admin accounts from leaderboard
    const adminEmails = ['admin@dsagrinders.com'];
    const users = await User.find({
      email: {
        $nin: adminEmails,
        $not: /admin/i // Exclude any email containing 'admin'
      }
    }).select('-password');

    const today = new Date().toISOString().split('T')[0];

    const leaderboard = [];
    for (const user of users) {
      // Get today's stat specifically
      const todayStat = await DailyStat.findOne({ userId: user._id, date: today });
      // Get latest stat for total problems
      const latestStat = await DailyStat.findOne({ userId: user._id }).sort({ date: -1 });

      // Calculate total score: easy=1, medium=3, hard=6
      const totalScore = (latestStat?.easy || 0) * 1 + (latestStat?.medium || 0) * 3 + (latestStat?.hard || 0) * 6;

      leaderboard.push({
        id: user._id,
        name: user.name,
        email: user.email,
        leetcodeUsername: user.leetcodeUsername,
        todayPoints: todayStat?.todayPoints || 0,
        totalScore: totalScore,
        totalProblems: latestStat?.total || 0,
        easy: latestStat?.easy || 0,
        medium: latestStat?.medium || 0,
        hard: latestStat?.hard || 0,
        ranking: latestStat?.ranking || 0,
        avatar: latestStat?.avatar || '',
        country: latestStat?.country || '',
        streak: latestStat?.streak || 0,
        lastSubmission: latestStat?.lastSubmission || null,
        recentProblems: latestStat?.recentProblems || [],
        lastUpdated: latestStat?.date || null,
        github: user.github || null,
        linkedin: user.linkedin || null,
        rank: 0,
      });
    }

    // Sort based on type
    const searchParams = new URL(request.url).searchParams;
    const type = searchParams.get('type') || 'daily'; // Default to daily

    if (type === 'daily') {
      // Sort by today's points (descending), then total score
      leaderboard.sort((a, b) => b.todayPoints - a.todayPoints || b.totalScore - a.totalScore);
    } else {
      // Sort by total score (descending), then today's points
      leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.todayPoints - a.todayPoints);
    }

    // Add rank
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json(leaderboard);
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
