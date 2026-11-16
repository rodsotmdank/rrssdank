import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const BUCKET = 'carruseles';

async function buscar(supabase, id) {
  const { data: u } = await supabase.auth.getUser();
  if (!u || !u.user) return { err: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) };
  const { data, error } = await supabase.from('post_pdfs').select('id, path').eq('id', id).maybeSingle();
  if (error) return { err: NextResponse.json({ error: error.message }, { status: 500 }) };
  if (!data) return { err: NextResponse.json({ error: 'No existe' }, { status: 404 }) };
  return { row: data };
}

// Abre el PDF: redirige a una URL firmada que dura 2 minutos.
export async function GET(request, { params }) {
  const supabase = supabaseServer();
  const { row, err } = await buscar(supabase, params.id);
  if (err) return err;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(row.path, 120);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.redirect(data.signedUrl, { status: 302 });
}

// Quita el PDF (archivo y registro).
export async function DELETE(request, { params }) {
  const supabase = supabaseServer();
  const { row, err } = await buscar(supabase, params.id);
  if (err) return err;
  const rm = await supabase.storage.from(BUCKET).remove([row.path]);
  if (rm.error) return NextResponse.json({ error: rm.error.message }, { status: 500 });
  const { error } = await supabase.from('post_pdfs').delete().eq('id', row.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
