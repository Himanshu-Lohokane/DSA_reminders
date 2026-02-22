import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateDailyStatsForUser, LeetCodeError } from '@/lib/leetcode';
import { profileUpdateSchema, validateRequest, createErrorResponse } from '@/lib/validation';

interface UserUpdatePayload {
  name?: string;
  github?: string;
  linkedin?: string | null;
  leetcodeUsername?: string;
  phoneNumber?: string | null;
  gfgUsername?: string | null;
  onboardingCompleted?: boolean;
  dailyGrindTime?: string | null;
}

export const PUT = requireAuth(async (req: NextRequest, user) => {
  try {
    const body = await req.json();

    const validation = validateRequest(profileUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(validation.error, 'VALIDATION_ERROR', validation.details),
        { status: 400 }
      );
    }

    const { name, phoneNumber, github, linkedin, leetcodeUsername, gfgUsername, dailyGrindTime } = validation.data;

    const updateData: UserUpdatePayload = {};
    if (name) updateData.name = name;

    if (github) {
      updateData.github = github.startsWith('http') ? github : `https://github.com/${github.replace('@', '')}`;
    }

    if (linkedin !== undefined) {
      if (!linkedin) {
        updateData.linkedin = null;
      } else {
        updateData.linkedin = linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin.replace('@', '')}`;
      }
    }

    if (leetcodeUsername) updateData.leetcodeUsername = leetcodeUsername;
    if (gfgUsername !== undefined) updateData.gfgUsername = gfgUsername;

    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber ? phoneNumber.replace(/\s/g, '') : null;
    }

    if (dailyGrindTime !== undefined) {
      updateData.dailyGrindTime = dailyGrindTime || null;
    }



    // Mark onboarding as completed if this is the initial setup
    if ('onboardingCompleted' in user && !user.onboardingCompleted) {
      updateData.onboardingCompleted = true;
    }

    const [updatedUser] = await db.update(users)
      .set(updateData as any)
      .where(eq(users.id, Number(user.id)))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        createErrorResponse('User not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Trigger immediate LeetCode sync if username was set
    if (leetcodeUsername) {
      try {
        await updateDailyStatsForUser(updatedUser.id, updatedUser.leetcodeUsername);
      } catch (syncError) {
        console.error('Initial LeetCode sync failed:', syncError);
        if (syncError instanceof LeetCodeError) {
          return NextResponse.json(
            createErrorResponse(syncError.message, syncError.code),
            { status: 400 }
          );
        }
      }
    }

    // Recalculate profile completion using the centralized function
    // Use same logic as auth.ts: onboardingCompleted=true means profile is complete
    const { isProfileIncomplete } = await import('@/lib/auth');
    const profileIncomplete = isProfileIncomplete(updatedUser);

    return NextResponse.json({
      user: {
        ...updatedUser,
        isProfileIncomplete: profileIncomplete
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      createErrorResponse(message, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
});
