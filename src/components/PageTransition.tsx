'use client';

// AnimatePresence in Next.js App Router layout causes glitches.
// Page-level entry animations + shared fixed backgrounds (particles, blobs)
// give the seamless feel without fighting the router.
export default function PageTransition({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
