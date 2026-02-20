"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AuthPage() {
    const { user, signInWithGoogle, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Redirect logged-in users to home
    useEffect(() => {
        if (!authLoading && user) {
            router.push('/home');
        }
    }, [user, authLoading, router]);

    const handleGoogleSignIn = async () => {
        setIsRedirecting(true);
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Sign in error:", error);
            setIsRedirecting(false);
        }
    };

    // Show loading while checking auth or if user is logged in (redirecting)
    if (authLoading || user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted flex flex-col items-center justify-center p-4 font-sans">
            {/* Back to home - Fixed top-left */}
            <Link
                href="/"
                className="fixed top-8 left-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to home
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-[448px]"
            >
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-[0_1px_2px_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)]">
                    {/* Accent line at top */}
                    <div className="h-1 bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC04] to-[#34A853]" />
                    
                    <div className="px-12 py-16">
                        {/* Header with logo */}
                        <div className="flex items-center justify-center mb-6">
                            <div className="relative w-12 h-12">
                                <Image src="/logo.png" alt="DSA Grinders" width={48} height={48} className="object-contain" priority />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {/* Main heading */}
                            <div className="text-center">
                                <h2 className="text-2xl font-normal text-foreground mb-3">Sign in to continue</h2>
                                <p className="text-sm text-muted-foreground font-normal">
                                    DSA Grinders
                                </p>
                            </div>

                            {/* Sign in button */}
                            <div className="space-y-4">
                                <Button
                                    onClick={() => handleGoogleSignIn()}
                                    disabled={isRedirecting || authLoading}
                                    className="w-full h-12 bg-[#4285F4] hover:bg-[#3367D6] text-white border-0 rounded-lg shadow-[0_1px_2px_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] hover:shadow-[0_1px_3px_rgba(60,64,67,0.3),0_4px_8px_3px_rgba(60,64,67,0.15)] transition-all flex items-center justify-center gap-3 text-sm font-medium disabled:opacity-70"
                                >
                                    {isRedirecting || authLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <>
                                            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                                                <path fill="#FFFFFF" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#FFFFFF" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FFFFFF" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                                                <path fill="#FFFFFF" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Sign in with Google
                                        </>
                                    )}
                                </Button>

                                <p className="text-[11px] text-muted-foreground leading-[16px] text-center">
                                    To continue, Google will share your name, email address, and profile picture with DSA Grinders. See DSA Grinders'{' '}
                                    <span className="text-[#4285F4] dark:text-[#8AB4F8] cursor-pointer">privacy policy</span>
                                    {' '}and{' '}
                                    <span className="text-[#4285F4] dark:text-[#8AB4F8] cursor-pointer">terms of service</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer links */}
                <div className="mt-6 flex justify-center gap-4 text-[11px] text-muted-foreground">
                    <a href="https://github.com/piyushdhoka/DSA_Grinders/issues" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Help</a>
                    <a href="https://github.com/piyushdhoka/DSA_Grinders" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacy</a>
                    <a href="https://github.com/piyushdhoka/DSA_Grinders" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms</a>
                </div>
            </motion.div>
        </div>
    );
}
