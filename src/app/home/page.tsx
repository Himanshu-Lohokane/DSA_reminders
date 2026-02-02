"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trophy, Target, Crown, LogOut, Github, Linkedin, Users, Plus, Hash, Copy, Settings, ChevronRight, Flame, Medal, Link as LinkIcon, Share2 } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { getRandomRoast } from "@/config/messages";
import ActivityFeed from "@/components/ActivityFeed";
import { LeaderboardEntry, LeetCodeSubmission, Group } from "@/types";
import LeaderboardRow from "@/components/LeaderboardRow";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function HomePage() {
    const { user, logout, isLoading: authLoading, token } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    // UI State
    const [leaderboardType, setLeaderboardType] = useState<'daily' | 'allTime'>('daily');
    const [activeGroup, setActiveGroup] = useState<Group | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDesc, setNewGroupDesc] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [modalError, setModalError] = useState("");
    const [roast, setRoast] = useState("");

    useEffect(() => {
        setRoast(getRandomRoast());
    }, []);

    // Fetch Groups
    const { data: groupsData } = useQuery({
        queryKey: ["groups", token],
        queryFn: async () => {
            const res = await fetch("/api/groups", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch groups");
            return res.json();
        },
        enabled: !!token && !!user,
    });

    const userGroups = groupsData?.groups || [];

    // Fetch Leaderboard
    const { data: leaderboardData, isLoading, dataUpdatedAt } = useQuery({
        queryKey: ["leaderboard", activeGroup?.id, leaderboardType, token],
        queryFn: async () => {
            const endpoint = activeGroup
                ? `/api/groups/${activeGroup.id}/leaderboard?type=${leaderboardType}`
                : `/api/leaderboard?type=${leaderboardType}&platform=separate`;

            const res = await fetch(endpoint, {
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error("Failed to fetch leaderboard");
            return res.json();
        },
        enabled: !!user,
    });

    const leaderboard: LeaderboardEntry[] = leaderboardData?.leaderboard || (Array.isArray(leaderboardData) ? leaderboardData : (leaderboardData?.entries || []));
    const activities = leaderboardData?.activities || [];
    const dailyRoastData = leaderboardData?.dailyRoast;

    useEffect(() => {
        if (dailyRoastData?.roast) {
            const personalizedRoast = dailyRoastData.roast.replace(/\[NAME\]/g, user?.name?.split(' ')[0] || "Dhurandhar");
            setRoast(personalizedRoast);
        }
    }, [dailyRoastData, user]);

    // Mutations
    const refreshMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/users/refresh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
            if (!res.ok) throw new Error("Failed to refresh stats");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            toast.success("Stats updated!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to refresh stats");
        }
    });

    const createGroupMutation = useMutation({
        mutationFn: async (payload: { name: string, description: string }) => {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to create group");
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            setIsCreateGroupOpen(false);
            setNewGroupName("");
            setNewGroupDesc("");
            setActiveGroup(data.group);
            toast.success("Group created successfully!");
        }
    });

    const joinGroupMutation = useMutation({
        mutationFn: async (code: string) => {
            const res = await fetch("/api/groups/join", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to join group");
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            setIsJoinGroupOpen(false);
            setJoinCode("");
            setActiveGroup(data.group);
            toast.success("Joined group successfully!");
        }
    });

    const isRefreshing = refreshMutation.isPending;
    const isSubmitting = createGroupMutation.isPending || joinGroupMutation.isPending;

    const refreshStats = () => {
        refreshMutation.mutate();
    };

    const handleCreateGroup = (e: React.FormEvent) => {
        e.preventDefault();
        setModalError("");
        createGroupMutation.mutate({ name: newGroupName, description: newGroupDesc }, {
            onError: (error: any) => setModalError(error.message)
        });
    };

    const handleJoinGroup = (e: React.FormEvent) => {
        e.preventDefault();
        setModalError("");
        joinGroupMutation.mutate(joinCode, {
            onError: (error: any) => setModalError(error.message)
        });
    };

    const getBaseUrl = () => {
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
        return process.env.NEXT_PUBLIC_APP_URL || 'https://dsa-grinders.vercel.app';
    };

    const handleShareGroup = async (group: Group) => {
        try {
            const baseUrl = getBaseUrl();
            const shareUrl = `${baseUrl}/home?join=${group.code}`;
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Share link copied!');
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const joinCodeParam = params.get('join');
            if (joinCodeParam) {
                setJoinCode(joinCodeParam.toUpperCase());
                setIsJoinGroupOpen(true);
                window.history.replaceState({}, '', window.location.pathname);
            }
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    const currentUserEntry = Array.isArray(leaderboard) ? leaderboard.find(e => e?.email === user.email) : null;
    const myPoints = currentUserEntry?.todayPoints || 0;
    const myRank = currentUserEntry?.rank || '-';

    return (
        <div className="min-h-screen bg-[#F1F3F4] dark:bg-black text-foreground font-sans">
            <header className="fixed top-0 inset-x-0 bg-white/95 dark:bg-black/95 backdrop-blur-md z-50 border-b border-[#E8EAED] dark:border-[#3C4043] shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] dark:shadow-none">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-3">
                        <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain md:w-10 md:h-10" priority />
                        <span className="text-xl md:text-2xl font-medium tracking-tight text-[#5F6368] dark:text-gray-400">
                            DSA <span className="text-[#202124] dark:text-white font-semibold">Grinders</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-1 md:gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshStats}
                            disabled={isRefreshing}
                            className={`text-[#5F6368] dark:text-gray-300 hover:bg-[#F1F3F4] dark:hover:bg-gray-800 hover:text-[#4285F4] font-medium rounded-full px-2 md:px-4 ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={isRefreshing ? "Syncing..." : "Sync Leaderboard"}
                        >
                            <RefreshCw className={`h-4 w-4 md:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden md:inline">Sync Stats</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/profile')}
                            className="text-[#5F6368] dark:text-gray-300 hover:bg-[#F1F3F4] dark:hover:bg-gray-800 hover:text-[#4285F4] font-medium rounded-full px-2 md:px-4"
                        >
                            <span className="hidden md:inline">Profile</span>
                            <Settings className="h-4 w-4 md:hidden" />
                        </Button>
                        <AnimatedThemeToggler className="h-8 w-8 md:h-9 md:w-9" />
                        <div className="h-6 w-px bg-[#E8EAED] dark:bg-gray-700 mx-1"></div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-[#5F6368] hover:text-[#EA4335] hover:bg-[#FAD2CF] dark:hover:bg-red-950 rounded-full h-8 w-8 md:h-9 md:w-9 p-0"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto pt-24 pb-12 px-6">
                <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="bg-linear-to-br from-[#4285F4] to-[#174EA6] rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(66,133,244,0.25)]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden bg-white/20 backdrop-blur-md border-2 border-white/30 p-1 shrink-0">
                                    {currentUserEntry?.avatar ? (
                                        <img src={currentUserEntry.avatar} alt="" className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">
                                            {user?.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2">
                                        Hi, {user?.name?.split(' ')[0]}! 👋
                                    </h1>
                                    <p className="text-blue-100 text-lg font-medium opacity-90 max-w-sm">
                                        {myPoints === 0 ? "Start your day with a problem!" : "You're on fire! Keep that momentum going."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 md:gap-8 w-full md:w-auto">
                                <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center md:text-left min-w-[140px]">
                                    <div className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Rank</div>
                                    <div className="text-3xl font-black">#{myRank}</div>
                                </div>
                                <div className="flex-1 md:flex-none bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 text-center md:text-left min-w-[140px]">
                                    <div className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-1">Score</div>
                                    <div className="text-3xl font-black">+{myPoints}</div>
                                </div>
                                <div className="hidden sm:block flex-1 md:flex-none bg-emerald-500/20 backdrop-blur-md rounded-3xl p-6 border border-emerald-400/20 text-center md:text-left min-w-[140px]">
                                    <div className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-1">Streak</div>
                                    <div className="text-3xl font-black flex items-center gap-2">
                                        🔥 {currentUserEntry?.streak || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 bg-white dark:bg-card rounded-3xl border border-[#E8EAED] dark:border-border relative overflow-hidden shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] dark:shadow-none">
                        <div className="px-4 md:px-8 pb-0 pt-4 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-11 px-5 bg-white dark:bg-card border-[#E8EAED] dark:border-border hover:bg-[#F1F3F4] dark:hover:bg-muted transition-all rounded-2xl gap-3 group shadow-sm">
                                            <div className="flex flex-col items-start leading-tight">
                                                <span className="text-[10px] font-black text-[#5F6368] dark:text-muted-foreground uppercase tracking-widest group-hover:text-[#4285F4] transition-colors">Scope</span>
                                                <span className="text-sm font-bold text-[#202124] dark:text-foreground truncate max-w-[120px]">
                                                    {activeGroup ? activeGroup.name : 'Global'}
                                                </span>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-[#5F6368] dark:text-muted-foreground group-hover:text-[#4285F4] group-hover:translate-x-0.5 transition-all" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56 p-2 bg-white dark:bg-card border-[#E8EAED] dark:border-border shadow-[0_8px_10px_1px_rgba(0,0,0,.14),0_3px_14px_2px_rgba(0,0,0,.12),0_5px_5px_-3px_rgba(0,0,0,.2)]">
                                        <DropdownMenuLabel className="text-[10px] font-black text-[#5F6368] dark:text-gray-400 uppercase tracking-widest px-2.5 py-2">
                                            Your Communities
                                        </DropdownMenuLabel>
                                        <DropdownMenuItem
                                            onClick={() => setActiveGroup(null)}
                                            className={`cursor-pointer flex items-center justify-between rounded-xl mb-1 ${!activeGroup ? 'bg-[#D2E3FC] text-[#174EA6] font-bold' : ''}`}
                                        >
                                            <span className="truncate">Global</span>
                                            {!activeGroup && <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />}
                                        </DropdownMenuItem>
                                        {Array.isArray(userGroups) && userGroups.length > 0 && <DropdownMenuSeparator className="opacity-50" />}
                                        <div className="max-h-[200px] overflow-y-auto pr-1">
                                            {Array.isArray(userGroups) && userGroups.map(group => (
                                                <DropdownMenuItem
                                                    key={group.id}
                                                    onClick={() => setActiveGroup(group)}
                                                    className={`cursor-pointer flex items-center justify-between rounded-xl mb-1 ${activeGroup?.id === group.id ? 'bg-[#D2E3FC] text-[#174EA6] font-bold' : ''}`}
                                                >
                                                    <span className="truncate">{group?.name}</span>
                                                    {activeGroup?.id === group.id && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" />
                                                    )}
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                        <DropdownMenuSeparator className="opacity-50" />
                                        <div className="grid grid-cols-2 gap-1 p-1">
                                            <DropdownMenuItem onClick={() => setIsCreateGroupOpen(true)} className="cursor-pointer gap-2 text-[#4285F4] focus:text-[#174EA6] rounded-lg justify-center border border-[#D2E3FC] bg-[#D2E3FC]/30 hover:bg-[#D2E3FC]">
                                                <Plus className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">New</span>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setIsJoinGroupOpen(true)} className="cursor-pointer gap-2 text-[#4285F4] focus:text-[#174EA6] rounded-lg justify-center border border-[#D2E3FC] bg-[#D2E3FC]/30 hover:bg-[#D2E3FC]">
                                                <Hash className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">Join</span>
                                            </DropdownMenuItem>
                                        </div>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {activeGroup && (
                                <div className="flex items-center gap-2 animate-in fade-in zoom-in-95 self-start sm:self-auto">
                                    <div
                                        className="flex items-center gap-2 text-sm bg-[#D2E3FC]/50 dark:bg-blue-50/10 px-3 py-1.5 rounded-full border border-[#4285F4]/30 cursor-pointer hover:border-[#4285F4] transition-colors group/code"
                                        onClick={() => {
                                            navigator.clipboard.writeText(activeGroup.code);
                                            toast.success('Code copied!', { duration: 2000 });
                                        }}
                                        title="Click to copy invite code"
                                    >
                                        <span className="text-blue-600 text-xs uppercase font-medium tracking-wide mr-1">Code:</span>
                                        <span className="font-mono font-bold text-blue-800 tracking-wider font-size-xs">{activeGroup.code}</span>
                                        <Copy className="w-3.5 h-3.5 text-blue-400 group-hover/code:text-blue-600 ml-1" />
                                    </div>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => handleShareGroup(activeGroup)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-1.5 h-auto text-xs font-medium flex items-center gap-2 shadow-sm"
                                        title="Generate and copy share link"
                                    >
                                        <Share2 className="w-3.5 h-3.5" />
                                        <span className="hidden sm:inline">Share Link</span>
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="px-4 md:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-t border-border bg-muted/20 mt-2 gap-4">
                            <div className="flex items-center gap-5">
                                <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] whitespace-nowrap">
                                    {activeGroup ? 'Group Arena' : 'Global Arena'}
                                </h2>
                                <div className="flex bg-muted p-1 rounded-xl border border-border">
                                    <button
                                        onClick={() => setLeaderboardType('daily')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${leaderboardType === 'daily'
                                            ? 'bg-card text-primary ring-1 ring-border'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Daily
                                    </button>
                                    <button
                                        onClick={() => setLeaderboardType('allTime')}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${leaderboardType === 'allTime'
                                            ? 'bg-card text-primary ring-1 ring-border'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        All Time
                                    </button>
                                </div>
                            </div>
                            {leaderboardData && (
                                <span className="text-xs font-medium text-muted-foreground bg-card px-3 py-1 rounded-full border border-border self-start sm:self-auto">
                                    Last updated {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                        {isLoading ? (
                            <div className="animate-pulse">
                                <div className="px-4 md:px-8 py-4 bg-gray-50/20 border-b border-gray-100 flex items-center gap-4 md:gap-8">
                                    <div className="w-8 md:w-12 flex justify-center shrink-0">
                                        <div className="h-3 w-8 bg-gray-200 rounded" />
                                    </div>
                                    <div className="flex-1 flex items-center gap-4 min-w-0">
                                        <div className="w-12 md:w-14 h-12 md:h-14 rounded-2xl bg-gray-200 shrink-0" />
                                        <div className="h-3 w-16 bg-gray-200 rounded" />
                                    </div>
                                    <div className="flex gap-4 md:gap-10 items-center shrink-0">
                                        <div className="hidden lg:block h-3 w-12 bg-gray-200 rounded" />
                                        <div className="h-3 w-12 bg-gray-200 rounded" />
                                        <div className="h-3 w-12 bg-gray-200 rounded" />
                                    </div>
                                </div>
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="px-4 md:px-8 py-5 flex items-center gap-4 md:gap-8 border-b border-gray-50">
                                        <div className="w-8 md:w-12 flex justify-center shrink-0">
                                            {i < 3 ? <div className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-gray-200" /> : <div className="h-4 w-6 bg-gray-200 rounded" />}
                                        </div>
                                        <div className="flex-1 flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gray-200 shrink-0" />
                                            <div className="space-y-2 flex-1">
                                                <div className="h-4 w-24 md:w-32 bg-gray-200 rounded" />
                                                <div className="h-3 w-16 md:w-20 bg-gray-150 rounded" style={{ backgroundColor: '#f0f0f0' }} />
                                            </div>
                                        </div>
                                        <div className="flex gap-2 md:gap-6 items-center shrink-0">
                                            <div className="hidden lg:block w-16"><div className="h-10 w-full bg-gray-200 rounded-2xl" /></div>
                                            <div className="w-16 md:w-20 space-y-1">
                                                <div className="h-2 w-10 bg-gray-200 rounded ml-auto" />
                                                <div className="h-5 w-12 bg-gray-200 rounded ml-auto" />
                                            </div>
                                            <div className="w-16 md:w-20 space-y-1">
                                                <div className="h-2 w-10 bg-gray-200 rounded ml-auto" />
                                                <div className="h-5 w-12 bg-gray-200 rounded ml-auto" />
                                            </div>
                                            <div className="w-16 md:w-20 space-y-1">
                                                <div className="h-2 w-10 bg-gray-200 rounded ml-auto" />
                                                <div className="h-5 w-8 bg-gray-200 rounded ml-auto" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
                                <p>No data available yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="px-4 md:px-8 py-4 bg-[#F1F3F4]/50 dark:bg-muted/20 border-b border-[#E8EAED] dark:border-border flex items-center gap-4 md:gap-8">
                                    <div className="w-8 md:w-12 flex justify-center shrink-0">
                                        <span className="text-[10px] font-black text-[#5F6368] dark:text-muted-foreground uppercase tracking-widest">Rank</span>
                                    </div>
                                    <div className="flex-1 flex items-center gap-4 min-w-0">
                                        <div className="w-12 md:w-14 shrink-0 opacity-0" />
                                        <span className="text-[10px] font-black text-[#5F6368] dark:text-muted-foreground uppercase tracking-widest">User</span>
                                    </div>
                                    <div className="flex gap-2 md:gap-6 items-center shrink-0">
                                        <div className="hidden lg:flex justify-center w-16">
                                            <span className="text-[10px] font-black text-[#5F6368] dark:text-muted-foreground uppercase tracking-widest">Streak</span>
                                        </div>
                                        <div className="text-right w-16 md:w-20">
                                            <div className="flex items-center justify-end gap-1 mb-1">
                                                <span className="w-3 h-3 bg-orange-500 rounded text-white text-[6px] font-bold flex items-center justify-center">LC</span>
                                                <span className="text-[8px] font-black text-[#5F6368] dark:text-muted-foreground uppercase tracking-widest">Score</span>
                                            </div>
                                        </div>
                                        <div className="text-right w-16 md:w-20">
                                            <div className="flex items-center justify-end gap-1 mb-1">
                                                <span className="w-3 h-3 bg-green-600 rounded text-white text-[6px] font-bold flex items-center justify-center">GFG</span>
                                                <span className="text-[8px] font-black text-[#5F6368] dark:text-muted-foreground uppercase tracking-widest">Score</span>
                                            </div>
                                        </div>
                                        <div className="text-right w-16 md:w-20">
                                            <span className="text-[8px] font-black text-[#5F6368] dark:text-muted-foreground uppercase tracking-widest">Today</span>
                                        </div>
                                    </div>
                                </div>
                                <motion.div
                                    key={`leaderboard-${activeGroup?.id ?? 'global'}-${leaderboardType}`}
                                    className="divide-y divide-gray-100"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 0 },
                                        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                                    }}
                                >
                                    {Array.isArray(leaderboard) && leaderboard.map((entry, index) => (
                                        <LeaderboardRow
                                            key={entry.id}
                                            entry={entry}
                                            index={index}
                                            isCurrentUser={entry?.email === user?.email}
                                        />
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </div>
                    <div className="lg:col-span-4">
                        <ActivityFeed entries={leaderboard} activities={activities} />
                    </div>
                </div>
            </main>

            <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create a New Group</DialogTitle>
                        <DialogDescription>Create a private leaderboard for your friends or community.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateGroup}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Group Name</Label>
                                <Input id="name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="e.g., Dhurandhars Elite" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input id="description" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} placeholder="What is this group about?" />
                            </div>
                            {modalError && <p className="text-sm text-[#EA4335]">{modalError}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCreateGroupOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : "Create Group"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isJoinGroupOpen} onOpenChange={setIsJoinGroupOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Join a Group</DialogTitle>
                        <DialogDescription>Enter the 6-character code shared by the group admin.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleJoinGroup}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Group Code</Label>
                                <Input id="code" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g., X7K9P2" maxLength={6} required className="font-mono uppercase tracking-widest text-center text-lg" />
                            </div>
                            {modalError && <p className="text-sm text-[#EA4335]">{modalError}</p>}
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsJoinGroupOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Joining...</> : "Join Group"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <PWAInstallPrompt />
        </div>
    );
}
