import dbConnect from './mongodb';
import { DailyStat } from '@/models/DailyStat';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

async function fetchLeetCodeUser(username: string) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

export async function fetchLeetCodeStats(username: string) {
  try {
    const userStats = await fetchLeetCodeUser(username);

    if (!userStats || !userStats.matchedUser) {
      throw new Error(`User "${username}" not found on LeetCode. Please check the username is correct.`);
    }

    const submitStats = userStats.matchedUser.submitStatsGlobal;
    if (!submitStats || !submitStats.acSubmissionNum || submitStats.acSubmissionNum.length === 0) {
      throw new Error(`Could not fetch submission stats for "${username}". The profile may be private.`);
    }

    const acNum = submitStats.acSubmissionNum;
    const easy = acNum.find((s: any) => s.difficulty === 'Easy')?.count || 0;
    const medium = acNum.find((s: any) => s.difficulty === 'Medium')?.count || 0;
    const hard = acNum.find((s: any) => s.difficulty === 'Hard')?.count || 0;
    const total = acNum.find((s: any) => s.difficulty === 'All')?.count || 0;
    const ranking = userStats.matchedUser.profile?.ranking || 0;

    return {
      easy,
      medium,
      hard,
      total,
      ranking,
    };
  } catch (error) {
    console.error(`Error fetching LeetCode stats for ${username}:`, error);
    throw error;
  }
}

export async function updateDailyStatsForUser(userId: string, leetcodeUsername: string) {
  await dbConnect();
  const stats = await fetchLeetCodeStats(leetcodeUsername);
  const today = new Date().toISOString().split('T')[0];

  // Find today's stat or the most recent one
  let todayStat = await DailyStat.findOne({ userId, date: today });

  // Get yesterday's or most recent stat to calculate points
  const lastStat = await DailyStat.findOne({
    userId,
    date: { $lt: today }
  }).sort({ date: -1 });

  // Calculate today's points
  // Points = new problems solved since last record (1 point per problem, any difficulty)
  let todayPoints = 0;
  let previousTotal = 0;

  if (todayStat) {
    // If we already have a today record, calculate new points since last update
    previousTotal = todayStat.previousTotal;
    todayPoints = stats.total - previousTotal;
  } else if (lastStat) {
    // First entry for today, use yesterday's total as baseline
    previousTotal = lastStat.total;
    todayPoints = stats.total - previousTotal;
  } else {
    // First ever entry for this user, no points yet
    previousTotal = stats.total;
    todayPoints = 0;
  }

  // Ensure points are non-negative
  todayPoints = Math.max(0, todayPoints);

  const update = {
    ...stats,
    previousTotal: todayStat ? previousTotal : stats.total, // Keep original baseline
    todayPoints,
  };

  return await DailyStat.findOneAndUpdate(
    { userId, date: today },
    update,
    { upsert: true, new: true }
  );
}
