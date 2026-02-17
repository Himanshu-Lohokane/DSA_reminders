import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateDailyStatsForUser } from '@/lib/leetcode';
import { updateDailyStatsForUserGFG } from '@/lib/gfg';

export const POST = requireAuth(async (req: NextRequest, user: any) => {
    try {
        const body = await req.json();
        const { leetcodeUsername, phoneNumber, github, linkedin, gfgUsername, roastIntensity, dailyGrindTime, onboardingCompleted } = body;

        console.log('Onboarding data:', { userId: user.id, leetcodeUsername, phoneNumber, github, linkedin, gfgUsername, roastIntensity, dailyGrindTime });

        // Build update object - only include leetcodeUsername if it's different
        const updateData: any = {
            phoneNumber,
            roastIntensity,
            dailyGrindTime,
            onboardingCompleted: onboardingCompleted ?? true
        };

        // Only update leetcodeUsername if it's different from current value
        if (leetcodeUsername && leetcodeUsername !== user.leetcodeUsername) {
            updateData.leetcodeUsername = leetcodeUsername;
        }

        // Update GitHub and LinkedIn if provided (set default if skipped)
        if (github !== undefined && github !== '') {
            updateData.github = github;
        } else if (!user.github || user.github === 'pending') {
            updateData.github = 'not-provided';  // Default for skipped field
        }
        
        if (linkedin !== undefined && linkedin !== '') {
            updateData.linkedin = linkedin;
        } else if (!user.linkedin) {
            updateData.linkedin = null;  // Keep as optional (null allowed)
        }
        if (gfgUsername !== undefined) {
            updateData.gfgUsername = gfgUsername || null;
        }

        // Update user with onboarding data
        const [updatedUser] = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, user.id))
            .returning();

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Trigger immediate LeetCode sync to populate stats
        try {
            await updateDailyStatsForUser(updatedUser.id, updatedUser.leetcodeUsername);
            console.log('LeetCode stats synced after onboarding for user:', updatedUser.id);
        } catch (syncError) {
            console.error('Failed to sync LeetCode stats after onboarding:', syncError);
            // Don't fail onboarding if sync fails - stats will be updated by cron
        }

        // Trigger GFG sync if username provided
        if (updatedUser.gfgUsername) {
            try {
                await updateDailyStatsForUserGFG(updatedUser.id, updatedUser.gfgUsername);
                console.log('GFG stats synced after onboarding for user:', updatedUser.id);
            } catch (syncError) {
                console.error('Failed to sync GFG stats after onboarding:', syncError);
            }
        }

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error: any) {
        console.error('Onboarding error:', error);

        // Handle duplicate username error
        if (error?.code === '23505' && error?.constraint === 'users_leetcode_username_unique') {
            return NextResponse.json({ error: 'This LeetCode username is already taken by another user' }, { status: 409 });
        }

        return NextResponse.json({ error: 'Failed to complete onboarding' }, { status: 500 });
    }
});
