/* ================================================================
   supabase.js — config central do Supabase Auth + cliente.
   ----------------------------------------------------------------
   Como usar (em CADA página que precisa de auth / DB):

     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="supabase.js"></script>

   A primeira tag (CDN) expõe `window.supabase.createClient`. A segunda
   (este arquivo) cria UMA instância do client e expõe como `window.sb`.
   O nome `sb` evita conflito com `window.supabase` (a lib em si).

   Por que centralizar: antes a URL e a anon key viviam duplicadas em
   signup, main.js e admin. Agora um único ponto de verdade.
   ================================================================ */
(function () {
  // Anon key — pública por design (vai no source do browser).
  // A segurança real vem das policies RLS no banco.
  const SUPABASE_URL = 'https://xkgepeejugrlgtavcxqb.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrZ2VwZWVqdWdybGd0YXZjeHFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5ODU0MjIsImV4cCI6MjA5NTU2MTQyMn0.s7JKeTqkG14boQcH00eGv4CKSzeYJPY8zud8WMe4pQc';

  if (!window.supabase || typeof window.supabase.createClient !== 'function') {
    console.error('[supabase] biblioteca não carregada. Esqueceu o <script src="…@supabase/supabase-js@2"> antes deste arquivo?');
    return;
  }

  // `persistSession: true` + `autoRefreshToken: true` (defaults) salvam o
  // JWT em localStorage com `storageKey` e renovam automaticamente.
  // Ao chamar qualquer .from(...).insert/update/select, a lib anexa o
  // Authorization: Bearer <jwt> sozinha — sem mais 401 por RLS.
  window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession:   true,
      autoRefreshToken: true,
      storageKey:       'squad-auth',
    },
  });

  // Exponho as constantes pra casos especiais (ex.: admin.html que precisa
  // fazer chamada anon SEM client autenticado).
  window.SUPABASE_URL      = SUPABASE_URL;
  window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
})();
