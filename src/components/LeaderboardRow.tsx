"use client";

import { motion } from "framer-motion";
import { Trophy, Medal, Github, Linkedin } from "lucide-react";
import { LeaderboardEntry } from "@/types";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface LeaderboardRowProps {
    entry: LeaderboardEntry;
    rank: number;
    isCurrentUser: boolean;
}

export default function LeaderboardRow({ entry, rank, isCurrentUser }: LeaderboardRowProps) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
            }}
            className={`px-5 md:px-8 py-4 md:py-5 flex items-center gap-4 md:gap-6 transition-all duration-200 hover:bg-[#F8F9FA] dark:hover:bg-muted/30 relative border-b border-[#E8EAED]/60 dark:border-border last:border-0 ${isCurrentUser ? 'bg-[#D2E3FC]/20 dark:bg-[#4285F4]/5' : ''
                }`}
        >
            {/* Rank */}
            <div className="w-10 flex items-center justify-center shrink-0">
                {rank === 1 ? (
                    <Trophy className="w-6 h-6 text-[#FBBC04]" />
                ) : rank === 2 ? (
                    <Medal className="w-6 h-6 text-[#9AA0A6]" />
                ) : rank === 3 ? (
                    <Medal className="w-6 h-6 text-[#E37400]" />
                ) : (
                    <span className="text-base font-medium text-[#5F6368] dark:text-muted-foreground tabular-nums">{rank}</span>
                )}
            </div>

            {/* Avatar & User Info */}
            <div className="flex-1 flex items-center gap-4 min-w-0">
                <HoverCard openDelay={200}>
                    <HoverCardTrigger asChild>
                        <div className="relative shrink-0 cursor-pointer group/avatar">
                            <div className={`w-11 h-11 md:w-12 md:h-12 rounded-full overflow-hidden bg-[#F1F3F4] dark:bg-muted shrink-0 transition-all duration-200 group-hover/avatar:scale-105 ${isCurrentUser ? 'ring-2 ring-[#4285F4]/30' : ''
                                }`}>
                                {entry.avatar ? (
                                    <img src={entry.avatar} alt={entry.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#5F6368] dark:text-muted-foreground text-base font-medium">
                                        {entry.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                        </div>
                    </HoverCardTrigger>

                    <HoverCardContent className="w-72 p-0 overflow-hidden rounded-xl border border-[#E8EAED] dark:border-border shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] z-100" align="start">
                        <div className="px-5 pt-5 pb-2 bg-white dark:bg-card">
                            {/* Profile header */}
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F1F3F4] dark:bg-muted shrink-0">
                                    {entry.avatar ? (
                                        <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#5F6368] dark:text-muted-foreground text-lg font-medium">{entry.name.charAt(0)}</div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-medium text-[#202124] dark:text-foreground text-base truncate">{entry.name}</div>
                                    <a href={`https://leetcode.com/u/${entry.leetcodeUsername}`} target="_blank" rel="noopener noreferrer" className="text-[#4285F4] dark:text-[#8AB4F8] text-sm hover:underline">@{entry.leetcodeUsername}</a>
                                </div>
                            </div>

                            {/* Stats row */}
                            <div className="flex items-center justify-between py-3 px-1 border-y border-[#E8EAED] dark:border-border mb-4">
                                <div className="text-center">
                                    <div className="text-lg font-medium text-[#202124] dark:text-foreground">#{entry.ranking?.toLocaleString() || '—'}</div>
                                    <div className="text-[11px] text-[#5F6368] dark:text-muted-foreground">Rank</div>
                                </div>
                                <div className="w-px h-8 bg-[#E8EAED] dark:bg-border" />
                                <div className="text-center">
                                    <div className="text-lg font-medium text-[#202124] dark:text-foreground">{entry.totalProblems}</div>
                                    <div className="text-[11px] text-[#5F6368] dark:text-muted-foreground">Solved</div>
                                </div>
                                <div className="w-px h-8 bg-[#E8EAED] dark:bg-border" />
                                <div className="text-center">
                                    <div className="text-lg font-medium text-[#34A853]">+{entry.todayPoints}</div>
                                    <div className="text-[11px] text-[#5F6368] dark:text-muted-foreground">Today</div>
                                </div>
                                {entry.streak && entry.streak > 0 ? (
                                    <>
                                        <div className="w-px h-8 bg-[#E8EAED] dark:bg-border" />
                                        <div className="text-center">
                                            <div className="text-lg font-medium text-[#E37400]">{entry.streak}</div>
                                            <div className="text-[11px] text-[#5F6368] dark:text-muted-foreground">Streak</div>
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            {/* Problem breakdown — compact stacked bar */}
                            <div>
                                <div className="flex h-2 rounded-full overflow-hidden bg-[#F1F3F4] dark:bg-muted">
                                    {entry.easy ? <div className="bg-[#34A853] transition-all" style={{ width: `${(entry.easy / (entry.totalProblems || 1)) * 100}%` }} /> : null}
                                    {entry.medium ? <div className="bg-[#FBBC04] transition-all" style={{ width: `${(entry.medium / (entry.totalProblems || 1)) * 100}%` }} /> : null}
                                    {entry.hard ? <div className="bg-[#EA4335] transition-all" style={{ width: `${(entry.hard / (entry.totalProblems || 1)) * 100}%` }} /> : null}
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1 text-[11px] text-[#5F6368] dark:text-muted-foreground"><span className="w-2 h-2 rounded-full bg-[#34A853] inline-block" />{entry.easy || 0} Easy</span>
                                    <span className="flex items-center gap-1 text-[11px] text-[#5F6368] dark:text-muted-foreground"><span className="w-2 h-2 rounded-full bg-[#FBBC04] inline-block" />{entry.medium || 0} Med</span>
                                    <span className="flex items-center gap-1 text-[11px] text-[#5F6368] dark:text-muted-foreground"><span className="w-2 h-2 rounded-full bg-[#EA4335] inline-block" />{entry.hard || 0} Hard</span>
                                </div>
                            </div>

                            {/* Social links */}
                            {((entry.github && entry.github !== 'not-provided' && entry.github !== 'pending') || (entry.linkedin && entry.linkedin !== 'not-provided' && entry.linkedin !== 'pending')) && (
                                <div className="flex items-center gap-6 pt-2 pb-0 mt-2 border-t border-[#E8EAED] dark:border-border">
                                    {entry.github && entry.github !== 'not-provided' && entry.github !== 'pending' && (
                                        <a href={entry.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5F6368] hover:text-[#202124] dark:text-muted-foreground dark:hover:text-foreground transition-colors">
                                            <Github className="w-3.5 h-3.5" />
                                            <span>GitHub</span>
                                        </a>
                                    )}
                                    {entry.linkedin && entry.linkedin !== 'not-provided' && entry.linkedin !== 'pending' && (
                                        <a href={entry.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5F6368] hover:text-[#0077b5] dark:text-muted-foreground dark:hover:text-[#0077b5] transition-colors">
                                            <Linkedin className="w-3.5 h-3.5" />
                                            <span>LinkedIn</span>
                                        </a>
                                    )}
                                </div>
                            )}
                        </div>
                    </HoverCardContent>
                </HoverCard>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-[#202124] dark:text-foreground truncate">
                            {entry.name.split(' ')[0]}
                        </span>
                        {isCurrentUser && (
                            <span className="text-[10px] font-medium text-[#4285F4] dark:text-[#8AB4F8] bg-[#D2E3FC]/50 dark:bg-[#4285F4]/10 px-1.5 py-0.5 rounded">you</span>
                        )}
                    </div>
                    <span className="text-sm text-[#9AA0A6] dark:text-muted-foreground">@{entry.leetcodeUsername}</span>
                </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 md:gap-8 items-center shrink-0">
                <div className="hidden lg:block w-14 text-center">
                    {entry.streak && entry.streak > 0 ? (
                        <span className="text-base font-medium text-[#E37400] dark:text-orange-400">🔥 {entry.streak}</span>
                    ) : (
                        <span className="text-base text-[#9AA0A6]">—</span>
                    )}
                </div>

                <div className="w-16 md:w-24 text-right">
                    <span className="text-base font-medium text-[#202124] dark:text-foreground tabular-nums">
                        {entry.totalScore.toLocaleString()}
                    </span>
                </div>

                {/* GFG score column hidden — re-enable when GFG integration is fixed
                <div className="w-16 md:w-20 text-right">
                    <span className="text-base font-medium text-[#202124] dark:text-foreground tabular-nums">
                        {entry.gfgScore?.toLocaleString() || '—'}
                    </span>
                </div>
                */}

                <div className="w-16 md:w-20 text-right">
                    <span className={`text-base font-medium tabular-nums ${entry.todayPoints > 0 ? 'text-[#34A853]' : 'text-[#9AA0A6]'
                        }`}>
                        +{entry.todayPoints}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
