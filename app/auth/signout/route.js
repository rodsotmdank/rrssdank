import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function POST(request) {
  const supabase = supabaseServer();
  await supabase.auth.signOut();
  const url = new URL('/login', request.url);
  return NextResponse.redirect(url, { status: 303 });
}
