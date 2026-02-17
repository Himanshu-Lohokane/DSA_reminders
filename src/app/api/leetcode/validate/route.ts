import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // Validate LeetCode username format
        const isValidFormat = /^[a-zA-Z0-9_-]+$/.test(username);
        if (!isValidFormat) {
            return NextResponse.json({ 
                exists: false, 
                error: 'Invalid username format' 
            }, { status: 400 });
        }

        // Use LeetCode GraphQL API to validate username
        const query = `
            query getUserProfile($username: String!) {
                matchedUser(username: $username) {
                    username
                    profile {
                        ranking
                    }
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                    userCalendar {
                        streak
                    }
                }
            }
        `;

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com'
            },
            body: JSON.stringify({
                query,
                variables: { username }
            })
        });

        const data = await response.json();

        if (data.errors || !data.data?.matchedUser) {
            return NextResponse.json({ 
                exists: false,
                error: 'User not found'
            }, { status: 404 });
        }

        const user = data.data.matchedUser;
        const acSubmissions = user.submitStats?.acSubmissionNum || [];
        
        // Parse submission counts by difficulty
        const easy = acSubmissions.find((s: any) => s.difficulty === 'Easy')?.count || 0;
        const medium = acSubmissions.find((s: any) => s.difficulty === 'Medium')?.count || 0;
        const hard = acSubmissions.find((s: any) => s.difficulty === 'Hard')?.count || 0;
        const totalSolved = easy + medium + hard;

        return NextResponse.json({
            exists: true,
            stats: {
                username: user.username,
                totalSolved,
                easy,
                medium,
                hard,
                ranking: user.profile?.ranking || null,
                streak: user.userCalendar?.streak || 0
            }
        });

    } catch (error: any) {
        console.error('LeetCode validation error:', error);
        return NextResponse.json({ 
            exists: false,
            error: 'Failed to validate username. Please try again.' 
        }, { status: 500 });
    }
}
