import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'DSA Grinders - Track LeetCode & Compete with Friends';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a', // slate-900
          backgroundImage: 'radial-gradient(circle at 25px 25px, #334155 2%, transparent 0%), radial-gradient(circle at 75px 75px, #334155 2%, transparent 0%)',
          backgroundSize: '100px 100px',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to bottom right, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
            padding: '60px 80px',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                fontSize: '100px',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #3b82f6, #8b5cf6)',
                backgroundClip: 'text',
                color: 'transparent',
                letterSpacing: '-0.05em',
              }}
            >
              DSA Grinders
            </div>
          </div>
          
          <div
            style={{
              fontSize: '42px',
              color: '#e2e8f0',
              textAlign: 'center',
              maxWidth: '800px',
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            Track LeetCode Progress & Compete with Friends
          </div>
          
          <div
            style={{
              display: 'flex',
              marginTop: '50px',
              gap: '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 32px',
                background: 'rgba(59, 130, 246, 0.2)',
                color: '#60a5fa',
                borderRadius: '100px',
                fontSize: '24px',
                fontWeight: 600,
                border: '1px solid rgba(59, 130, 246, 0.3)',
              }}
            >
              Leaderboards
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 32px',
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#a78bfa',
                borderRadius: '100px',
                fontSize: '24px',
                fontWeight: 600,
                border: '1px solid rgba(139, 92, 246, 0.3)',
              }}
            >
              Daily Roasts
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 32px',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                borderRadius: '100px',
                fontSize: '24px',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              Analytics
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
