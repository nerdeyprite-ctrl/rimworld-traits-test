import { NextRequest, NextResponse } from 'next/server';
import { getWorldSnapshot } from '../../../../lib/world-sim-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const accountId = request.nextUrl.searchParams.get('accountId');
        const snapshot = await getWorldSnapshot(accountId);
        return NextResponse.json(
            { ok: true, snapshot },
            { headers: { 'Cache-Control': 'no-store' } }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to read world state.';
        return NextResponse.json(
            { ok: false, error: message },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}

