import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[CLIENT LOGS]', JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Failed to parse client logs:', err);
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
