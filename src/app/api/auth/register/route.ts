import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';
import { fetchLeetCodeStats, updateDailyStatsForUser } from '@/lib/leetcode';

export async function POST(req: Request) {
    try {
        const { name, email, password, leetcodeUsername, phoneNumber, github, linkedin } = await req.json();

        // Validate required fields
        if (!name || !email || !password || !leetcodeUsername || !github) {
            return NextResponse.json(
                { error: 'All fields are required: name, email, password, leetcodeUsername, github' },
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

        // Validate phone number format if provided
        if (phoneNumber && !/^\+?[1-9]\d{1,14}$/.test(phoneNumber.replace(/\s/g, ''))) {
            return NextResponse.json(
                { error: 'Invalid phone number format. Use international format (e.g., +1234567890)' },
                { status: 400 }
            );
        }

        // Check if this is an admin account
        const isAdminAccount = email.toLowerCase().includes('admin') ||
            email.toLowerCase() === 'admin@dsagrinders.com';

        // Verify LeetCode username exists (skip for admin accounts)
        if (!isAdminAccount) {
            try {
                await fetchLeetCodeStats(leetcodeUsername);
            } catch (error: any) {
                return NextResponse.json(
                    { error: `Invalid LeetCode username: ${error.message}` },
                    { status: 400 }
                );
            }
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
        const userData: any = {
            name,
            email: email.toLowerCase(),
            password,
            leetcodeUsername,
            github,
        };

        if (linkedin) {
            userData.linkedin = linkedin;
        }

        if (phoneNumber) {
            userData.phoneNumber = phoneNumber.replace(/\s/g, ''); // Remove spaces
        }

        const user = await User.create(userData);

        // Fetch initial LeetCode stats (skip for admin accounts)
        if (!isAdminAccount) {
            try {
                await updateDailyStatsForUser(user._id, leetcodeUsername);
            } catch (error) {
                console.error('Failed to fetch initial stats:', error);
                // Don't fail registration if stats fetch fails
            }
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
                github: user.github,
                linkedin: user.linkedin,
                phoneNumber: user.phoneNumber,
            },
        });
    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
