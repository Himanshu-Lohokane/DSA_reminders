import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';
import { fetchLeetCodeStats, updateDailyStatsForUser } from '@/lib/leetcode';

export async function POST(req: Request) {
    try {
        const { name, email, password, leetcodeUsername } = await req.json();

        // Validate required fields
        if (!name || !email || !password || !leetcodeUsername) {
            return NextResponse.json(
                { error: 'All fields are required: name, email, password, leetcodeUsername' },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            );
        }

        // Verify LeetCode username exists first
        try {
            await fetchLeetCodeStats(leetcodeUsername);
        } catch (error: any) {
            return NextResponse.json(
                { error: `Invalid LeetCode username: ${error.message}` },
                { status: 400 }
            );
        }

        await dbConnect();

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email: email.toLowerCase() }, { leetcodeUsername }]
        });

        if (existingUser) {
            const field = existingUser.email === email.toLowerCase() ? 'Email' : 'LeetCode username';
            return NextResponse.json(
                { error: `${field} already registered` },
                { status: 400 }
            );
        }

        // Create user
        const user = await User.create({
            name,
            email: email.toLowerCase(),
            password,
            leetcodeUsername,
        });

        // Fetch initial LeetCode stats
        try {
            await updateDailyStatsForUser(user._id, leetcodeUsername);
        } catch (error) {
            console.error('Failed to fetch initial stats:', error);
            // Don't fail registration if stats fetch fails
        }

        // Generate JWT token
        const token = signToken({ userId: user._id.toString(), email: user.email });

        return NextResponse.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                leetcodeUsername: user.leetcodeUsername,
            },
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
