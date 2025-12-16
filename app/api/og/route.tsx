
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const name = searchParams.get('name') || '정착민';
    const mbti = searchParams.get('mbti') || '????';
    const trait1 = searchParams.get('t1') || '';
    const trait2 = searchParams.get('t2') || '';
    const trait3 = searchParams.get('t3') || '';

    // Simple Rimworld-style Background Card
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
                    backgroundColor: '#1a1a1a', // Dark Gray BG
                    border: '12px solid #5a3a1a', // Brown Border
                    fontFamily: 'sans-serif',
                    position: 'relative',
                }}
            >
                {/* Background Texture Overlay (Simulated) */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0.8) 100%)',
                    pointerEvents: 'none',
                }}></div>

                {/* Title */}
                <div style={{ color: '#888', fontSize: 24, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '4px' }}>
                    Rimworld Colonist Test
                </div>

                {/* Name Area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }}>
                    <div style={{ color: '#ccc', fontSize: 18, marginBottom: 5 }}>NAME</div>
                    <div style={{ color: '#fff', fontSize: 48, fontWeight: 'bold' }}>{name}</div>
                </div>

                {/* MBTI Area */}
                <div style={{
                    backgroundColor: '#333',
                    color: '#ffc45d',
                    fontSize: 32,
                    fontWeight: 'bold',
                    padding: '10px 30px',
                    borderRadius: 8,
                    border: '2px solid #555',
                    marginBottom: 40,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.5)'
                }}>
                    {mbti}
                </div>

                {/* Traits Area */}
                <div style={{ display: 'flex', gap: '20px' }}>
                    {trait1 && (
                        <div style={{ backgroundColor: '#2b2b2b', color: '#fff', padding: '10px 20px', borderRadius: 4, border: '1px solid #444', fontSize: 24 }}>
                            {trait1}
                        </div>
                    )}
                    {trait2 && (
                        <div style={{ backgroundColor: '#2b2b2b', color: '#fff', padding: '10px 20px', borderRadius: 4, border: '1px solid #444', fontSize: 24 }}>
                            {trait2}
                        </div>
                    )}
                    {trait3 && (
                        <div style={{ backgroundColor: '#2b2b2b', color: '#fff', padding: '10px 20px', borderRadius: 4, border: '1px solid #444', fontSize: 24 }}>
                            {trait3}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{ position: 'absolute', bottom: 20, color: '#666', fontSize: 16 }}>
                    변방계 생존 확률 테스트
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
