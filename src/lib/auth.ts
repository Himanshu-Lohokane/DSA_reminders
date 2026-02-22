import { NextRequest } from 'next/server';
import { db } from '@/db/drizzle';
import { users, User } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { supabase } from './supabase';

export async function getCurrentUser(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
        if (error || !supabaseUser) return null;

        const email = supabaseUser.email?.toLowerCase();
        if (!email) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!user) return null;

        return { ...user, isProfileIncomplete: isProfileIncomplete(user) };
    } catch (error) {
        console.error('Auth error:', error);
        return null;
    }
}

export function isProfileIncomplete(user: User | any): boolean {
    if (!user) return true;

    // If onboarding was already completed, the profile is NEVER incomplete.
    // This prevents re-triggering the onboarding flow on subsequent logins.
    if (user.onboardingCompleted) return false;

    // For users who haven't completed onboarding, check minimum required fields.
    return (
        !user.leetcodeUsername ||
        user.leetcodeUsername.startsWith('pending_')
    );
}

// Type for authenticated users
type DatabaseUser = User & { isProfileIncomplete: boolean };
export type AuthUser = DatabaseUser;

type AuthenticatedHandler = (req: NextRequest, user: AuthUser, context?: unknown) => Promise<Response>;

export function requireAuth(handler: AuthenticatedHandler) {
    return async (req: NextRequest, context?: unknown) => {
        const user = await getCurrentUser(req);
        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Block actions if profile is incomplete (except for profile update and onboarding routes)
        const isProfileUpdate = req.nextUrl.pathname === '/api/users/profile';
        const isOnboarding = req.nextUrl.pathname === '/api/users/onboarding';
        if (user.isProfileIncomplete && !isProfileUpdate && !isOnboarding) {
            return new Response(JSON.stringify({ error: 'Profile completion required', isProfileIncomplete: true }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return handler(req, user, context);
    };
}
