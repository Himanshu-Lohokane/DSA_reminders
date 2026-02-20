"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, LogOut, Plus, Hash, Copy, Settings, Share2, ExternalLink } from "lucide-react";
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

    // Neetcode 150 - Curated problem list
    const problemSuggestions = [
        // Arrays & Hashing
        { title: "Contains Duplicate", slug: "contains-duplicate", difficulty: "Easy" },
        { title: "Valid Anagram", slug: "valid-anagram", difficulty: "Easy" },
        { title: "Two Sum", slug: "two-sum", difficulty: "Easy" },
        { title: "Group Anagrams", slug: "group-anagrams", difficulty: "Medium" },
        { title: "Top K Frequent Elements", slug: "top-k-frequent-elements", difficulty: "Medium" },
        { title: "Product of Array Except Self", slug: "product-of-array-except-self", difficulty: "Medium" },
        { title: "Valid Sudoku", slug: "valid-sudoku", difficulty: "Medium" },
        { title: "Encode and Decode Strings", slug: "encode-and-decode-strings", difficulty: "Medium" },
        { title: "Longest Consecutive Sequence", slug: "longest-consecutive-sequence", difficulty: "Medium" },
        
        // Two Pointers
        { title: "Valid Palindrome", slug: "valid-palindrome", difficulty: "Easy" },
        { title: "Two Sum II", slug: "two-sum-ii-input-array-is-sorted", difficulty: "Medium" },
        { title: "3Sum", slug: "3sum", difficulty: "Medium" },
        { title: "Container With Most Water", slug: "container-with-most-water", difficulty: "Medium" },
        { title: "Trapping Rain Water", slug: "trapping-rain-water", difficulty: "Hard" },
        
        // Sliding Window
        { title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock", difficulty: "Easy" },
        { title: "Longest Substring Without Repeating Characters", slug: "longest-substring-without-repeating-characters", difficulty: "Medium" },
        { title: "Longest Repeating Character Replacement", slug: "longest-repeating-character-replacement", difficulty: "Medium" },
        { title: "Permutation in String", slug: "permutation-in-string", difficulty: "Medium" },
        { title: "Minimum Window Substring", slug: "minimum-window-substring", difficulty: "Hard" },
        { title: "Sliding Window Maximum", slug: "sliding-window-maximum", difficulty: "Hard" },
        
        // Stack
        { title: "Valid Parentheses", slug: "valid-parentheses", difficulty: "Easy" },
        { title: "Min Stack", slug: "min-stack", difficulty: "Medium" },
        { title: "Evaluate Reverse Polish Notation", slug: "evaluate-reverse-polish-notation", difficulty: "Medium" },
        { title: "Generate Parentheses", slug: "generate-parentheses", difficulty: "Medium" },
        { title: "Daily Temperatures", slug: "daily-temperatures", difficulty: "Medium" },
        { title: "Car Fleet", slug: "car-fleet", difficulty: "Medium" },
        { title: "Largest Rectangle in Histogram", slug: "largest-rectangle-in-histogram", difficulty: "Hard" },
        
        // Binary Search
        { title: "Binary Search", slug: "binary-search", difficulty: "Easy" },
        { title: "Search a 2D Matrix", slug: "search-a-2d-matrix", difficulty: "Medium" },
        { title: "Koko Eating Bananas", slug: "koko-eating-bananas", difficulty: "Medium" },
        { title: "Find Minimum in Rotated Sorted Array", slug: "find-minimum-in-rotated-sorted-array", difficulty: "Medium" },
        { title: "Search in Rotated Sorted Array", slug: "search-in-rotated-sorted-array", difficulty: "Medium" },
        { title: "Time Based Key-Value Store", slug: "time-based-key-value-store", difficulty: "Medium" },
        { title: "Median of Two Sorted Arrays", slug: "median-of-two-sorted-arrays", difficulty: "Hard" },
        
        // Linked List
        { title: "Reverse Linked List", slug: "reverse-linked-list", difficulty: "Easy" },
        { title: "Merge Two Sorted Lists", slug: "merge-two-sorted-lists", difficulty: "Easy" },
        { title: "Reorder List", slug: "reorder-list", difficulty: "Medium" },
        { title: "Remove Nth Node From End of List", slug: "remove-nth-node-from-end-of-list", difficulty: "Medium" },
        { title: "Copy List with Random Pointer", slug: "copy-list-with-random-pointer", difficulty: "Medium" },
        { title: "Add Two Numbers", slug: "add-two-numbers", difficulty: "Medium" },
        { title: "Linked List Cycle", slug: "linked-list-cycle", difficulty: "Easy" },
        { title: "Find the Duplicate Number", slug: "find-the-duplicate-number", difficulty: "Medium" },
        { title: "LRU Cache", slug: "lru-cache", difficulty: "Medium" },
        { title: "Merge k Sorted Lists", slug: "merge-k-sorted-lists", difficulty: "Hard" },
        { title: "Reverse Nodes in k-Group", slug: "reverse-nodes-in-k-group", difficulty: "Hard" },
        
        // Trees
        { title: "Invert Binary Tree", slug: "invert-binary-tree", difficulty: "Easy" },
        { title: "Maximum Depth of Binary Tree", slug: "maximum-depth-of-binary-tree", difficulty: "Easy" },
        { title: "Diameter of Binary Tree", slug: "diameter-of-binary-tree", difficulty: "Easy" },
        { title: "Balanced Binary Tree", slug: "balanced-binary-tree", difficulty: "Easy" },
        { title: "Same Tree", slug: "same-tree", difficulty: "Easy" },
        { title: "Subtree of Another Tree", slug: "subtree-of-another-tree", difficulty: "Easy" },
        { title: "Lowest Common Ancestor of a Binary Search Tree", slug: "lowest-common-ancestor-of-a-binary-search-tree", difficulty: "Medium" },
        { title: "Binary Tree Level Order Traversal", slug: "binary-tree-level-order-traversal", difficulty: "Medium" },
        { title: "Binary Tree Right Side View", slug: "binary-tree-right-side-view", difficulty: "Medium" },
        { title: "Count Good Nodes in Binary Tree", slug: "count-good-nodes-in-binary-tree", difficulty: "Medium" },
        { title: "Validate Binary Search Tree", slug: "validate-binary-search-tree", difficulty: "Medium" },
        { title: "Kth Smallest Element in a BST", slug: "kth-smallest-element-in-a-bst", difficulty: "Medium" },
        { title: "Construct Binary Tree from Preorder and Inorder Traversal", slug: "construct-binary-tree-from-preorder-and-inorder-traversal", difficulty: "Medium" },
        { title: "Binary Tree Maximum Path Sum", slug: "binary-tree-maximum-path-sum", difficulty: "Hard" },
        { title: "Serialize and Deserialize Binary Tree", slug: "serialize-and-deserialize-binary-tree", difficulty: "Hard" },
        
        // Tries
        { title: "Implement Trie", slug: "implement-trie-prefix-tree", difficulty: "Medium" },
        { title: "Design Add and Search Words Data Structure", slug: "design-add-and-search-words-data-structure", difficulty: "Medium" },
        { title: "Word Search II", slug: "word-search-ii", difficulty: "Hard" },
        
        // Heap / Priority Queue
        { title: "Kth Largest Element in a Stream", slug: "kth-largest-element-in-a-stream", difficulty: "Easy" },
        { title: "Last Stone Weight", slug: "last-stone-weight", difficulty: "Easy" },
        { title: "K Closest Points to Origin", slug: "k-closest-points-to-origin", difficulty: "Medium" },
        { title: "Kth Largest Element in an Array", slug: "kth-largest-element-in-an-array", difficulty: "Medium" },
        { title: "Task Scheduler", slug: "task-scheduler", difficulty: "Medium" },
        { title: "Design Twitter", slug: "design-twitter", difficulty: "Medium" },
        { title: "Find Median from Data Stream", slug: "find-median-from-data-stream", difficulty: "Hard" },
        
        // Backtracking
        { title: "Subsets", slug: "subsets", difficulty: "Medium" },
        { title: "Combination Sum", slug: "combination-sum", difficulty: "Medium" },
        { title: "Permutations", slug: "permutations", difficulty: "Medium" },
        { title: "Subsets II", slug: "subsets-ii", difficulty: "Medium" },
        { title: "Combination Sum II", slug: "combination-sum-ii", difficulty: "Medium" },
        { title: "Word Search", slug: "word-search", difficulty: "Medium" },
        { title: "Palindrome Partitioning", slug: "palindrome-partitioning", difficulty: "Medium" },
        { title: "Letter Combinations of a Phone Number", slug: "letter-combinations-of-a-phone-number", difficulty: "Medium" },
        { title: "N-Queens", slug: "n-queens", difficulty: "Hard" },
        
        // Graphs
        { title: "Number of Islands", slug: "number-of-islands", difficulty: "Medium" },
        { title: "Clone Graph", slug: "clone-graph", difficulty: "Medium" },
        { title: "Max Area of Island", slug: "max-area-of-island", difficulty: "Medium" },
        { title: "Pacific Atlantic Water Flow", slug: "pacific-atlantic-water-flow", difficulty: "Medium" },
        { title: "Surrounded Regions", slug: "surrounded-regions", difficulty: "Medium" },
        { title: "Rotting Oranges", slug: "rotting-oranges", difficulty: "Medium" },
        { title: "Walls and Gates", slug: "walls-and-gates", difficulty: "Medium" },
        { title: "Course Schedule", slug: "course-schedule", difficulty: "Medium" },
        { title: "Course Schedule II", slug: "course-schedule-ii", difficulty: "Medium" },
        { title: "Redundant Connection", slug: "redundant-connection", difficulty: "Medium" },
        { title: "Number of Connected Components in an Undirected Graph", slug: "number-of-connected-components-in-an-undirected-graph", difficulty: "Medium" },
        { title: "Graph Valid Tree", slug: "graph-valid-tree", difficulty: "Medium" },
        { title: "Word Ladder", slug: "word-ladder", difficulty: "Hard" },
        
        // Advanced Graphs
        { title: "Reconstruct Itinerary", slug: "reconstruct-itinerary", difficulty: "Hard" },
        { title: "Min Cost to Connect All Points", slug: "min-cost-to-connect-all-points", difficulty: "Medium" },
        { title: "Network Delay Time", slug: "network-delay-time", difficulty: "Medium" },
        { title: "Swim in Rising Water", slug: "swim-in-rising-water", difficulty: "Hard" },
        { title: "Alien Dictionary", slug: "alien-dictionary", difficulty: "Hard" },
        { title: "Cheapest Flights Within K Stops", slug: "cheapest-flights-within-k-stops", difficulty: "Medium" },
        
        // 1-D Dynamic Programming
        { title: "Climbing Stairs", slug: "climbing-stairs", difficulty: "Easy" },
        { title: "Min Cost Climbing Stairs", slug: "min-cost-climbing-stairs", difficulty: "Easy" },
        { title: "House Robber", slug: "house-robber", difficulty: "Medium" },
        { title: "House Robber II", slug: "house-robber-ii", difficulty: "Medium" },
        { title: "Longest Palindromic Substring", slug: "longest-palindromic-substring", difficulty: "Medium" },
        { title: "Palindromic Substrings", slug: "palindromic-substrings", difficulty: "Medium" },
        { title: "Decode Ways", slug: "decode-ways", difficulty: "Medium" },
        { title: "Coin Change", slug: "coin-change", difficulty: "Medium" },
        { title: "Maximum Product Subarray", slug: "maximum-product-subarray", difficulty: "Medium" },
        { title: "Word Break", slug: "word-break", difficulty: "Medium" },
        { title: "Longest Increasing Subsequence", slug: "longest-increasing-subsequence", difficulty: "Medium" },
        { title: "Partition Equal Subset Sum", slug: "partition-equal-subset-sum", difficulty: "Medium" },
        
        // 2-D Dynamic Programming
        { title: "Unique Paths", slug: "unique-paths", difficulty: "Medium" },
        { title: "Longest Common Subsequence", slug: "longest-common-subsequence", difficulty: "Medium" },
        { title: "Best Time to Buy and Sell Stock with Cooldown", slug: "best-time-to-buy-and-sell-stock-with-cooldown", difficulty: "Medium" },
        { title: "Coin Change II", slug: "coin-change-ii", difficulty: "Medium" },
        { title: "Target Sum", slug: "target-sum", difficulty: "Medium" },
        { title: "Interleaving String", slug: "interleaving-string", difficulty: "Medium" },
        { title: "Longest Increasing Path in a Matrix", slug: "longest-increasing-path-in-a-matrix", difficulty: "Hard" },
        { title: "Distinct Subsequences", slug: "distinct-subsequences", difficulty: "Hard" },
        { title: "Edit Distance", slug: "edit-distance", difficulty: "Medium" },
        { title: "Burst Balloons", slug: "burst-balloons", difficulty: "Hard" },
        { title: "Regular Expression Matching", slug: "regular-expression-matching", difficulty: "Hard" },
        
        // Greedy
        { title: "Maximum Subarray", slug: "maximum-subarray", difficulty: "Medium" },
        { title: "Jump Game", slug: "jump-game", difficulty: "Medium" },
        { title: "Jump Game II", slug: "jump-game-ii", difficulty: "Medium" },
        { title: "Gas Station", slug: "gas-station", difficulty: "Medium" },
        { title: "Hand of Straights", slug: "hand-of-straights", difficulty: "Medium" },
        { title: "Merge Triplets to Form Target Triplet", slug: "merge-triplets-to-form-target-triplet", difficulty: "Medium" },
        { title: "Partition Labels", slug: "partition-labels", difficulty: "Medium" },
        { title: "Valid Parenthesis String", slug: "valid-parenthesis-string", difficulty: "Medium" },
        
        // Intervals
        { title: "Insert Interval", slug: "insert-interval", difficulty: "Medium" },
        { title: "Merge Intervals", slug: "merge-intervals", difficulty: "Medium" },
        { title: "Non-overlapping Intervals", slug: "non-overlapping-intervals", difficulty: "Medium" },
        { title: "Meeting Rooms", slug: "meeting-rooms", difficulty: "Easy" },
        { title: "Meeting Rooms II", slug: "meeting-rooms-ii", difficulty: "Medium" },
        { title: "Minimum Interval to Include Each Query", slug: "minimum-interval-to-include-each-query", difficulty: "Hard" },
        
        // Math & Geometry
        { title: "Rotate Image", slug: "rotate-image", difficulty: "Medium" },
        { title: "Spiral Matrix", slug: "spiral-matrix", difficulty: "Medium" },
        { title: "Set Matrix Zeroes", slug: "set-matrix-zeroes", difficulty: "Medium" },
        { title: "Happy Number", slug: "happy-number", difficulty: "Easy" },
        { title: "Plus One", slug: "plus-one", difficulty: "Easy" },
        { title: "Pow(x, n)", slug: "powx-n", difficulty: "Medium" },
        { title: "Multiply Strings", slug: "multiply-strings", difficulty: "Medium" },
        { title: "Detect Squares", slug: "detect-squares", difficulty: "Medium" },
        
        // Bit Manipulation
        { title: "Single Number", slug: "single-number", difficulty: "Easy" },
        { title: "Number of 1 Bits", slug: "number-of-1-bits", difficulty: "Easy" },
        { title: "Counting Bits", slug: "counting-bits", difficulty: "Easy" },
        { title: "Reverse Bits", slug: "reverse-bits", difficulty: "Easy" },
        { title: "Missing Number", slug: "missing-number", difficulty: "Easy" },
        { title: "Sum of Two Integers", slug: "sum-of-two-integers", difficulty: "Medium" },
        { title: "Reverse Integer", slug: "reverse-integer", difficulty: "Medium" }
    ];

    const [dailyProblem] = useState(() => {
        // Use day of year (1-365) for clean rotation through all 150 problems
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now.getTime() - start.getTime();
        const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
        return problemSuggestions[dayOfYear % problemSuggestions.length];
    });

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
                {/* Greeting & Daily Challenge */}
                <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F1F3F4] dark:bg-muted shrink-0 ring-2 ring-[#E8EAED] dark:ring-border">
                            {currentUserEntry?.avatar ? (
                                <img src={currentUserEntry.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#5F6368] dark:text-muted-foreground text-lg font-medium">
                                    {user?.name?.charAt(0)}
                                </div>
                            )}
                        </div>
                        
                        {/* Greeting & Problem */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-lg font-medium text-[#202124] dark:text-white leading-none">
                                Hey, {user?.name?.split(' ')[0]}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-[#5F6368] dark:text-muted-foreground -mt-2">
                                <span>Today's challenge:</span>
                                <a 
                                    href={`https://leetcode.com/problems/${dailyProblem.slug}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[#4285F4] dark:text-[#8AB4F8] hover:underline font-medium"
                                >
                                    {dailyProblem.title}
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                    dailyProblem.difficulty === 'Easy' ? 'bg-[#CEEAD6] text-[#0D652D]' :
                                    dailyProblem.difficulty === 'Medium' ? 'bg-[#FEEFC3] text-[#E37400]' :
                                    'bg-[#FAD2CF] text-[#A50E0E]'
                                }`}>
                                    {dailyProblem.difficulty}
                                </span>
                            </div>
                        </div>
                    </div>
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
