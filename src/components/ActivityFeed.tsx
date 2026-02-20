"use client";

import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { LeaderboardEntry, LeetCodeSubmission } from "@/types";
import { getTimeAgo } from "@/lib/utils";

interface ActivityFeedProps {
    entries: LeaderboardEntry[];
    activities?: FlattenedActivity[];
}

interface FlattenedActivity extends LeetCodeSubmission {
    userName: string;
    leetcodeUsername: string;
    avatar?: string;
}

export default function ActivityFeed({ entries, activities: providedActivities }: ActivityFeedProps) {
    const nowTs = Math.floor(Date.now() / 1000);
    const seventyTwoHoursAgo = nowTs - (3 * 24 * 60 * 60);

    // If activities are provided from the API (3rd party de-duplicated), use them.
    // Otherwise fallback to deriving from the current leaderboard entries.
    const activities: FlattenedActivity[] = (providedActivities || entries
        .flatMap(user => (user.recentProblems || []).map(problem => ({
            ...problem,
            userName: user.name,
            leetcodeUsername: user.leetcodeUsername,
            avatar: user.avatar
        }))))
        .filter((a: any) => Number(a.timestamp) >= seventyTwoHoursAgo)
        .sort((a: any, b: any) => Number(b.timestamp) - Number(a.timestamp))
        .slice(0, 30);

    if (activities.length === 0) {
        return (
            <div className="bg-white dark:bg-card rounded-2xl border border-[#E8EAED] dark:border-border p-6 text-center">
                <Terminal className="h-5 w-5 text-[#9AA0A6] mx-auto mb-3" />
                <p className="text-sm text-[#5F6368] dark:text-muted-foreground">No recent activity</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card rounded-2xl border border-[#E8EAED] dark:border-border p-5">
            <h3 className="text-[11px] font-medium text-[#5F6368] dark:text-muted-foreground uppercase tracking-wider mb-4">
                Recent Activity
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 no-scrollbar">
                {activities.map((activity, index) => (
                    <motion.div
                        key={`${activity.id}-${index}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8F9FA] dark:hover:bg-muted/30 transition-colors group"
                    >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#F1F3F4] dark:bg-muted shrink-0">
                            {activity.avatar ? (
                                <img src={activity.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#5F6368] text-xs font-medium">
                                    {activity.userName.charAt(0)}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-[#202124] dark:text-foreground truncate">
                                <span className="font-medium">{activity.userName.split(' ')[0]}</span>
                                {' '}solved{' '}
                                <a
                                    href={`https://leetcode.com/problems/${activity.titleSlug}/`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-[#4285F4] dark:text-[#8AB4F8] hover:underline"
                                >
                                    {activity.title}
                                </a>
                            </p>
                            <span className="text-[11px] text-[#9AA0A6] dark:text-muted-foreground">
                                {getTimeAgo(activity.timestamp)}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
