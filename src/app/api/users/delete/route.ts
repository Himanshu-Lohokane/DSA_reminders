import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { users, groups, groupMembers } from '@/db/schema';
import { getTokenFromHeader, verifyToken } from '@/lib/jwt';
import { eq, and } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

// Create admin client for user deletion
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function DELETE(req: NextRequest) {
    try {
        // Verify authentication
        const authHeader = req.headers.get('authorization');
        const token = getTokenFromHeader(authHeader);

        if (!token) {
            return NextResponse.json(
                { error: 'No authentication token provided' },
                { status: 401 }
            );
        }

        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const userId = parseInt(payload.userId);
        const userEmail = payload.email;

        // Get confirmation text from request body
        const body = await req.json();
        const { confirmation } = body;

        if (confirmation !== 'DELETE') {
            return NextResponse.json(
                { error: 'Invalid confirmation text. Please type DELETE to confirm.' },
                { status: 400 }
            );
        }

        // Start transaction to handle all deletions
        // 1. Handle groups owned by this user (delete them)
        const ownedGroups = await db.select().from(groups).where(eq(groups.owner, userId));
        
        for (const group of ownedGroups) {
            // Delete group members first (cascade will handle it but being explicit)
            await db.delete(groupMembers).where(eq(groupMembers.groupId, group.id));
            // Delete the group
            await db.delete(groups).where(eq(groups.id, group.id));
        }

        // 2. Delete user from database (will cascade delete dailyStats and groupMembers)
        await db.delete(users).where(eq(users.id, userId));

        // 3. Delete from Supabase Auth
        try {
            // Get the Supabase user by email
            const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            
            if (listError) {
                console.error('Failed to list Supabase users:', listError);
            } else if (authUsers?.users) {
                const supabaseUser = authUsers.users.find(u => u.email === userEmail);
                
                if (supabaseUser) {
                    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id);
                    if (deleteError) {
                        console.error('Failed to delete from Supabase Auth:', deleteError);
                    }
                }
            }
        } catch (authError) {
            console.error('Error during Supabase Auth deletion:', authError);
            // Continue even if Supabase deletion fails - user is already removed from our DB
        }

        return NextResponse.json(
            { 
                message: 'Account successfully deleted',
                success: true 
            },
            { status: 200 }
        );

    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json(
            { error: 'Failed to delete account. Please try again.' },
            { status: 500 }
        );
    }
}
