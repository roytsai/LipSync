import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const asrAPIUrl = process.env.NEXT_PUBLIC_ASR_API_URL || "";
  try {
    const body = await req.json();

    const res = await fetch(asrAPIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    return NextResponse.json({ error: 'Failed to call ASR API' }, { status: 500 });
  }
}