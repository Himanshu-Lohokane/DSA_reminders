"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowLeft, Save, Phone, Github, Linkedin, Settings, Clock } from "lucide-react";

export default function ProfilePage() {
    const { user, token, isLoading: authLoading, updateUser } = useAuth();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [github, setGithub] = useState("");
    const [linkedin, setLinkedin] = useState("");
    const [gfgUsername, setGfgUsername] = useState("");
    const [dailyGrindTime, setDailyGrindTime] = useState("09:00");

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setPhoneNumber(user.phoneNumber || "");

            // Strip domains for ease of editing
            const gh = user.github || "";
            setGithub(gh.includes('github.com/') ? gh.split('github.com/').pop() || "" : gh);

            const li = user.linkedin || "";
            setLinkedin(li.includes('linkedin.com/in/') ? li.split('linkedin.com/in/').pop() || "" : li);

            setGfgUsername(user.gfgUsername || "");
            setDailyGrindTime(user.dailyGrindTime || "09:00");
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
                });
            }

            setSuccess("Profile updated successfully!");

            setTimeout(() => {
                setSuccess(null);
            }, 3000);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
                <div className="max-w-[1200px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 md:gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/home')}
                            className="text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium rounded-full px-2 md:px-3"
                        >
                            <ArrowLeft className="h-4 w-4 md:mr-2" />
                            <span className="hidden md:inline">Back to Home</span>
                        </Button>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-2 md:gap-3">
                            <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain md:w-8 md:h-8" priority />
                            <span className="text-lg md:text-xl font-medium tracking-tight text-gray-500">
                                DSA <span className="text-gray-900 font-semibold">Grinders</span>
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1100px] mx-auto pt-24 pb-12 px-6">
                {/* Page Title & Breadcrumb */}
                <div className="mb-8 md:mb-12 animate-in fade-in slide-in-from-left-4 duration-700">
                    <div className="flex items-center gap-2 text-xs text-blue-600 font-bold uppercase tracking-widest mb-2">
                        <Settings className="w-4 h-4" />
                        Account Settings
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
                        Refine Your Profile
                    </h1>
                    <p className="text-base md:text-xl text-gray-500 font-medium max-w-xl">
                        Keep your coding handles and social profiles up to date to stay ahead in the grind.
                    </p>
                </div>

                {/* Action Feedback */}
                <div className="fixed top-20 right-6 z-100 flex flex-col gap-3 pointer-events-none">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                className="bg-red-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-red-400/20 backdrop-blur-md"
                            >
                                <div className="bg-white/20 p-1.5 rounded-lg">
                                    <span className="text-sm font-bold">!</span>
                                </div>
                                <span className="font-semibold text-sm">{error}</span>
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                className="bg-emerald-500 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-400/20 backdrop-blur-md"
                            >
                                <div className="bg-white/20 p-1.5 rounded-lg text-xs">✓</div>
                                <span className="font-semibold text-sm">{success}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white rounded-3xl md:rounded-4xl border border-gray-100 p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-110" />

                            <h2 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-600 rounded-full" />
                                Basic Information
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Name Field */}
                                    <div className="space-y-2.5">
                                        <Label htmlFor="name" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                            Full Name
                                        </Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            disabled={isSaving}
                                            className="h-14 px-5 bg-gray-50 border-gray-100/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all rounded-[1.25rem] text-base font-medium"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    {/* Email (Read-only) */}
                                    <div className="space-y-2.5 opacity-70">
                                        <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                            Email Address
                                        </Label>
                                        <Input
                                            value={user.email}
                                            disabled
                                            className="h-14 px-5 bg-gray-100/50 border-transparent text-gray-500 rounded-[1.25rem] text-base font-medium cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 ml-1">Coding & Social Profiles</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* GFG Username */}
                                        <div className="space-y-2.5">
                                            <Label htmlFor="gfgUsername" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <span className="text-green-600 font-bold text-sm">GFG</span>
                                                GeeksforGeeks
                                            </Label>
                                            <Input
                                                id="gfgUsername"
                                                value={gfgUsername}
                                                onChange={(e) => setGfgUsername(e.target.value)}
                                                disabled={isSaving}
                                                className="h-14 px-5 bg-gray-50 border-gray-100/50 focus:ring-4 focus:ring-green-500/10 focus:border-green-500 focus:bg-white transition-all rounded-[1.25rem] text-base font-medium"
                                                placeholder="e.g. gfg_username"
                                            />
                                        </div>

                                        {/* GitHub */}
                                        <div className="space-y-2.5">
                                            <Label htmlFor="github" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <Github className="h-3.5 w-3.5 text-blue-500" />
                                                GitHub
                                            </Label>
                                            <Input
                                                id="github"
                                                value={github}
                                                onChange={(e) => setGithub(e.target.value)}
                                                required
                                                disabled={isSaving}
                                                className="h-14 px-5 bg-gray-50 border-gray-100/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all rounded-[1.25rem] text-base font-medium"
                                                placeholder="e.g. github_handle"
                                            />
                                        </div>

                                        {/* LinkedIn */}
                                        <div className="space-y-2.5">
                                            <Label htmlFor="linkedin" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <Linkedin className="h-3.5 w-3.5 text-blue-500" />
                                                LinkedIn
                                            </Label>
                                            <Input
                                                id="linkedin"
                                                value={linkedin}
                                                onChange={(e) => setLinkedin(e.target.value)}
                                                required
                                                disabled={isSaving}
                                                className="h-14 px-5 bg-gray-50 border-gray-100/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all rounded-[1.25rem] text-base font-medium"
                                                placeholder="e.g. linkedin_handle"
                                            />
                                        </div>

                                        {/* WhatsApp Number */}
                                        <div className="space-y-2.5">
                                            <Label htmlFor="phoneNumber" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <Phone className="h-3.5 w-3.5 text-blue-500" />
                                                WhatsApp Number
                                            </Label>
                                            <Input
                                                id="phoneNumber"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                required
                                                disabled={isSaving}
                                                className="h-14 px-5 bg-gray-50 border-gray-100/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all rounded-[1.25rem] text-base font-medium"
                                                placeholder="+91..."
                                            />
                                        </div>

                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-50">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 ml-1">Notification Timing</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2.5">
                                            <Label htmlFor="dailyGrindTime" className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                                <Clock className="h-3.5 w-3.5 text-blue-500" />
                                                Daily Grind Time
                                            </Label>
                                            <Input
                                                id="dailyGrindTime"
                                                type="time"
                                                value={dailyGrindTime}
                                                onChange={(e) => setDailyGrindTime(e.target.value)}
                                                required
                                                disabled={isSaving}
                                                className="h-14 px-5 bg-gray-50 border-gray-100/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 focus:bg-white transition-all rounded-[1.25rem] text-base font-medium"
                                            />
                                            <p className="text-xs text-gray-400 font-medium ml-1">Asia/Kolkata time zone, 24-hour format.</p>
                                        </div>
                                    </div>
                                </div>



                                <div className="pt-8 border-t border-gray-50">
                                    <Button
                                        type="submit"
                                        className="w-full h-14 bg-gray-900 hover:bg-black text-white font-bold rounded-[1.25rem] text-base shadow-xl shadow-gray-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="h-5 w-5" />
                                                Save All Preferences
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </section>
                    </div>

                    {/* Right Column: Platform Status */}
                    <div className="space-y-6">
                        {/* LeetCode Status */}
                        <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-3xl md:rounded-4xl p-6 md:p-8 text-white shadow-xl shadow-orange-200/50 relative overflow-hidden group">
                            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <span className="bg-white/20 p-2 rounded-xl">⚡</span>
                                LeetCode Status
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-orange-100/60 text-[10px] font-bold uppercase tracking-wider mb-1">Username</p>
                                    <p className="text-lg font-bold">@{user.leetcodeUsername}</p>
                                </div>
                                <div className="h-px bg-white/10 w-full" />
                                <p className="text-sm text-orange-100/80 leading-relaxed font-medium italic">
                                    "Your username cannot be changed. This ensures consistency in tracking your DSA grind history."
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-3xl md:rounded-4xl border border-gray-100 p-6 md:p-8">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="text-blue-600">🔔</span>
                                Alerts Config
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex gap-3 text-sm text-gray-600 font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                    WhatsApp numbers verified for secure identity and group joins.
                                </li>
                                <li className="flex gap-3 text-sm text-gray-600 font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                                    Real-time background status updates via SWR.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}
