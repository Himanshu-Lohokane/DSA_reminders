"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, UserPlus, LogIn, Skull } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import Image from "next/image";

const ROASTS = [
    "Abe DSA kar varna Swiggy pe delivery karega! 🛵",
    "Netflix band kar, LeetCode khol! Nahi toh fresher hi rahega! 💀",
    "Tere dost Google join kar rahe, tu abhi bhi Two Sum mein atka hai! 😭",
    "DSA nahi aati? Koi baat nahi, Chai Ka Thela bhi acha business hai! ☕",
    "Ek problem roz bhi solve nahi karta? Beta campus mein hi reh jayega! 🏫",
    "Array reverse karna nahi aata? Career bhi reverse ho jayegi! 🔄",
    "Teri struggle story LinkedIn pe viral hogi... galat reason se! 😅",
    "Recursion samajh nahi aata? Tu khud ek infinite loop hai bro! 🔁",
];

function getRandomRoast() {
    return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

export default function AuthPage() {
    const { login, register } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roast] = useState(getRandomRoast());

    // Login form state
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // Register form state
    const [regName, setRegName] = useState("");
    const [regEmail, setRegEmail] = useState("");
    const [regPassword, setRegPassword] = useState("");
    const [regLeetcode, setRegLeetcode] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await login(loginEmail, loginPassword);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await register(regName, regEmail, regPassword, regLeetcode);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Banner */}
                <div className="mb-6 rounded-2xl overflow-hidden border border-white/10">
                    <Image
                        src="/dsa-dhurandhar-banner.png"
                        alt="DSA Dhurandhar"
                        width={600}
                        height={300}
                        className="w-full h-auto object-cover"
                        priority
                    />
                </div>

                {/* Tagline */}
                <p className="text-center text-zinc-400 text-sm mb-4">LeetCode grind karo. Doston ko harao. 🔥</p>

                {/* Roast Banner */}
                <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                        <Skull className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-xs sm:text-sm font-medium">{roast}</p>
                    </div>
                </div>

                {/* Auth Card */}
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-4 sm:p-6">
                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/5">
                            <TabsTrigger
                                value="login"
                                className="flex items-center gap-2 text-sm data-[state=active]:bg-white/10"
                            >
                                <LogIn className="h-4 w-4" /> Login
                            </TabsTrigger>
                            <TabsTrigger
                                value="register"
                                className="flex items-center gap-2 text-sm data-[state=active]:bg-white/10"
                            >
                                <UserPlus className="h-4 w-4" /> Sign Up
                            </TabsTrigger>
                        </TabsList>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <TabsContent value="login">
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="login-email" className="text-zinc-300">Email</Label>
                                    <Input
                                        id="login-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={loginEmail}
                                        onChange={(e) => setLoginEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="login-password" className="text-zinc-300">Password</Label>
                                    <Input
                                        id="login-password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                    />
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Login ho raha hai...
                                        </>
                                    ) : (
                                        "Login Karo 🚀"
                                    )}
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="register">
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="reg-name" className="text-zinc-300">Full Name</Label>
                                    <Input
                                        id="reg-name"
                                        type="text"
                                        placeholder="Rahul Sharma"
                                        value={regName}
                                        onChange={(e) => setRegName(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-email" className="text-zinc-300">Email</Label>
                                    <Input
                                        id="reg-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={regEmail}
                                        onChange={(e) => setRegEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-password" className="text-zinc-300">Password</Label>
                                    <Input
                                        id="reg-password"
                                        type="password"
                                        placeholder="Min. 6 characters"
                                        value={regPassword}
                                        onChange={(e) => setRegPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={isLoading}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="reg-leetcode" className="text-zinc-300">LeetCode Username</Label>
                                    <Input
                                        id="reg-leetcode"
                                        type="text"
                                        placeholder="your_leetcode_username"
                                        value={regLeetcode}
                                        onChange={(e) => setRegLeetcode(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-cyan-500"
                                    />
                                    <p className="text-xs text-zinc-500">
                                        Hum verify karenge ki tu sach mein LeetCode pe hai ya bas timepass 😏
                                    </p>
                                </div>
                                <Button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Account ban raha hai...
                                        </>
                                    ) : (
                                        "Account Banao 💪"
                                    )}
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Footer */}
                <p className="text-center text-zinc-600 text-xs mt-6 px-4">
                    DSA karle bhai varna JOB nahi lagegi! 💀🔥
                </p>
            </div>
        </div>
    );
}
