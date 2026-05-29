/* ================================================================
   auth-gate.js — protege páginas internas + injeta botão "Sair".
   ----------------------------------------------------------------
   Carregar APÓS o supabase-js e o supabase.js. No load:
     1. Checa `sb.auth.getSession()`. Sem sessão → redireciona pra signup.html.
     2. Com sessão → libera a página E injeta o botão "Sair" no sidebar
        (logo abaixo dos links de navegação) e no mobile-header.
     3. Botão "Sair" chama `sb.auth.signOut()` e volta pra home.

   Páginas que carregam este script: setup, restricoes, faq, suporte,
   catalogo-dicas (todas que têm sidebar com .nav-link).
   home.html e signup.html NÃO carregam — são acessíveis sem login.
   ================================================================ */
(function () {
  if (!window.sb) {
    console.error('[auth-gate] window.sb não disponível — supabase.js carregou?');
    return;
  }

  // Esconde o body até confirmar a sessão (evita flash de conteúdo
  // pra quem não está logado). Removido depois do check.
  document.documentElement.style.visibility = 'hidden';

  window.sb.auth.getSession().then(({ data }) => {
    if (!data?.session) {
      // Sem sessão: vai pra tela de login
      window.location.replace('signup.html');
      return;
    }
    document.documentElement.style.visibility = '';
    injectLogout(data.session.user);
  }).catch(err => {
    console.error('[auth-gate] falha ao checar sessão:', err);
    // Em erro, libera mesmo assim — fail-open pra evitar deixar o user travado
    document.documentElement.style.visibility = '';
  });

  function injectLogout(user) {
    const sidebar = document.querySelector('.sidebar');
    const mobile  = document.querySelector('.mobile-header');

    // ------- Sidebar (desktop) -------
    if (sidebar && !sidebar.querySelector('.auth-logout')) {
      const wrap = document.createElement('div');
      wrap.className = 'auth-logout-wrap';
      const nome = (user.user_metadata?.nome) || user.email || 'Conta';
      wrap.innerHTML =
        '<div class="auth-user" title="' + escapeAttr(user.email || '') + '">' +
        '<span class="auth-user-avatar" aria-hidden="true">' + initial(nome) + '</span>' +
        '<span class="auth-user-name">' + escapeHtml(nome) + '</span>' +
        '</div>' +
        '<button type="button" class="auth-logout" id="auth-logout">' +
          '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
            '<path d="M10 11l3-3-3-3M13 8H6M6 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
          'Sair' +
        '</button>';
      sidebar.appendChild(wrap);
      wrap.querySelector('#auth-logout').addEventListener('click', doLogout);
    }

    // ------- Mobile header — botão pequeno ao lado do select -------
    if (mobile && !mobile.querySelector('.auth-logout-mobile')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'auth-logout-mobile';
      btn.setAttribute('aria-label', 'Sair');
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
        '<path d="M10 11l3-3-3-3M13 8H6M6 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';
      mobile.appendChild(btn);
      btn.addEventListener('click', doLogout);
    }
  }

  async function doLogout() {
    try { await window.sb.auth.signOut(); } catch (_) {}
    try { localStorage.removeItem('squad-user-name'); } catch (_) {}
    window.location.href = 'home.html';
  }

  // ---------- Utils ----------
  function initial(s) {
    return String(s || '?').trim().charAt(0).toUpperCase();
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g,'&quot;');
  }
})();
