import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { groups, groupMembers, users, dailyStats } from '@/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { getTodayDate } from '@/lib/utils';

export const GET = requireAuth(async (req: NextRequest, user, context) => {
    try {
        const { code } = (context as { params: Promise<{ code: string }> }).params ?
            await (context as { params: Promise<{ code: string }> }).params :
            { code: '' };

        if (!code) {
            return NextResponse.json({ error: 'Group code is required' }, { status: 400 });
        }

        // Verify group exists
        const [group] = await db.select().from(groups).where(eq(groups.code, code)).limit(1);
        if (!group) {
            return NextResponse.json({ error: 'Group not found' }, { status: 404 });
        }

        // Verify user is a member of THIS group via join table
        const [isMember] = await db.select()
            .from(groupMembers)
            .where(and(
                eq(groupMembers.userId, Number(user.id)),
                eq(groupMembers.groupId, group.id)
            ))
            .limit(1);

        if (!isMember && user.role !== 'admin') {
            return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
        }

        // Fetch all members of this group (basic info only)
        const members = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            leetcodeUsername: users.leetcodeUsername,
            gfgUsername: users.gfgUsername,
            github: users.github,
            linkedin: users.linkedin,
        })
            .from(groupMembers)
            .innerJoin(users, eq(groupMembers.userId, users.id))
            .where(eq(groupMembers.groupId, group.id));

        const today = getTodayDate();
        const memberIds = members.map(m => m.id);

        // Fetch today's stats for all group members
        const allStats = memberIds.length > 0 ? await db.select().from(dailyStats)
            .where(and(
                eq(dailyStats.platform, 'leetcode'),
                inArray(dailyStats.userId, memberIds)
            ))
            .orderBy(desc(dailyStats.date)) : [];

        // Build maps: most recent stats per user
        const statsMap = new Map<number, typeof allStats[number]>();
        for (const stat of allStats) {
            if (memberIds.includes(stat.userId) && !statsMap.has(stat.userId)) {
                statsMap.set(stat.userId, stat);
            }
        }

        // GFG stats disabled — re-enable when GFG integration is fixed
        // const gfgStatsAll = memberIds.length > 0 ? await db.select().from(dailyStats)
        //     .where(and(
        //         eq(dailyStats.date, today), 
        //         eq(dailyStats.platform, 'gfg'),
        //         inArray(dailyStats.userId, memberIds)
        //     )) : [];
        // const gfgMap = new Map<number, typeof gfgStatsAll[number]>();
        // for (const stat of gfgStatsAll) {
        //     if (memberIds.includes(stat.userId)) {
        //         gfgMap.set(stat.userId, stat);
        //     }
        // }

        // Transform and sort
        const leaderboardData = members.map(m => {
            const stat = statsMap.get(m.id);
            // const gfg = gfgMap.get(m.id); // GFG disabled
            const easy = stat?.easy || 0;
            const medium = stat?.medium || 0;
            const hard = stat?.hard || 0;
            const totalScore = easy * 1 + medium * 3 + hard * 6;

            return {
                id: m.id,
                name: m.name,
                email: m.email,
                leetcodeUsername: m.leetcodeUsername,
                gfgUsername: m.gfgUsername,
                github: m.github,
                linkedin: m.linkedin,
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

        const searchParams = new URL(req.url).searchParams;
        const type = searchParams.get('type') || 'daily';

        if (type === 'daily') {
            leaderboardData.sort((a, b) => (b.todayPoints || 0) - (a.todayPoints || 0) || b.totalScore - a.totalScore);
        } else {
            leaderboardData.sort((a, b) => b.totalScore - a.totalScore || (b.todayPoints || 0) - (a.todayPoints || 0));
        }

        leaderboardData.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        // Collect activities from group members
        let activities: any[] = [];
        const seventyTwoHoursAgo = Math.floor(Date.now() / 1000) - (3 * 24 * 60 * 60);

        leaderboardData.forEach(m => {
            const problems = Array.isArray(m.recentProblems) ? m.recentProblems : [];
            problems.forEach((p: any) => {
                if (Number(p.timestamp) >= seventyTwoHoursAgo) {
                    activities.push({
                        ...p,
                        userName: m.name,
                        leetcodeUsername: m.leetcodeUsername,
                        avatar: m.avatar
                    });
                }
            });
        });

        activities.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
        activities = activities.slice(0, 50);

        // Check for recent activity to determine cache duration
        const hasRecentActivity = activities.length > 0 && 
            activities.some(a => (Date.now() / 1000) - Number(a.timestamp) < 300);
        
        const cacheMaxAge = hasRecentActivity ? 30 : 120; // 30s or 2min
        
        return NextResponse.json({
            groupName: group.name,
            groupCode: group.code,
            leaderboard: leaderboardData,
            activities
        }, {
            headers: {
                'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=60`,
                'CDN-Cache-Control': `public, s-maxage=${cacheMaxAge}`,
                'Vercel-CDN-Cache-Control': `public, s-maxage=${cacheMaxAge}`,
                'X-Group-Code': code,
                'X-Recent-Activity': hasRecentActivity.toString()
            }
        });

    } catch (error: any) {
        console.error('Error fetching group leaderboard:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
