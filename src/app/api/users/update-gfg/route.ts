import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { fetchGFGStats } from '@/lib/gfg';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, gfgUsername } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // If gfgUsername is provided, validate it first
    if (gfgUsername) {
      try {
        await fetchGFGStats(gfgUsername);
        console.log(`✅ GFG username "${gfgUsername}" validated successfully`);
      } catch (error) {
        console.error(`❌ GFG username validation failed:`, error);
        return NextResponse.json(
          { 
            error: 'Invalid GFG username or profile not accessible',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          { status: 400 }
        );
      }
    }

    // Update user with GFG username
    const [updatedUser] = await db.update(users)
      .set({ gfgUsername: gfgUsername || null })
      .where(eq(users.id, parseInt(userId)))
      .returning();

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'GFG username updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        leetcodeUsername: updatedUser.leetcodeUsername,
        gfgUsername: updatedUser.gfgUsername,
      },
    });
  } catch (error) {
    console.error('Error updating GFG username:', error);
    return NextResponse.json(
      { error: 'Failed to update GFG username' },
      { status: 500 }
    );
  }
}