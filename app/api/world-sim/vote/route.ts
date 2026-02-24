import { NextRequest, NextResponse } from 'next/server';
import { submitWorldVote } from '../../../../lib/world-sim-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body: unknown = await request.json();
        const accountId = typeof (body as { accountId?: unknown })?.accountId === 'string'
            ? (body as { accountId: string }).accountId.trim()
            : '';
        const choiceId = typeof (body as { choiceId?: unknown })?.choiceId === 'string'
            ? (body as { choiceId: string }).choiceId.trim()
            : '';
        const pointsRaw = (body as { points?: unknown })?.points;
        const points = typeof pointsRaw === 'number' && Number.isFinite(pointsRaw) ? pointsRaw : 1;

        if (!accountId) {
            return NextResponse.json(
                { ok: false, error: 'accountId is required.' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }
        if (!choiceId) {
            return NextResponse.json(
                { ok: false, error: 'choiceId is required.' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        const snapshot = await submitWorldVote({ accountId, choiceId, points });
        return NextResponse.json(
            { ok: true, snapshot },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Vote submission failed.';
        return NextResponse.json(
            { ok: false, error: message },
            { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}

