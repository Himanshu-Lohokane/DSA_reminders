"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import PremiumOnboarding from '@/components/PremiumOnboarding';

export default function OnboardingPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Redirect to home if profile is already complete
        if (!isLoading && user && !user.isProfileIncomplete) {
            router.push('/home');
        }
        // Redirect to landing if not logged in
        if (!isLoading && !user) {
            router.push('/');
        }
    }, [user, isLoading, router]);

    if (isLoading || !user) {
        return (
            <div className="h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    // Use the premium multi-step onboarding
    return <PremiumOnboarding />;
}
