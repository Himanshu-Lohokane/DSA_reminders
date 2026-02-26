// Smart Gap Analysis for DSA Problem Recommendations  
// Data-driven approach - no AI needed for scalable, useful recommendations

interface UserPattern {
    userId: number;
    userStats: any;
    recentProblems: any[];
    currentLevel: 'beginner' | 'intermediate' | 'advanced';
}

interface Recommendation {
    problemTitle: string;
    problemUrl: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: string;
    reason: string;
    confidence: number;
    aiGenerated: boolean;
}

interface CategoryGap {
    category: string;
    solved: number;
    total: number;
    percentage: number;
    difficulty: string[];
    priority: 'high' | 'medium' | 'low';
}

// Core DSA Categories with expected problem distribution
const DSA_CATEGORIES = {
    'Arrays': { weight: 25, minProblems: 15, tags: ['array', 'two-sum', 'subarray'] },
    'Two Pointers': { weight: 8, minProblems: 8, tags: ['two-pointers', 'sliding-window'] },
    'Hash Table': { weight: 12, minProblems: 10, tags: ['hash-table', 'hashmap', 'dictionary'] },
    'Strings': { weight: 10, minProblems: 8, tags: ['string', 'substring', 'palindrome'] },
    'Linked List': { weight: 8, minProblems: 6, tags: ['linked-list', 'list-node'] },
    'Trees': { weight: 15, minProblems: 12, tags: ['tree', 'binary-tree', 'bst'] },
    'Dynamic Programming': { weight: 18, minProblems: 10, tags: ['dp', 'dynamic-programming', 'memoization'] },
    'Graphs': { weight: 12, minProblems: 8, tags: ['graph', 'dfs', 'bfs', 'topological-sort'] },
    'Sorting': { weight: 6, minProblems: 5, tags: ['sorting', 'merge-sort', 'quick-sort'] },
    'Binary Search': { weight: 8, minProblems: 6, tags: ['binary-search', 'search'] },
    'Backtracking': { weight: 6, minProblems: 4, tags: ['backtracking', 'recursion'] },
    'Greedy': { weight: 8, minProblems: 5, tags: ['greedy', 'optimization'] },
    'Stack': { weight: 8, minProblems: 6, tags: ['stack', 'monotonic-stack'] },
    'Heap': { weight: 6, minProblems: 4, tags: ['heap', 'priority-queue'] },
    'Bit Manipulation': { weight: 4, minProblems: 3, tags: ['bit-manipulation', 'bitwise'] },
};

// Problem database (in a real app, this would be from LeetCode API or database)
const PROBLEM_DATABASE = [
    {
        title: "Two Sum",
        url: "https://leetcode.com/problems/two-sum/",
        difficulty: "Easy",
        category: "Arrays",
        tags: ["hash-table", "array"],
        description: "Find two numbers that add up to target"
    },
    {
        title: "Longest Substring Without Repeating Characters", 
        url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        difficulty: "Medium",
        category: "String",
        tags: ["sliding-window", "hash-table"],
        description: "Find longest substring without repeating characters"
    },
    {
        title: "Binary Tree Inorder Traversal",
        url: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
        difficulty: "Easy", 
        category: "Trees",
        tags: ["tree", "traversal", "recursion"],
        description: "Traverse binary tree in inorder"
    },
    {
        title: "Coin Change",
        url: "https://leetcode.com/problems/coin-change/",
        difficulty: "Medium",
        category: "Dynamic Programming", 
        tags: ["dp", "optimization"],
        description: "Minimum coins to make change"
    },
    {
        title: "Course Schedule",
        url: "https://leetcode.com/problems/course-schedule/",
        difficulty: "Medium",
        category: "Graphs",
        tags: ["graph", "dfs", "topological-sort"],
        description: "Detect cycle in directed graph"
    }
];

export async function generatePersonalizedRecommendations(
    userPattern: UserPattern
): Promise<Recommendation[]> {
    try {
        console.log('🔍 Starting Gap Analysis for user:', userPattern.userId);
        
        // Step 1: Analyze user's category gaps
        const categoryGaps = analyzeCategoryGaps(userPattern);
        
        // Step 2: Generate targeted recommendations for biggest gaps
        const gapBasedRecommendations = generateGapRecommendations(categoryGaps, userPattern.currentLevel);
        
        // Step 3: Return top 3 recommendations with clear reasoning
        return gapBasedRecommendations.slice(0, 3);
        
    } catch (error) {
        console.error('❌ Gap analysis failed:', error);
        // Fallback to basic recommendations
        return getFallbackRecommendations(userPattern.currentLevel);
    }
}

function analyzeCategoryGaps(userPattern: UserPattern): CategoryGap[] {
    const { recentProblems, userStats } = userPattern;
    const totalSolved = userStats.total || 0;
    
    console.log('📊 Analyzing gaps from', totalSolved, 'total problems');
    
    // Count problems solved per category based on problem titles/tags
    const categoryCount: Record<string, number> = {};
    
    // Initialize all categories
    Object.keys(DSA_CATEGORIES).forEach(cat => {
        categoryCount[cat] = 0;
    });
    
    // Analyze recent problems and categorize them
    if (recentProblems?.length > 0) {
        recentProblems.forEach(problem => {
            const detectedCategory = detectProblemCategory(problem);
            if (detectedCategory) {
                categoryCount[detectedCategory]++;
            }
        });
    }
    
    // Calculate gaps for each category
    const gaps: CategoryGap[] = Object.entries(DSA_CATEGORIES).map(([category, config]) => {
        const solved = categoryCount[category];
        const expectedForLevel = Math.ceil(config.minProblems * getLevelMultiplier(userPattern.currentLevel));
        const percentage = totalSolved > 0 ? (solved / totalSolved) * 100 : 0;
        
        return {
            category,
            solved,
            total: expectedForLevel,
            percentage,
            difficulty: getDifficultyForCategory(category, userPattern.currentLevel),
            priority: calculatePriority(solved, expectedForLevel, config.weight)
        };
    });
    
    // Sort by priority (biggest gaps first)
    return gaps.sort((a, b) => {
        if (a.priority === b.priority) {
            return b.solved - a.solved; // Secondary sort by number solved  
        }
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

function detectProblemCategory(problem: any): string | null {
    const problemTitle = problem.title?.toLowerCase() || '';
    const problemTags = problem.tags || [];
    
    // Simple heuristic matching based on title keywords and tags  
    for (const [category, config] of Object.entries(DSA_CATEGORIES)) {
        const tags = config.tags || [];
        
        // Check if any category tags match problem tags or title
        const hasMatchingTag = tags.some(tag => 
            problemTags.includes(tag) || problemTitle.includes(tag.replace('-', ' '))
        );
        
        if (hasMatchingTag) {
            return category;
        }
    }
    
    // Fallback: try to detect from title keywords
    if (problemTitle.includes('array') || problemTitle.includes('sum')) return 'Arrays';
    if (problemTitle.includes('tree') || problemTitle.includes('binary')) return 'Trees';
    if (problemTitle.includes('graph') || problemTitle.includes('node')) return 'Graphs';
    if (problemTitle.includes('string') || problemTitle.includes('substring')) return 'Strings';
    if (problemTitle.includes('dynamic') || problemTitle.includes('dp')) return 'Dynamic Programming';
    
    return 'Arrays'; // Default fallback
}

function getLevelMultiplier(level: string): number {
    switch (level) {
        case 'beginner': return 0.4;     // 40% of expected problems
        case 'intermediate': return 0.7; // 70% of expected problems  
        case 'advanced': return 1.0;     // 100% of expected problems
        default: return 0.5;
    }
}

function getDifficultyForCategory(category: string, userLevel: string): string[] {
    if (userLevel === 'beginner') {
        return ['Easy'];
    } else if (userLevel === 'intermediate') {
        return ['Easy', 'Medium'];
    } else {
        // Advanced users should focus on harder problems
        return ['Medium', 'Hard'];
    }
}

function calculatePriority(solved: number, expected: number, weight: number): 'high' | 'medium' | 'low' {
    const completionRatio = solved / Math.max(expected, 1);
    const weightedScore = (1 - completionRatio) * weight;
    
    if (weightedScore > 15) return 'high';
    if (weightedScore > 8) return 'medium';
    return 'low';
}

function generateGapRecommendations(gaps: CategoryGap[], userLevel: string): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Take top 5 gap categories
    const topGaps = gaps.filter(gap => gap.priority === 'high').slice(0, 5);
    
    console.log('🎯 Top gaps found:', topGaps.map(g => `${g.category} (${g.solved}/${g.total})`));
    
    topGaps.forEach(gap => {
        const categoryProblems = PROBLEM_DATABASE.filter(p => 
            p.category === gap.category && gap.difficulty.includes(p.difficulty)
        );
        
        if (categoryProblems.length > 0) {
            // Pick a problem from this category
            const problem = categoryProblems[0]; // Could be randomized or based on difficulty progression
            
            recommendations.push({
                problemTitle: problem.title,
                problemUrl: problem.url, 
                difficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
                category: problem.category,
                reason: generateGapReason(gap),
                confidence: calculateConfidence(gap),
                aiGenerated: false
            });
        }
    });
    
    return recommendations;
}

function generateGapReason(gap: CategoryGap): string {
    const percentage = Math.round(gap.percentage);
    
    if (gap.solved === 0) {
        return `🚀 Start exploring ${gap.category}! You haven't solved any problems in this fundamental area yet.`;
    }
    
    if (gap.priority === 'high') {  
        return `📈 Major gap in ${gap.category} (only ${gap.solved}/${gap.total} problems, ${percentage}%). This is a core DSA topic you should focus on.`;
    }
    
    return `🎯 Strengthen your ${gap.category} skills (${gap.solved}/${gap.total} solved). Building expertise here will improve your overall problem-solving.`;
}

function calculateConfidence(gap: CategoryGap): number {
    // Higher confidence for bigger gaps in important categories
    const gapSize = Math.max(0, gap.total - gap.solved) / gap.total;
    return Math.min(0.95, 0.7 + (gapSize * 0.25));
}

function getFallbackRecommendations(userLevel: string): Recommendation[] {
    console.log('🔄 Using fallback recommendations for level:', userLevel);
    
    // Simple fallback based on user level
    const fallbackProblems = PROBLEM_DATABASE.filter(p => {
        if (userLevel === 'beginner') return p.difficulty === 'Easy';
        if (userLevel === 'intermediate') return ['Easy', 'Medium'].includes(p.difficulty);
        return true;
    }).slice(0, 3);
    
    return fallbackProblems.map(problem => ({
        problemTitle: problem.title,
        problemUrl: problem.url,
        difficulty: problem.difficulty as 'Easy' | 'Medium' | 'Hard',
        category: problem.category,
        reason: `Recommended ${problem.difficulty} problem for ${userLevel} level`,
        confidence: 0.6,
        aiGenerated: false
    }));
}

// Helper function for backward compatibility
function calculateUserLevel(userStats: any): 'beginner' | 'intermediate' | 'advanced' {
    const total = userStats.total || 0;
    const mediumHardCount = (userStats.medium || 0) + (userStats.hard || 0);
    
    if (total < 20) return 'beginner';
    if (total < 50 || mediumHardCount < 10) return 'intermediate';
    return 'advanced';
}