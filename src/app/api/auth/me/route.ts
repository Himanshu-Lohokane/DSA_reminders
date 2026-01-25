import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser(req);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({
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
        console.error('Auth check error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
