"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthContext';
import { Loader2, Trophy, Flame, Clock, Zap, CheckCircle2, ArrowRight, Code2, Bell, Target } from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface OnboardingStep {
    id: number;
    title: string;
    subtitle: string;
    icon: React.ReactNode;
}

const ROAST_LEVELS = [
    {
        id: 'mild',
        label: 'Mild',
        description: 'Gentle nudges',
        emoji: '😊',
        example: '"Hey there! Time for your daily problem."'
    },
    {
        id: 'medium',
        label: 'Medium',
        description: 'Friendly roasts',
        emoji: '😏',
        example: '"Still sleeping? Your rank is slipping!"'
    },
    {
        id: 'savage',
        label: 'Savage',
        description: 'No mercy',
        emoji: '💀',
        example: '"Your code is as broken as your commitment."'
    }
];

const totalSteps = 6;

export default function PremiumOnboarding() {
    const { user, token, updateUser } = useAuth();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [leetcodeStats, setLeetcodeStats] = useState<any>(null);

    const [formData, setFormData] = useState({
        leetcodeUsername: '',
        gfgUsername: '',
        phoneNumber: '',
        countryCode: '+91',
        github: '',
        linkedin: '',
        roastIntensity: 'medium' as 'mild' | 'medium' | 'savage',
        dailyGrindTime: '09:00', // Default to 9 AM
    });

    if (!user) return null;

    const validateLeetCode = async () => {
        if (!formData.leetcodeUsername) {
            toast.error('Enter your LeetCode username');
            return;
        }

        setIsValidating(true);
        try {
            // Call our API to validate and fetch stats
            const res = await fetch(`/api/leetcode/validate?username=${encodeURIComponent(formData.leetcodeUsername)}`);
            const data = await res.json();

            if (res.ok && data.exists) {
                setLeetcodeStats(data.stats);
                toast.success('LeetCode profile found!');
                setStep(2);
            } else {
                toast.error('LeetCode username not found. Try again.');
            }
        } catch (error) {
            console.error('Validation error:', error);
            toast.error('Could not validate. Check your username.');
        } finally {
            setIsValidating(false);
        }
    };

    const completeOnboarding = async () => {
        setIsSubmitting(true);
        try {
            const fullPhone = `${formData.countryCode}${formData.phoneNumber}`;

            const res = await fetch('/api/users/onboarding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    leetcodeUsername: formData.leetcodeUsername,
                    gfgUsername: formData.gfgUsername || undefined,
                    phoneNumber: fullPhone,
                    github: formData.github || undefined,
                    linkedin: formData.linkedin || undefined,
                    roastIntensity: formData.roastIntensity,
                    dailyGrindTime: formData.dailyGrindTime,
                    onboardingCompleted: true
                })
            });

            const data = await res.json();
            if (res.ok) {
                // Fire confetti
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                
                // Update local user state with completed onboarding
                updateUser({ ...data.user, onboardingCompleted: true, isProfileIncomplete: false });
                toast.success('Welcome to the Arena! 🔥');
                
                // Redirect to home after a brief delay to show confetti
                setTimeout(() => {
                    window.location.href = '/home';
                }, 1500);
            } else {
                toast.error(data.error || 'Something went wrong');
            }
        } catch (error) {
            toast.error('Failed to complete onboarding');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-20 h-20 mx-auto bg-linear-to-br from-[#4285F4] to-[#174EA6] rounded-3xl flex items-center justify-center">
                                <Code2 className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-[#202124] dark:text-white">Connect LeetCode</h2>
                            <p className="text-[#5F6368] dark:text-gray-400 max-w-sm mx-auto">
                                We need your LeetCode username to track your progress and show you on the leaderboard.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <input
                                type="text"
                                value={formData.leetcodeUsername}
                                onChange={(e) => {
                                    let value = e.target.value.trim();
                                    // Strip LeetCode URL if user pastes full link
                                    const urlMatch = value.match(/leetcode\.com\/u\/([^\/]+)/i);
                                    if (urlMatch) {
                                        value = urlMatch[1];
                                    }
                                    setFormData({ ...formData, leetcodeUsername: value });
                                }}
                                placeholder="your_leetcode_username"
                                className="w-full px-6 py-4 bg-[#F1F3F4] dark:bg-gray-800 border-2 border-transparent focus:border-[#4285F4] rounded-2xl text-lg font-medium outline-none transition-all"
                                onKeyDown={(e) => e.key === 'Enter' && validateLeetCode()}
                            />
                            <button
                                onClick={validateLeetCode}
                                disabled={isValidating || !formData.leetcodeUsername}
                                className="w-full bg-[#4285F4] hover:bg-[#174EA6] text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_4px_6px_-1px_rgba(66,133,244,0.3)]"
                            >
                                {isValidating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Validate Profile</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </div>

                        {leetcodeStats && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="grid grid-cols-3 gap-3 p-4 bg-[#CEEAD6] dark:bg-emerald-900/20 rounded-2xl"
                            >
                                <div className="text-center">
                                    <div className="text-2xl font-black text-[#34A853]">{leetcodeStats.totalSolved || 0}</div>
                                    <div className="text-xs text-[#0D652D] dark:text-emerald-400">Solved</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-[#FBBC04]">{leetcodeStats.ranking || '—'}</div>
                                    <div className="text-xs text-[#E37400]">Rank</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-black text-[#EA4335]">{leetcodeStats.streak || 0}</div>
                                    <div className="text-xs text-[#A50E0E]">Streak</div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-20 h-20 mx-auto bg-linear-to-br from-[#34A853] to-[#0D652D] rounded-3xl flex items-center justify-center">
                                <Bell className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-[#202124] dark:text-white">WhatsApp Accountability</h2>
                            <p className="text-[#5F6368] dark:text-gray-400 max-w-sm mx-auto">
                                Get daily reminders and roasts directly on WhatsApp. No escape! 😈
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <select
                                value={formData.countryCode}
                                onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                                className="w-28 px-4 py-4 bg-[#F1F3F4] dark:bg-gray-800 border-2 border-transparent focus:border-[#34A853] rounded-2xl font-medium outline-none"
                            >
                                <option value="+91">🇮🇳 +91</option>
                                <option value="+1">🇺🇸 +1</option>
                                <option value="+44">🇬🇧 +44</option>
                                <option value="+61">🇦🇺 +61</option>
                            </select>
                            <input
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value.replace(/\D/g, '') })}
                                placeholder="9876543210"
                                className="flex-1 px-6 py-4 bg-[#F1F3F4] dark:bg-gray-800 border-2 border-transparent focus:border-[#34A853] rounded-2xl text-lg font-medium outline-none"
                            />
                        </div>

                        <button
                            onClick={() => setStep(3)}
                            disabled={!formData.phoneNumber || formData.phoneNumber.length < 10}
                            className="w-full bg-[#34A853] hover:bg-[#0D652D] text-white font-bold py-4 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <span>Continue</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-20 h-20 mx-auto bg-linear-to-br from-[#EA4335] to-[#A50E0E] rounded-3xl flex items-center justify-center">
                                <Flame className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-[#202124] dark:text-white">Choose Your Pain</h2>
                            <p className="text-[#5F6368] dark:text-gray-400 max-w-sm mx-auto">
                                How hard should we roast you when you slack?
                            </p>
                        </div>

                        <div className="space-y-3">
                            {ROAST_LEVELS.map((level) => (
                                <button
                                    key={level.id}
                                    onClick={() => setFormData({ ...formData, roastIntensity: level.id as any })}
                                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${formData.roastIntensity === level.id
                                        ? 'border-[#EA4335] bg-[#FAD2CF] dark:bg-red-900/20'
                                        : 'border-[#E8EAED] dark:border-gray-700 hover:border-[#EA4335]/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl">{level.emoji}</span>
                                        <div className="flex-1">
                                            <div className="font-bold text-[#202124] dark:text-white">{level.label}</div>
                                            <div className="text-sm text-[#5F6368] dark:text-gray-400">{level.description}</div>
                                            <div className="text-xs text-[#5F6368] dark:text-gray-500 italic mt-1">{level.example}</div>
                                        </div>
                                        {formData.roastIntensity === level.id && (
                                            <CheckCircle2 className="w-6 h-6 text-[#EA4335]" />
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => setStep(4)}
                            className="w-full bg-[#EA4335] hover:bg-[#A50E0E] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            <span>Continue</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-20 h-20 mx-auto bg-linear-to-br from-[#FBBC04] to-[#E37400] rounded-3xl flex items-center justify-center">
                                <Clock className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-[#202124] dark:text-white">Daily Grind Time</h2>
                            <p className="text-[#5F6368] dark:text-gray-400 max-w-sm mx-auto">
                                When should we send your daily reminder?
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <input
                                type="time"
                                value={formData.dailyGrindTime}
                                onChange={(e) => setFormData({ ...formData, dailyGrindTime: e.target.value })}
                                className="px-8 py-6 bg-[#F1F3F4] dark:bg-gray-800 border-2 border-transparent focus:border-[#FBBC04] rounded-2xl text-2xl font-bold outline-none transition-all text-center min-w-[200px]"
                            />
                        </div>

                        <button
                            onClick={() => setStep(5)}
                            className="w-full bg-[#FBBC04] hover:bg-[#E37400] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            <span>Continue</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-3">
                            <div className="w-20 h-20 mx-auto bg-linear-to-br from-[#5F6368] to-[#202124] rounded-3xl flex items-center justify-center">
                                <Target className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-[#202124] dark:text-white">Coding Profiles</h2>
                            <p className="text-[#5F6368] dark:text-gray-400 max-w-sm mx-auto">
                                Optional: Add your GFG, GitHub and LinkedIn profiles
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#5F6368] dark:text-gray-400 mb-2">
                                    GeeksforGeeks Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.gfgUsername}
                                    onChange={(e) => setFormData({ ...formData, gfgUsername: e.target.value })}
                                    placeholder="e.g. gfg_username"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8EAED] dark:border-gray-700 focus:border-[#34A853] outline-none transition-all bg-white dark:bg-gray-800 text-[#202124] dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#5F6368] dark:text-gray-400 mb-2">
                                    GitHub Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.github}
                                    onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                                    placeholder="e.g. github_handle"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8EAED] dark:border-gray-700 focus:border-[#4285F4] outline-none transition-all bg-white dark:bg-gray-800 text-[#202124] dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-[#5F6368] dark:text-gray-400 mb-2">
                                    LinkedIn Username
                                </label>
                                <input
                                    type="text"
                                    value={formData.linkedin}
                                    onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                                    placeholder="e.g. linkedin_id"
                                    className="w-full px-4 py-3 rounded-xl border-2 border-[#E8EAED] dark:border-gray-700 focus:border-[#4285F4] outline-none transition-all bg-white dark:bg-gray-800 text-[#202124] dark:text-white"
                                />
                            </div>

                            <p className="text-xs text-[#5F6368] dark:text-gray-500 text-center">
                                You can skip this step or add these later in your profile
                            </p>
                        </div>

                        <button
                            onClick={() => setStep(6)}
                            className="w-full bg-[#5F6368] hover:bg-[#202124] text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                        >
                            <span>{formData.gfgUsername || formData.github || formData.linkedin ? 'Continue' : 'Skip'}</span>
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                );

            case 6:
                return (
                    <div className="space-y-6 text-center">
                        <div className="w-24 h-24 mx-auto bg-linear-to-br from-[#4285F4] to-[#EA4335] rounded-full flex items-center justify-center animate-pulse">
                            <Trophy className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-4xl font-black text-[#202124] dark:text-white">Enter the Arena</h2>
                        <p className="text-[#5F6368] dark:text-gray-400 text-lg max-w-md mx-auto">
                            You're all set. Time to prove yourself on the leaderboard. No excuses, no mercy.
                        </p>

                        <div className="bg-linear-to-br from-[#D2E3FC] to-[#CEEAD6] dark:from-blue-900/20 dark:to-emerald-900/20 rounded-2xl p-6 space-y-4 text-left">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#5F6368] dark:text-gray-400">LeetCode</span>
                                <span className="font-bold text-[#202124] dark:text-white">{formData.leetcodeUsername}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#5F6368] dark:text-gray-400">WhatsApp</span>
                                <span className="font-bold text-[#202124] dark:text-white">{formData.countryCode} {formData.phoneNumber}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#5F6368] dark:text-gray-400">Roast Level</span>
                                <span className="font-bold text-[#202124] dark:text-white capitalize">{formData.roastIntensity}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-[#5F6368] dark:text-gray-400">Daily Time</span>
                                <span className="font-bold text-[#202124] dark:text-white">{formData.dailyGrindTime}</span>
                            </div>
                        </div>

                        <button
                            onClick={completeOnboarding}
                            disabled={isSubmitting}
                            className="w-full bg-linear-to-r from-[#4285F4] to-[#EA4335] hover:opacity-90 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-[0_8px_16px_-4px_rgba(66,133,244,0.4)]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <Zap className="w-6 h-6" />
                                    <span>Start Grinding</span>
                                    <Target className="w-6 h-6" />
                                </>
                            )}
                        </button>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-xl">
            <div className="w-full max-w-2xl mx-4">
                {/* Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">Step {step} of {totalSteps}</span>
                        <span className="text-sm text-gray-400">{Math.round((step / totalSteps) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-linear-to-r from-[#4285F4] to-[#34A853]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(step / totalSteps) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>

                {/* Content Card */}
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-[#202124] rounded-3xl p-8 shadow-2xl"
                >
                    {renderStep()}
                </motion.div>

                {/* Skip Option (only on step 5) */}
                {step === 5 && (
                    <div className="text-center mt-4">
                        <button
                            onClick={() => setStep(6)}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Skip this step →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
