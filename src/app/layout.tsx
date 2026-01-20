import type { Metadata } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthContext";

export const metadata: Metadata = {
  title: "DSA Dhurandhar | Grind LeetCode Together",
  description: "Compete with friends, track your DSA progress, climb the leaderboard!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#0a0a0f] text-white min-h-screen">
        <ErrorReporter />
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
