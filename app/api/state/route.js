import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const ID = 'main';

async function actual(supabase) {
  const { data, error } = await supabase
    .from('calendar_state')
    .select('data, version, updated_at, updated_by_email')
    .eq('id', ID)
    .maybeSingle();
  return { data, error };
}

// Devuelve el calendario guardado (o data:null si aún no existe).
export async function GET() {
  const supabase = supabaseServer();
  const { data: u } = await supabase.auth.getUser();
  if (!u || !u.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { data, error } = await actual(supabase);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ data: null, version: 0 });
  return NextResponse.json({ data: data.data, version: data.version, updated_at: data.updated_at, updated_by_email: data.updated_by_email });
}

// Guarda el calendario. Si otra persona guardó antes, responde 409 con la versión vigente.
export async function PUT(request) {
  const supabase = supabaseServer();
  const { data: u } = await supabase.auth.getUser();
  const user = u && u.user;
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }
  const { data: nuevo, baseVersion } = body || {};
  if (!nuevo || typeof nuevo !== 'object') return NextResponse.json({ error: 'Falta data' }, { status: 400 });
  const base = Number(baseVersion) || 0;

  if (base === 0) {
    const { data, error } = await supabase
      .from('calendar_state')
      .insert({ id: ID, data: nuevo, version: 1, updated_by: user.id, updated_by_email: user.email })
      .select('version')
      .maybeSingle();
    if (!error && data) return NextResponse.json({ version: data.version });
    if (error && error.code !== '23505') return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data, error } = await supabase
      .from('calendar_state')
      .update({ data: nuevo, version: base + 1, updated_at: new Date().toISOString(), updated_by: user.id, updated_by_email: user.email })
      .eq('id', ID)
      .eq('version', base)
      .select('version')
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (data) return NextResponse.json({ version: data.version });
  }

  const { data: cur } = await actual(supabase);
  return NextResponse.json({ error: 'conflicto', current: cur ? { data: cur.data, version: cur.version, updated_by_email: cur.updated_by_email } : null }, { status: 409 });
}
