import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { signToken } from '@/lib/jwt';

export async function POST(req: Request) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        await dbConnect();

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
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
        console.error('Login error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
