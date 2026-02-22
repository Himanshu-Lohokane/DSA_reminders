"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
    Loader2, ArrowLeft, Save, Phone, Github, Linkedin,
    Settings, Clock, Code2, CheckCircle2, AlertCircle,
    User, Bell, ExternalLink, Flame
} from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

const ROAST_LEVELS = [
    { id: 'mild', label: 'Mild 😊', description: 'Gentle nudges' },
    { id: 'medium', label: 'Medium 😏', description: 'Friendly roasts' },
    { id: 'savage', label: 'Savage 💀', description: 'No mercy' },
] as const;

export default function ProfilePage() {
    const { user, token, isLoading: authLoading, updateUser } = useAuth();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'info' | 'notifications' | 'platforms'>('info');

    // Form state
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [github, setGithub] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [gfgUsername, setGfgUsername] = useState("");
    const [dailyGrindTime, setDailyGrindTime] = useState("09:00");
    const [roastIntensity, setRoastIntensity] = useState<'mild' | 'medium' | 'savage'>('medium');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPhoneNumber(user.phoneNumber || "");

            const gh = user.github || "";
            setGithub(gh.includes('github.com/') ? gh.split('github.com/').pop() || "" : gh === 'pending' || gh === 'not-provided' ? "" : gh);

            const li = user.linkedin || "";
            setLinkedin(li.includes('linkedin.com/in/') ? li.split('linkedin.com/in/').pop() || "" : li || "");

            setGfgUsername(user.gfgUsername || "");
            setDailyGrindTime(user.dailyGrindTime || "09:00");
            setRoastIntensity(user.roastIntensity || 'medium');
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSaving(true);

        try {
            const res = await fetch("/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: name.trim(),
                    phoneNumber: phoneNumber.trim() || null,
                    github: github.trim(),
                    linkedin: linkedin.trim() || null,
                    gfgUsername: gfgUsername.trim() || null,
                    dailyGrindTime,
                    roastIntensity,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to update profile");
            }

            if (data.user) {
                updateUser({
                    name,
                    phoneNumber: phoneNumber.trim() || undefined,
                    github: github.trim(),
                    linkedin: linkedin.trim() || undefined,
                    gfgUsername: gfgUsername.trim() || undefined,
                    dailyGrindTime,
                    roastIntensity,
                });
            }

            setSuccess("Profile updated successfully!");
            setTimeout(() => setSuccess(null), 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] dark:bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-4 border-[#4285F4] border-t-transparent animate-spin" />
                    <p className="text-sm text-[#5F6368] dark:text-muted-foreground font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

    const SECTIONS = [
        { id: 'info', label: 'Personal Info', icon: User },
        { id: 'platforms', label: 'Platforms', icon: Code2 },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ] as const;

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-background text-[#202124] dark:text-foreground font-sans">

            {/* Toast Notifications */}
            <div className="fixed top-20 right-6 z-100 flex flex-col gap-3 pointer-events-none">
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: 60, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 30, scale: 0.95 }}
                            className="flex items-center gap-3 bg-white dark:bg-card text-[#EA4335] px-5 py-3.5 rounded-2xl shadow-xl border border-[#EA4335]/20 backdrop-blur-md pointer-events-auto"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span className="font-semibold text-sm">{error}</span>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div
                            initial={{ opacity: 0, x: 60, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 30, scale: 0.95 }}
                            className="flex items-center gap-3 bg-white dark:bg-card text-[#34A853] px-5 py-3.5 rounded-2xl shadow-xl border border-[#34A853]/20 backdrop-blur-md pointer-events-auto"
                        >
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span className="font-semibold text-sm">{success}</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Header */}
            <header className="fixed top-0 inset-x-0 bg-white/95 dark:bg-background/95 backdrop-blur-md z-50 border-b border-[#E8EAED]/60 dark:border-border">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/home')}
                            className="text-[#5F6368] dark:text-gray-400 hover:text-[#4285F4] dark:hover:text-[#8AB4F8] hover:bg-[#F1F3F4] dark:hover:bg-muted rounded-full h-9 px-3 gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline text-sm font-medium">Back</span>
                        </Button>
                        <div className="h-5 w-px bg-[#E8EAED] dark:bg-border" />
                        <div className="flex items-center gap-2.5">
                            <Image src="/logo.png" alt="DSA Grinders" width={28} height={28} className="object-contain" priority />
                            <span className="text-base font-semibold text-[#202124] dark:text-white hidden sm:inline">DSA Grinders</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <AnimatedThemeToggler className="h-8 w-8" />
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto pt-24 pb-16 px-4 sm:px-6">

                {/* Hero Section: Avatar + Name */}
                <motion.div
                    initial={{ opacity: 0, y: -16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="relative bg-white dark:bg-card rounded-3xl border border-[#E8EAED] dark:border-border p-6 md:p-8 overflow-hidden">
                        {/* Decorative blobs */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-[#4285F4]/5 dark:bg-[#4285F4]/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#34A853]/5 dark:bg-[#34A853]/10 rounded-full -ml-8 -mb-8 blur-2xl pointer-events-none" />

                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative">
                            {/* Avatar */}
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-linear-to-br from-[#4285F4] to-[#174EA6] flex items-center justify-center text-white text-2xl sm:text-3xl font-black shrink-0 shadow-lg shadow-[#4285F4]/20">
                                {initials}
                            </div>

                            <div className="text-center sm:text-left flex-1">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                    <h1 className="text-2xl md:text-3xl font-black text-[#202124] dark:text-white">{user.name}</h1>
                                    {user.onboardingCompleted && (
                                        <span className="inline-flex items-center gap-1 text-xs bg-[#CEEAD6] dark:bg-[#34A853]/15 text-[#0D652D] dark:text-[#34A853] font-bold px-2.5 py-1 rounded-full">
                                            <CheckCircle2 className="w-3 h-3" /> Verified
                                        </span>
                                    )}
                                </div>
                                <p className="text-[#5F6368] dark:text-muted-foreground text-sm mb-3">{user.email}</p>
                                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                    <a
                                        href={`https://leetcode.com/u/${user.leetcodeUsername}/`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs bg-[#FEE9CC] dark:bg-[#FBBC04]/10 text-[#E37400] dark:text-[#FBBC04] font-semibold px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
                                    >
                                        ⚡ @{user.leetcodeUsername}
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                    {user.gfgUsername && (
                                        <span className="inline-flex items-center gap-1.5 text-xs bg-[#CEEAD6] dark:bg-[#34A853]/10 text-[#0D652D] dark:text-[#34A853] font-semibold px-3 py-1.5 rounded-full">
                                            GFG @{user.gfgUsername}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Section Tabs */}
                <div className="flex gap-1 bg-white dark:bg-card rounded-2xl border border-[#E8EAED] dark:border-border p-1.5 mb-6">
                    {SECTIONS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveSection(id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${activeSection === id
                                ? 'bg-[#F1F3F4] dark:bg-muted text-[#202124] dark:text-foreground shadow-sm'
                                : 'text-[#5F6368] dark:text-muted-foreground hover:text-[#202124] dark:hover:text-foreground'
                                }`}
                        >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="hidden sm:inline">{label}</span>
                        </button>
                    ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <AnimatePresence mode="wait">

                        {/* Personal Info Section */}
                        {activeSection === 'info' && (
                            <motion.div
                                key="info"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-4"
                            >
                                <div className="bg-white dark:bg-card rounded-3xl border border-[#E8EAED] dark:border-border p-6 md:p-8 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-5 bg-[#4285F4] rounded-full" />
                                        <h2 className="font-bold text-[#202124] dark:text-white">Personal Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FieldGroup label="Full Name" htmlFor="name" icon={<User className="w-3.5 h-3.5" />}>
                                            <StyledInput
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="John Doe"
                                                required
                                                disabled={isSaving}
                                                accentColor="#4285F4"
                                            />
                                        </FieldGroup>

                                        <FieldGroup label="Email Address" htmlFor="email" locked>
                                            <StyledInput
                                                id="email"
                                                value={user.email}
                                                disabled
                                                className="opacity-60 cursor-not-allowed bg-[#F1F3F4] dark:bg-muted"
                                            />
                                        </FieldGroup>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Platforms Section */}
                        {activeSection === 'platforms' && (
                            <motion.div
                                key="platforms"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-4"
                            >
                                {/* LeetCode — locked */}
                                <div className="bg-linear-to-br from-[#E37400] to-[#A50E0E] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
                                    <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                                    <div className="flex items-start gap-3 relative">
                                        <div className="bg-white/15 p-2.5 rounded-2xl">
                                            <span className="text-xl">⚡</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-orange-100/60 text-[10px] font-bold uppercase tracking-widest mb-0.5">LeetCode (Locked)</p>
                                            <p className="text-xl font-black truncate">@{user.leetcodeUsername}</p>
                                            <p className="text-orange-100/70 text-xs mt-2 font-medium">Username cannot be changed — it ensures tracking consistency across the leaderboard.</p>
                                        </div>
                                        <a
                                            href={`https://leetcode.com/u/${user.leetcodeUsername}/`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 p-2 rounded-xl bg-white/15 hover:bg-white/25 transition-colors"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-card rounded-3xl border border-[#E8EAED] dark:border-border p-6 md:p-8 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-5 bg-[#34A853] rounded-full" />
                                        <h2 className="font-bold text-[#202124] dark:text-white">Coding & Social Profiles</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <FieldGroup label="GeeksforGeeks" htmlFor="gfgUsername" icon={<span className="text-[#34A853] font-black text-xs">GFG</span>}>
                                            <StyledInput
                                                id="gfgUsername"
                                                value={gfgUsername}
                                                onChange={(e) => setGfgUsername(e.target.value)}
                                                placeholder="gfg_username"
                                                disabled={isSaving}
                                                accentColor="#34A853"
                                            />
                                        </FieldGroup>

                                        <FieldGroup label="GitHub" htmlFor="github" icon={<Github className="w-3.5 h-3.5 text-[#202124] dark:text-white" />}>
                                            <StyledInput
                                                id="github"
                                                value={github}
                                                onChange={(e) => setGithub(e.target.value)}
                                                placeholder="github_handle"
                                                disabled={isSaving}
                                                accentColor="#4285F4"
                                            />
                                        </FieldGroup>

                                        <FieldGroup label="LinkedIn" htmlFor="linkedin" icon={<Linkedin className="w-3.5 h-3.5 text-[#0A66C2]" />}>
                                            <StyledInput
                                                id="linkedin"
                                                value={linkedin}
                                                onChange={(e) => setLinkedin(e.target.value)}
                                                placeholder="linkedin_handle"
                                                disabled={isSaving}
                                                accentColor="#0A66C2"
                                            />
                                        </FieldGroup>

                                        <FieldGroup label="WhatsApp Number" htmlFor="phoneNumber" icon={<Phone className="w-3.5 h-3.5 text-[#25D366]" />}>
                                            <StyledInput
                                                id="phoneNumber"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="+91 9876543210"
                                                disabled={isSaving}
                                                accentColor="#25D366"
                                            />
                                        </FieldGroup>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Notifications Section */}
                        {activeSection === 'notifications' && (
                            <motion.div
                                key="notifications"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-4"
                            >
                                {/* Daily Grind Time */}
                                <div className="bg-white dark:bg-card rounded-3xl border border-[#E8EAED] dark:border-border p-6 md:p-8 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-5 bg-[#FBBC04] rounded-full" />
                                        <h2 className="font-bold text-[#202124] dark:text-white">Daily Reminder</h2>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#FBBC04] to-[#E37400] flex items-center justify-center shadow-lg shadow-[#FBBC04]/20 shrink-0">
                                            <Clock className="w-9 h-9 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-[#202124] dark:text-white mb-1">Daily Grind Time</p>
                                            <p className="text-sm text-[#5F6368] dark:text-muted-foreground mb-3">When should we send your WhatsApp reminder? (Asia/Kolkata, 24h)</p>
                                            <input
                                                id="dailyGrindTime"
                                                type="time"
                                                value={dailyGrindTime}
                                                onChange={(e) => setDailyGrindTime(e.target.value)}
                                                disabled={isSaving}
                                                className="px-5 py-3 bg-[#F1F3F4] dark:bg-muted border-2 border-transparent focus:border-[#FBBC04] rounded-2xl text-lg font-bold outline-none transition-all text-center text-[#202124] dark:text-foreground disabled:opacity-60"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Roast Level */}
                                <div className="bg-white dark:bg-card rounded-3xl border border-[#E8EAED] dark:border-border p-6 md:p-8 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-5 bg-[#EA4335] rounded-full" />
                                        <h2 className="font-bold text-[#202124] dark:text-white">Roast Intensity</h2>
                                        <Flame className="w-4 h-4 text-[#EA4335]" />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {ROAST_LEVELS.map((level) => (
                                            <button
                                                key={level.id}
                                                type="button"
                                                onClick={() => setRoastIntensity(level.id)}
                                                disabled={isSaving}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all ${roastIntensity === level.id
                                                    ? 'border-[#EA4335] bg-[#FAD2CF]/50 dark:bg-[#EA4335]/10'
                                                    : 'border-[#E8EAED] dark:border-border hover:border-[#EA4335]/40 bg-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className="font-bold text-sm text-[#202124] dark:text-white">{level.label}</p>
                                                    {roastIntensity === level.id && <CheckCircle2 className="w-4 h-4 text-[#EA4335]" />}
                                                </div>
                                                <p className="text-xs text-[#5F6368] dark:text-muted-foreground">{level.description}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Save Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mt-6"
                    >
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full h-14 bg-[#202124] dark:bg-white hover:bg-black dark:hover:bg-gray-100 text-white dark:text-[#202124] font-bold rounded-2xl text-base shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-5 w-5" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </motion.div>
                </form>
            </main>
        </div>
    );
}

/* ============================================================
   Helper components
   ============================================================ */

function FieldGroup({
    label,
    htmlFor,
    icon,
    locked,
    children,
}: {
    label: string;
    htmlFor?: string;
    icon?: React.ReactNode;
    locked?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={htmlFor} className="flex items-center gap-1.5 text-xs font-bold text-[#5F6368] dark:text-muted-foreground uppercase tracking-widest ml-0.5">
                {icon}
                {label}
                {locked && <span className="text-[#9AA0A6] normal-case tracking-normal font-normal">(read-only)</span>}
            </Label>
            {children}
        </div>
    );
}

function StyledInput({
    accentColor,
    className = "",
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { accentColor?: string }) {
    return (
        <Input
            {...props}
            style={
                {
                    '--accent': accentColor || '#4285F4',
                } as React.CSSProperties
            }
            className={`h-13 px-5 bg-[#F1F3F4] dark:bg-muted border-2 border-transparent focus:border-accent focus:bg-white dark:focus:bg-card transition-all rounded-2xl text-base font-medium text-[#202124] dark:text-foreground placeholder:text-[#9AA0A6] dark:placeholder:text-muted-foreground/60 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 ${className}`}
        />
    );
}
