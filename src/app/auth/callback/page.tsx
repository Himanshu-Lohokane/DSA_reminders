"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
    const router = useRouter();
    const [status, setStatus] = useState('Authenticating...');

    useEffect(() => {
        const handleAuth = async () => {
            // Supabase client automatically handles the hash/code in the URL
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                setStatus('Checking profile...');
                
                // Sync user with database and check profile completion
                const syncRes = await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });

                if (syncRes.ok) {
                    const { user } = await syncRes.json();
                    
                    // Route based on profile completion
                    if (user.isProfileIncomplete) {
                        setStatus('Setting up profile...');
                        router.push('/onboarding');
                    } else {
                        setStatus('Welcome back!');
                        router.push('/home');
                    }
                } else {
                    console.error('Failed to sync user');
                    router.push('/login');
                }
            } else {
                console.error('No session found in callback', error);
                router.push('/login');
            }
        };

        handleAuth();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-700 dark:text-gray-300 font-medium animate-pulse">{status}</p>
            </div>
        </div>
    );
}
