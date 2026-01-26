import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // Revalidate the entire site to pick up new settings (logo, favicon, etc.)
        revalidatePath('/', 'layout');

        return NextResponse.json({ revalidated: true, now: Date.now() });
    } catch (error) {
        return NextResponse.json({ revalidated: false, error: 'Failed to revalidate' }, { status: 500 });
    }
}
