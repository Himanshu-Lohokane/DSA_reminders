"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, RefreshCw, Trophy, Target, Crown, Flame, Skull, Zap } from "lucide-react";

interface LeaderboardEntry {
    id: string;
    name: string;
    email: string;
    leetcodeUsername: string;
    todayPoints: number;
    totalProblems: number;
    rank: number;
}

const MOTIVATIONAL_ROASTS = [
    "Aaj kuch solve kiya ya bas scroll kar raha hai? 🤨",
    "Tere competitor abhi grind kar rahe! Tu kya kar raha? 💀",
    "Ye 0 points dekhke teri placement committee ro rahi hai! 😭",
    "Bro ek problem toh solve kar, recruiter ko impress karna hai! 🙏",
    "Khali baitha hai? Graph wala question try kar! 📈",
    "Teri struggle story LinkedIn pe viral hogi... galat reason se! 😅",
    "Two Sum bhi nahi aata? Beta ye engineering nahi teri bas ki! 🎓",
];

function getRandomRoast() {
    return MOTIVATIONAL_ROASTS[Math.floor(Math.random() * MOTIVATIONAL_ROASTS.length)];
}

export default function HomePage() {
    const { user, logout, isLoading: authLoading, token } = useAuth();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [roast] = useState(getRandomRoast());

    const fetchLeaderboard = useCallback(async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/leaderboard");
            const data = await res.json();
            if (Array.isArray(data)) {
                setLeaderboard(data);
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const refreshStats = async () => {
        if (!user || !token) return;
        setIsRefreshing(true);
        try {
            await fetch("/api/users/refresh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
            await fetchLeaderboard(false);
        } catch (error) {
            console.error("Failed to refresh stats:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchLeaderboard();
            const interval = setInterval(() => fetchLeaderboard(false), 30000);
            return () => clearInterval(interval);
        }
    }, [user, fetchLeaderboard]);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
            </div>
        );
    }

    if (!user) return null;

    const currentUserEntry = leaderboard.find(e => e.email === user.email);
    const myPoints = currentUserEntry?.todayPoints || 0;
    const myRank = currentUserEntry?.rank || '-';

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f]">
            {/* Header */}
            <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg sm:rounded-xl">
                            <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                        </div>
                        <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            DSA Dhurandhar
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={refreshStats}
                            disabled={isRefreshing}
                            className="border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs sm:text-sm px-2 sm:px-3"
                        >
                            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''} sm:mr-2`} />
                            <span className="hidden sm:inline">Sync Karo</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="text-zinc-400 hover:text-white hover:bg-white/10 h-8 w-8 sm:h-10 sm:w-10"
                        >
                            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">

                {/* Roast Banner */}
                {myPoints === 0 && (
                    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <Skull className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-300 text-xs sm:text-sm font-medium">{roast}</p>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
                    {/* Today's Points */}
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-cyan-500/20 p-3 sm:p-6">
                        <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-20">
                            <Target className="h-8 w-8 sm:h-16 sm:w-16 text-cyan-500" />
                        </div>
                        <p className="text-[10px] sm:text-sm text-cyan-400 font-medium mb-0.5 sm:mb-1">Aaj Ke Points</p>
                        <p className="text-2xl sm:text-5xl font-bold text-white">{myPoints}</p>
                        <p className="text-[8px] sm:text-xs text-zinc-500 mt-1 sm:mt-2 hidden sm:block">1 problem = 1 point</p>
                    </div>

                    {/* Rank */}
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 p-3 sm:p-6">
                        <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-20">
                            <Crown className="h-8 w-8 sm:h-16 sm:w-16 text-amber-500" />
                        </div>
                        <p className="text-[10px] sm:text-sm text-amber-400 font-medium mb-0.5 sm:mb-1">Teri Rank</p>
                        <p className="text-2xl sm:text-5xl font-bold text-white">#{myRank}</p>
                        <p className="text-[8px] sm:text-xs text-zinc-500 mt-1 sm:mt-2 hidden sm:block">{leaderboard.length} mein se</p>
                    </div>

                    {/* Total Problems */}
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-600/10 border border-purple-500/20 p-3 sm:p-6">
                        <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-20">
                            <Trophy className="h-8 w-8 sm:h-16 sm:w-16 text-purple-500" />
                        </div>
                        <p className="text-[10px] sm:text-sm text-purple-400 font-medium mb-0.5 sm:mb-1">Total Solved</p>
                        <p className="text-2xl sm:text-5xl font-bold text-white">{currentUserEntry?.totalProblems || 0}</p>
                        <p className="text-[8px] sm:text-xs text-zinc-500 mt-1 sm:mt-2 hidden sm:block">lifetime</p>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="rounded-xl sm:rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                    <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex items-center justify-between">
                        <h2 className="text-sm sm:text-lg font-semibold text-white flex items-center gap-2">
                            <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                            Aaj Ka Leaderboard 🔥
                        </h2>
                        {lastRefresh && (
                            <p className="text-[10px] sm:text-xs text-zinc-500">
                                {lastRefresh.toLocaleTimeString()}
                            </p>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="h-48 sm:h-64 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-cyan-500" />
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-zinc-500 p-4">
                            <Trophy className="h-10 w-10 sm:h-12 sm:w-12 mb-4 opacity-20" />
                            <p className="text-sm text-center">Koi data nahi. Pehle LeetCode pe jaake solve toh kar! 😤</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {leaderboard.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className={`px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4 transition-colors ${entry.email === user.email
                                        ? 'bg-cyan-500/5 border-l-2 border-cyan-500'
                                        : 'hover:bg-white/[0.02]'
                                        }`}
                                >
                                    {/* Rank */}
                                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg flex-shrink-0 ${index === 0 ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black' :
                                        index === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-black' :
                                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                                                'bg-white/5 text-zinc-400'
                                        }`}>
                                        {entry.rank}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white truncate text-sm sm:text-base">
                                            {entry.name}
                                            {entry.email === user.email && (
                                                <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs text-cyan-400">(Tu)</span>
                                            )}
                                        </p>
                                        <p className="text-xs sm:text-sm text-zinc-500 truncate">@{entry.leetcodeUsername}</p>
                                    </div>

                                    {/* Points */}
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xl sm:text-2xl font-bold text-white">{entry.todayPoints}</p>
                                        <p className="text-[10px] sm:text-xs text-zinc-500">aaj</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Message */}
                <div className="mt-4 sm:mt-8 text-center">
                    <p className="text-zinc-600 text-xs sm:text-sm px-4">
                        💡 LeetCode pe problem solve karo, phir "Sync Karo" button dabao!
                    </p>
                </div>
            </main>
        </div>
    );
}
