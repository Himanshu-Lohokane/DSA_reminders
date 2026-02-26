"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
    Trophy, 
    TrendingUp, 
    ArrowUpRight, 
    Zap, 
    BrainCircuit,
    Swords,
    Crown,
    Users
} from "lucide-react";
import { useAuth } from "./AuthContext";
import { LeaderboardEntry } from "@/types";

interface PeerStat {
    label: string;
    value: string;
    icon: any;
    color: string;
    bgColor: string;
    description: string;
}

export default function PeerComparison({ leaderboard }: { leaderboard: LeaderboardEntry[] }) {
    const { user } = useAuth();
    
    const stats = useMemo(() => {
        if (!user || !leaderboard.length) return [];

        // Filter out inactive users (0 problems solved) to skew data correctly
        const activeUsers = leaderboard.filter(u => u.totalProblems > 0);
        const currentUserEntry = activeUsers.find(u => u.name === user.name || u.email === user.email);
        
        if (!currentUserEntry) return [];

        const insights: PeerStat[] = [];
        
        // ------------------------------------------------------------------
        // Insight 1: "Rivalry" / Next Target
        // Find the user directly above the current user
        // ------------------------------------------------------------------
        const sortedByScore = [...activeUsers].sort((a, b) => b.totalScore - a.totalScore);
        const myRankIndex = sortedByScore.findIndex(u => u.id === currentUserEntry.id);
        
        if (myRankIndex > 0) {
            const rival = sortedByScore[myRankIndex - 1];
            const pointGap = rival.totalScore - currentUserEntry.totalScore;
            
            // Calculate what it takes to overtake
            // Assume: Hard=5, Medium=3, Easy=1 (approx)
            let overtakeStr = "";
            if (pointGap <= 3) overtakeStr = "1 Medium";
            else if (pointGap <= 5) overtakeStr = "1 Hard";
            else overtakeStr = `${Math.ceil(pointGap / 3)} Mediums`;

            insights.push({
                label: "Chase Down",
                value: `-${pointGap} pts`,
                icon: Swords,
                color: "text-[#D93025]", // Red for rivalry
                bgColor: "bg-[#FCE8E6] dark:bg-[#F28B82]/10",
                description: `Overtake ${rival.name.split(' ')[0]} by solving approx ${overtakeStr}.`
            });
        } else {
            // User is Rank 1
             insights.push({
                label: "Crown Holder",
                value: "Rank #1",
                icon: Crown,
                color: "text-[#F9AB00]",
                bgColor: "bg-[#FEF7E0] dark:bg-[#FDD663]/10",
                description: "You are leading the leaderboard. Don't let them catch you!"
            });
        }

        // ------------------------------------------------------------------
        // Insight 2: "Quality vs Quantity" (Hard Problem Ratio)
        // Compare user's hard/total ratio vs Top 10 users' avg ratio
        // ------------------------------------------------------------------
        const top10Count = Math.max(1, Math.ceil(activeUsers.length * 0.1));
        const top10Users = sortedByScore.slice(0, top10Count);
        
        const getHardRatio = (u: LeaderboardEntry) => (u.hard || 0) / (u.totalProblems || 1);
        const avgTop10HardRatio = top10Users.reduce((acc, u) => acc + getHardRatio(u), 0) / top10Users.length;
        const myHardRatio = getHardRatio(currentUserEntry);

        if (myHardRatio >= avgTop10HardRatio && currentUserEntry.totalProblems > 5) {
             insights.push({
                label: "Hard Hitter",
                value: "Elite",
                icon: BrainCircuit, // Brain for complex problems
                color: "text-[#9334E6]", // Purple for "Epiphany/Hard"
                bgColor: "bg-[#F3E8FD] dark:bg-[#AF5CF7]/10",
                description: "You solve more Hard problems relative to total solved than the top 10%."
            });
        } else if ((currentUserEntry.medium || 0) > (currentUserEntry.easy || 0)) {
             insights.push({
                label: "Growth Mindset",
                value: "Focusing Up",
                icon: TrendingUp,
                color: "text-[#188038]",
                bgColor: "bg-[#E6F4EA] dark:bg-[#81C995]/10",
                description: "You're prioritizing Medium problems over Easy ones. Great for growth."
            });
        } else {
             // If mostly easy problems
             const neededMediums = Math.ceil((currentUserEntry.easy || 0) * 0.5) - (currentUserEntry.medium || 0);
             if (neededMediums > 0) {
                 insights.push({
                    label: "Level Up",
                    value: "Too Easy?",
                    icon: ArrowUpRight,
                    color: "text-[#E37400]", // Orange warning
                    bgColor: "bg-[#FEF7E0] dark:bg-[#FDD663]/10",
                    description: `Try solving ${neededMediums} more Mediums to balance your skill profile.`
                });
             } else {
                 // Fallback
                  insights.push({
                    label: "Consistency",
                    value: "Steady",
                    icon: Zap,
                    color: "text-[#1967D2]",
                    bgColor: "bg-[#E8F0FE] dark:bg-[#8AB4F8]/10",
                    description: "You are building a solid foundation of solved problems."
                });
             }
        }

        // ------------------------------------------------------------------
        // Insight 3: "Efficiency" (Points per Problem)
        // Are they getting more points per solve than average?
        // ------------------------------------------------------------------
        const getPPS = (u: LeaderboardEntry) => u.totalProblems > 0 ? (u.totalScore / u.totalProblems) : 0;
        const avgPPS = activeUsers.reduce((acc, u) => acc + getPPS(u), 0) / activeUsers.length;
        const myPPS = getPPS(currentUserEntry);
        
        // Only show if deviation is significant
        if (myPPS > avgPPS * 1.1) {
             insights.push({
                label: "High Efficiency",
                value: `${myPPS.toFixed(1)} pts/q`,
                icon: Zap,
                color: "text-[#F9AB00]",
                bgColor: "bg-[#FEF7E0] dark:bg-[#FDD663]/10",
                description: "You earn more points per problem than peers. High impact solving."
            });
        } else if (leaderboard.length > 10) {
            // Fallback: Comparative Percentile (re-used but phased better)
             const percentile = Math.round(((activeUsers.length - (myRankIndex + 1)) / activeUsers.length) * 100);
             insights.push({
                label: "Standing",
                value: `Top ${Math.max(1, 100 - percentile)}%`,
                icon: Trophy,
                color: "text-[#1967D2]",
                bgColor: "bg-[#E8F0FE] dark:bg-[#8AB4F8]/10",
                description: `You are performing better than ${percentile}% of all active participants.`
            });
        } else {
             insights.push({
                label: "Community",
                value: "Member",
                icon: Users,
                color: "text-[#5F6368]",
                bgColor: "bg-[#F1F3F4] dark:bg-muted",
                description: `Compete with ${activeUsers.length} other coders to climb the ranks.`
            });
        }

        return insights;
    }, [user, leaderboard]);

    if (!stats.length) return null;

    return (
        <div className="bg-white dark:bg-card rounded-2xl border border-[#E8EAED] dark:border-border p-5 relative">
            <h3 className="text-[11px] font-medium text-[#5F6368] dark:text-muted-foreground uppercase tracking-wider mb-4">
                Peer Comparison
            </h3>
            
            <div className="space-y-3">
                {stats.map((stat, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8F9FA] dark:hover:bg-muted/30 transition-colors group items-start"
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${stat.bgColor}`}>
                             <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#202124] dark:text-foreground mb-1">
                                <span className="font-medium text-[#202124] dark:text-foreground">{stat.label}</span>
                                <span className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded font-medium ${stat.bgColor} ${stat.color}`}>
                                    {stat.value}
                                </span>
                            </div>
                            <p className="text-[11px] leading-relaxed text-[#5F6368] dark:text-muted-foreground">
                                {stat.description}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
