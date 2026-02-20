"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, LogOut, Plus, Hash, Copy, Settings, Share2 } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ActivityFeed from "@/components/ActivityFeed";
import { LeaderboardEntry, LeetCodeSubmission, GroupWithMembership } from "@/types";
import LeaderboardRow from "@/components/LeaderboardRow";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function HomePage() {
    const { user, logout, isLoading: authLoading, token } = useAuth();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Redirect incomplete profiles to onboarding
    useEffect(() => {
        if (!authLoading && user?.isProfileIncomplete) {
            router.push('/onboarding');
        }
    }, [user, authLoading, router]);

    // UI State
    const [leaderboardType, setLeaderboardType] = useState<'daily' | 'allTime'>('daily');
    const [activeGroup, setActiveGroup] = useState<GroupWithMembership | null>(null);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [isJoinGroupOpen, setIsJoinGroupOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");
    const [newGroupDesc, setNewGroupDesc] = useState("");
    const [joinCode, setJoinCode] = useState("");
    const [modalError, setModalError] = useState("");
    const [groupToLeave, setGroupToLeave] = useState<GroupWithMembership | null>(null);

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
        queryKey: ["leaderboard", activeGroup?.code, leaderboardType, token],
        queryFn: async () => {
            const endpoint = activeGroup
                ? `/api/groups/${activeGroup.code}/leaderboard?type=${leaderboardType}`
                : `/api/leaderboard?type=${leaderboardType}`;

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

    const leaveGroupMutation = useMutation({
        mutationFn: async (groupId: number) => {
            const res = await fetch("/api/groups/leave", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ groupId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to leave group");
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            // If we left the currently active group, switch to global
            if (activeGroup?.id === groupToLeave?.id) {
                setActiveGroup(null);
            }
            setGroupToLeave(null);
            toast.success(data.groupDeleted ? "Group deleted" : "Left group successfully!");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to leave group");
            setGroupToLeave(null);
        }
    });

    const isRefreshing = refreshMutation.isPending;
    const isSubmitting = createGroupMutation.isPending || joinGroupMutation.isPending || leaveGroupMutation.isPending;

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

    const handleShareGroup = async (group: GroupWithMembership) => {
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
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-background text-foreground font-sans">
            <header className="fixed top-0 inset-x-0 bg-white/95 dark:bg-background/95 backdrop-blur-md z-50 border-b border-[#E8EAED]/60 dark:border-border">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            <Image src="/logo.png" alt="DSA Grinders" width={40} height={40} className="object-contain" priority />
                        </div>
                        <span className="text-xl font-semibold text-[#202124] dark:text-white">DSA Grinders</span>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={refreshStats}
                            disabled={isRefreshing}
                            className="text-[#5F6368] dark:text-gray-300 hover:text-[#4285F4] dark:hover:text-[#8AB4F8] rounded-full px-2 md:px-3 h-9"
                        >
                            <RefreshCw className={`h-4 w-4 md:mr-1.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                            <span className="hidden md:inline text-sm">Sync Stats</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/profile')}
                            className="text-[#5F6368] dark:text-gray-300 hover:text-[#4285F4] dark:hover:text-[#8AB4F8] rounded-full px-2 md:px-3 h-9"
                        >
                            <span className="hidden md:inline text-sm">Profile</span>
                            <Settings className="h-4 w-4 md:hidden" />
                        </Button>
                        <AnimatedThemeToggler className="h-8 w-8" />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-[#5F6368] hover:text-[#EA4335] rounded-full h-9 w-9 p-0"
                            title="Sign out"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto pt-24 pb-12 px-6">
                {/* Greeting */}
                <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <h1 className="text-lg font-medium text-[#202124] dark:text-white">
                        Hey, {user?.name?.split(' ')[0]}
                    </h1>
                </div>

                {/* Group Chips & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button
                            onClick={() => setActiveGroup(null)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-all whitespace-nowrap ${
                                !activeGroup
                                    ? 'bg-[#D2E3FC] text-[#174EA6] border-[#4285F4]/30 dark:bg-[#4285F4]/15 dark:text-[#8AB4F8] dark:border-[#4285F4]/30'
                                    : 'bg-white dark:bg-card text-[#5F6368] dark:text-muted-foreground border-[#E8EAED] dark:border-border hover:bg-[#F1F3F4] dark:hover:bg-muted'
                            }`}
                        >
                            Global
                        </button>
                        {Array.isArray(userGroups) && userGroups.map(group => (
                            <button
                                key={group.code}
                                onClick={() => setActiveGroup(group)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-all whitespace-nowrap ${
                                    activeGroup?.code === group.code
                                        ? 'bg-[#D2E3FC] text-[#174EA6] border-[#4285F4]/30 dark:bg-[#4285F4]/15 dark:text-[#8AB4F8] dark:border-[#4285F4]/30'
                                        : 'bg-white dark:bg-card text-[#5F6368] dark:text-muted-foreground border-[#E8EAED] dark:border-border hover:bg-[#F1F3F4] dark:hover:bg-muted'
                                }`}
                            >
                                {group.name}
                            </button>
                        ))}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="h-8 w-8 flex items-center justify-center rounded-full border border-dashed border-[#E8EAED] dark:border-border text-[#5F6368] dark:text-muted-foreground hover:text-[#4285F4] hover:border-[#4285F4]/40 dark:hover:text-[#8AB4F8] transition-all shrink-0">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 rounded-xl">
                                <DropdownMenuItem onClick={() => setIsCreateGroupOpen(true)} className="cursor-pointer gap-2 rounded-lg">
                                    <Plus className="w-3.5 h-3.5" /> Create Group
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsJoinGroupOpen(true)} className="cursor-pointer gap-2 rounded-lg">
                                    <Hash className="w-3.5 h-3.5" /> Join Group
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex bg-[#F1F3F4] dark:bg-muted p-1 rounded-full border border-[#E8EAED] dark:border-border">
                            <button
                                onClick={() => setLeaderboardType('daily')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                                    leaderboardType === 'daily'
                                        ? 'bg-white dark:bg-card text-[#202124] dark:text-foreground shadow-sm'
                                        : 'text-[#5F6368] dark:text-muted-foreground hover:text-[#202124] dark:hover:text-foreground'
                                }`}
                            >
                                Daily
                            </button>
                            <button
                                onClick={() => setLeaderboardType('allTime')}
                                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                                    leaderboardType === 'allTime'
                                        ? 'bg-white dark:bg-card text-[#202124] dark:text-foreground shadow-sm'
                                        : 'text-[#5F6368] dark:text-muted-foreground hover:text-[#202124] dark:hover:text-foreground'
                                }`}
                            >
                                All Time
                            </button>
                        </div>
                        {leaderboardData && (
                            <span className="text-[11px] text-[#5F6368] dark:text-muted-foreground hidden sm:inline">
                                Updated {new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        )}
                    </div>
                </div>

                {activeGroup && (
                    <div className="flex items-center gap-2 mb-4 animate-in fade-in duration-300">
                        <div
                            className="flex items-center gap-1.5 text-xs bg-[#D2E3FC]/40 dark:bg-[#4285F4]/10 px-3 py-1.5 rounded-full border border-[#4285F4]/20 cursor-pointer hover:border-[#4285F4]/40 transition-colors"
                            onClick={() => {
                                navigator.clipboard.writeText(activeGroup.code);
                                toast.success('Code copied!');
                            }}
                        >
                            <span className="font-mono font-semibold text-[#174EA6] dark:text-[#8AB4F8] tracking-wider">{activeGroup.code}</span>
                            <Copy className="w-3 h-3 text-[#4285F4]/60" />
                        </div>
                        <button
                            onClick={() => handleShareGroup(activeGroup)}
                            className="flex items-center gap-1.5 text-xs text-[#4285F4] hover:text-[#174EA6] dark:hover:text-[#8AB4F8] transition-colors px-2 py-1.5 rounded-full hover:bg-[#D2E3FC]/30"
                        >
                            <Share2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Share</span>
                        </button>
                        <button
                            onClick={() => setGroupToLeave(activeGroup)}
                            className="flex items-center text-xs text-[#5F6368] hover:text-[#EA4335] transition-colors px-2 py-1.5 rounded-full hover:bg-[#FAD2CF]/30 dark:hover:bg-red-900/20"
                        >
                            <LogOut className="w-3 h-3" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-8 bg-white dark:bg-card rounded-2xl border border-[#E8EAED] dark:border-border overflow-hidden">

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
                                <div className="px-5 md:px-8 py-3.5 border-b border-[#E8EAED] dark:border-border flex items-center gap-4 md:gap-6">
                                    <div className="w-10 shrink-0 text-center">
                                        <span className="text-xs font-medium text-[#5F6368] dark:text-muted-foreground">#</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium text-[#5F6368] dark:text-muted-foreground">User</span>
                                    </div>
                                    <div className="flex gap-6 md:gap-8 items-center shrink-0">
                                        <div className="hidden lg:block w-14 text-center">
                                            <span className="text-xs font-medium text-[#5F6368] dark:text-muted-foreground">Streak</span>
                                        </div>
                                        <div className="w-16 md:w-20 text-right">
                                            <span className="text-xs font-medium text-[#E37400]">LeetCode</span>
                                        </div>
                                        <div className="w-16 md:w-20 text-right">
                                            <span className="text-xs font-medium text-[#34A853]">GFG</span>
                                        </div>
                                        <div className="w-16 md:w-20 text-right">
                                            <span className="text-xs font-medium text-[#5F6368] dark:text-muted-foreground">Today</span>
                                        </div>
                                    </div>
                                </div>
                                <motion.div
                                    key={`leaderboard-${activeGroup?.code ?? 'global'}-${leaderboardType}`}
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
                                            rank={index + 1}
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

            {/* Leave Group Confirmation Dialog */}
            <Dialog open={!!groupToLeave} onOpenChange={(open) => !open && setGroupToLeave(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">
                            {groupToLeave?.isOwner ? 'Delete Group?' : 'Leave Group?'}
                        </DialogTitle>
                        <DialogDescription>
                            {groupToLeave?.isOwner
                                ? `You are the owner of "${groupToLeave?.name}". Since you're the only member, leaving will delete the group permanently.`
                                : `Are you sure you want to leave "${groupToLeave?.name}"? You can rejoin later with the group code.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setGroupToLeave(null)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => groupToLeave && leaveGroupMutation.mutate(groupToLeave.id)}
                            disabled={leaveGroupMutation.isPending}
                        >
                            {leaveGroupMutation.isPending ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{groupToLeave?.isOwner ? 'Deleting...' : 'Leaving...'}</>
                            ) : (
                                groupToLeave?.isOwner ? 'Delete Group' : 'Leave Group'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <PWAInstallPrompt />
        </div>
    );
}
