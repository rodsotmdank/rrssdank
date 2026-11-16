import appHtml from '@/lib/appHtml';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function GET() {
  const supabase = supabaseServer();
  const { data } = await supabase.auth.getUser();
  const email = data && data.user ? data.user.email : '';
  const html = appHtml.replace('__USER_EMAIL__', esc(email));
  return new Response(html, {
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}
