import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import Script from "next/script";
import SplashScreen from "@/components/SplashScreen";
import Providers from "@/components/Providers";
import PageTransition from "@/components/PageTransition";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dsagrinder.in'),
  title: {
    default: "DSA Grinders | Track LeetCode & Compete with Friends",
    template: "%s | DSA Grinders",
  },
  description: "The ultimate DSA tracking tool. Compete with friends, track your LeetCode progress, and stay motivated with automated roasts!",
  keywords: [
    "DSA", "LeetCode", "Data Structures", "Algorithms", "Coding Competition", 
    "Placement Preparation", "Coding Tracker", "DSA Tracker", "Competitive Programming",
    "GeeksforGeeks", "Codeforces", "Coding Leaderboard"
  ],
  authors: [{ name: "DSA Grinders Team", url: process.env.NEXT_PUBLIC_SITE_URL || 'https://dsagrinder.in' }],
  creator: "DSA Grinders Team",
  publisher: "DSA Grinders",
  applicationName: "DSA Grinders",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DSA Grinders",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "DSA Grinders | Track LeetCode & Compete with Friends",
    description: "Compete with friends, track your DSA progress, and stay motivated with automated roasts!",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://dsagrinder.in',
    siteName: "DSA Grinders",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "DSA Grinders Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DSA Grinders | Track LeetCode & Compete with Friends",
    description: "Compete with friends, track your DSA progress, and stay motivated with automated roasts!",
    images: ["/opengraph-image"],
    creator: "@dsagrinders",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_SITE_URL || 'https://dsagrinder.in',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#ef4444",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Fonts - Product Sans / Roboto */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet" />

        {/* iOS Specific PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DSA Grinders" />

        {/* Additional PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="DSA Grinders" />
        
        {/* Umami Analytics */}
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            strategy="afterInteractive"
            src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js"}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          />
        )}
      </head>
      <body className="antialiased bg-background text-foreground min-h-screen font-sans touch-manipulation">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SplashScreen />
          <ErrorReporter />
          <AuthProvider>
            <Providers>
              <PageTransition>{children}</PageTransition>
            </Providers>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>

        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker registered:', registration.scope);
                  },
                  function(err) {
                    console.log('Service Worker registration failed:', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
