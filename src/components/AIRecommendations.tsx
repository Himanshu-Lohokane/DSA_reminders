"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { authenticatedFetch } from "@/lib/api";
import { 
    RefreshCw, 
    ExternalLink, 
    Target,
    BookOpen
} from "lucide-react";

interface Recommendation {
    problemTitle: string;
    problemUrl: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    reason: string;
    confidence: number;
    aiGenerated: boolean;
}

interface AIRecommendationsData {
    recommendations: Recommendation[];
    message: string;
}

export default function AIRecommendations() {
    const { user, token, refreshToken } = useAuth();
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const fetchRecommendations = async () => {
        if (!user || !token) return;
        
        setIsLoading(true);
        try {
            const response = await authenticatedFetch(
                "/api/ai/recommendations",
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                },
                refreshToken
            );
            
            if (response.ok) {
                const data: AIRecommendationsData = await response.json();
                setRecommendations(data.recommendations || []);
                setHasLoaded(true);
            } else {
                console.error("Failed to fetch recommendations");
            }
        } catch (error) {
            console.error("Error fetching recommendations:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    // Match ActivityFeed empty state
    if (!hasLoaded && !isLoading) {
        return (
            <div className="bg-white dark:bg-card rounded-2xl border border-[#E8EAED] dark:border-border p-6 text-center">
                <Target className="h-5 w-5 text-[#9AA0A6] mx-auto mb-3" />
                <p className="text-sm text-[#5F6368] dark:text-muted-foreground mb-4">
                    Get personalized gap analysis
                </p>
                <Button
                    onClick={fetchRecommendations}
                    size="sm"
                    className="bg-[#4285F4] text-white hover:bg-[#174EA6] h-8"
                >
                    Analyze Progress
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card rounded-2xl border border-[#E8EAED] dark:border-border p-5 relative">
            <h3 className="text-[11px] font-medium text-[#5F6368] dark:text-muted-foreground uppercase tracking-wider mb-4">
                Smart Insights
            </h3>
            <div className="absolute top-5 right-5">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchRecommendations}
                    disabled={isLoading}
                    className="text-[#5F6368] hover:text-[#202124] dark:text-muted-foreground dark:hover:text-foreground h-4 w-4 p-0 rounded-full hover:bg-transparent"
                >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            {recommendations.length > 0 ? (
                <div className="space-y-3">
                    {recommendations.map((rec, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex gap-3 px-3 py-2.5 rounded-xl hover:bg-[#F8F9FA] dark:hover:bg-muted/30 transition-colors group items-start"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#F1F3F4] dark:bg-muted flex items-center justify-center text-[#5F6368] dark:text-muted-foreground shrink-0 mt-0.5">
                                <Target className="h-4 w-4" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#202124] dark:text-foreground mb-1">
                                    <span className="font-medium text-[#5F6368] dark:text-muted-foreground whitespace-nowrap">{rec.category}:</span>
                                    <a
                                        href={rec.problemUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[#4285F4] dark:text-[#8AB4F8] hover:underline font-medium"
                                    >
                                        {rec.problemTitle}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                    <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded font-medium ${
                                        rec.difficulty === 'Easy' ? 'bg-[#CEEAD6] text-[#0D652D] dark:bg-[#81C995]/15 dark:text-[#81C995]' :
                                        rec.difficulty === 'Medium' ? 'bg-[#FEEFC3] text-[#E37400] dark:bg-[#FDD663]/15 dark:text-[#FDD663]' :
                                            'bg-[#FAD2CF] text-[#A50E0E] dark:bg-[#F28B82]/15 dark:text-[#F28B82]'
                                        }`}>
                                        {rec.difficulty}
                                    </span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-[#5F6368] dark:text-muted-foreground">
                                    {rec.reason.replace(/🚀|📈|🎯|[^\w\s,.!?-]/g, '').trim()}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : hasLoaded && !isLoading ? (
                <div className="text-center py-4">
                    <BookOpen className="h-5 w-5 text-[#9AA0A6] mx-auto mb-3" />
                    <p className="text-sm text-[#5F6368] dark:text-muted-foreground">
                        Solve more problems to get insights
                    </p>
                </div>
            ) : null}
        </div>
    );
}