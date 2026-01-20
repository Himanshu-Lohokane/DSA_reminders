import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import { User } from '@/models/User';
import { sendDSAReminder } from '@/lib/email';

export async function GET(req: Request) {
    // Auth check for cron
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new Response('Unauthorized', { status: 401 });
    }

    try {
        await dbConnect();
        const users = await User.find({}).select('name email');

        const results = [];
        for (const user of users) {
            const result = await sendDSAReminder(user.email, user.name);
            results.push({
                email: user.email,
                success: result.success,
                error: result.error
            });
        }

        return NextResponse.json({
            message: 'Email reminders sent',
            total: users.length,
            results
        });
    } catch (error: any) {
        console.error('Email send error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
