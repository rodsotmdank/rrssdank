import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const BUCKET = 'carruseles';
const SLOT = /^s[1-8]-[1-9]$/;
const MAX = 50 * 1024 * 1024;

async function usuario(supabase) {
  const { data } = await supabase.auth.getUser();
  return data && data.user ? data.user : null;
}

// Lista de PDFs de todas las publicaciones (los más recientes primero).
export async function GET() {
  const supabase = supabaseServer();
  if (!(await usuario(supabase))) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  const { data, error } = await supabase
    .from('post_pdfs')
    .select('id, slot_id, filename, size, created_at, uploaded_by_email')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ pdfs: data });
}

// Subida en dos pasos: "sign" entrega una URL firmada para subir directo a Storage
// (así no se pasa por el límite de 4,5 MB de Vercel) y "confirm" registra el archivo.
export async function POST(request) {
  const supabase = supabaseServer();
  const user = await usuario(supabase);
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch (e) { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }
  const { action, slot_id, filename, size, path } = body || {};
  if (!SLOT.test(String(slot_id || ''))) return NextResponse.json({ error: 'Publicación inválida' }, { status: 400 });

  if (action === 'sign') {
    const nombre = String(filename || '');
    if (!/\.pdf$/i.test(nombre)) return NextResponse.json({ error: 'Solo se admiten archivos PDF' }, { status: 400 });
    if (Number(size) > MAX) return NextResponse.json({ error: 'El PDF supera los 50 MB' }, { status: 400 });
    const limpio = nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80);
    const ruta = `slots/${slot_id}/${Date.now()}-${limpio}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(ruta);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ path: data.path || ruta, token: data.token, signedUrl: data.signedUrl });
  }

  if (action === 'confirm') {
    if (!path || !String(path).startsWith(`slots/${slot_id}/`)) return NextResponse.json({ error: 'Ruta inválida' }, { status: 400 });
    const { data, error } = await supabase
      .from('post_pdfs')
      .insert({ slot_id, path, filename: String(filename || 'carrusel.pdf').slice(0, 200), size: Number(size) || null, uploaded_by: user.id, uploaded_by_email: user.email })
      .select('id, slot_id, filename, size, created_at, uploaded_by_email')
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pdf: data });
  }

  return NextResponse.json({ error: 'Acción desconocida' }, { status: 400 });
}
