  // ============ Sidebar sub-nav (scroll spy — destaca a etapa visível) ============
  {
    const stageEls = document.querySelectorAll('.stage[id]');
    if (stageEls.length && 'IntersectionObserver' in window) {
      const stageIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const stageId = entry.target.id.replace('stage-', '');
          document.querySelectorAll('.nav-sub.is-viewing').forEach(s => s.classList.remove('is-viewing'));
          const sub = document.querySelector('.nav-sub[data-nav-stage="' + stageId + '"]');
          if (sub) sub.classList.add('is-viewing');
        });
      }, { rootMargin: '-100px 0px -50% 0px', threshold: 0 });
      stageEls.forEach(el => stageIO.observe(el));
    }
  }


  // ============ Mobile dropdown nav ============
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) {
    mobileNav.addEventListener('change', () => {
      // Options pointing at another page (FAQ/Suporte, or setup.html#anchor) — navigate.
      if (/\.html(?:#|$)/.test(mobileNav.value)) { window.location.href = mobileNav.value; return; }
      // On setup.html the options are #page-X — switch page instead of scrolling.
      if (mobileNav.value.startsWith('#page-') && showSetupPage(mobileNav.value.slice(1))) return;
      const el = document.querySelector(mobileNav.value);
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  }

  // ============ Setup paging (setup.html): show one .page at a time ============
  // The 4 etapas live in #page-1..#page-4. Sidebar links (#page-X) and the
  // Anterior/Próximo buttons switch the active page (with a fade-in) instead of
  // scrolling through one long document.
  const setupPages = document.querySelectorAll('.page');

  // Highlight the sidebar link matching the visible page.
  function updateSidebarActive(id) {
    document.querySelectorAll('.sidebar a[href^="#page-"]').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + id);
    });
  }

  // Show one page, hide the rest, and (re)trigger the fade-in animation.
  // Pass { scroll: false } to keep the scroll position (used by subsection jumps).
  function showSetupPage(id, opts) {
    opts = opts || {};
    let target = null;
    setupPages.forEach(p => {
      if (p.id === id) target = p;
      else p.classList.remove('is-active', 'page-enter');
    });
    if (!target) return false;
    target.classList.add('is-active');
    target.classList.remove('page-enter');
    void target.offsetWidth;            // reflow so the animation restarts every time
    target.classList.add('page-enter');
    updateSidebarActive(id);
    if (opts.scroll !== false) window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  }

  if (setupPages.length) {
    // Sidebar / in-page links to #page-X
    document.querySelectorAll('a[href^="#page-"]').forEach(a => {
      a.addEventListener('click', (ev) => {
        if (showSetupPage(a.getAttribute('href').slice(1))) ev.preventDefault();
      });
    });

    // "Anterior" / "Próximo" buttons inside each page
    setupPages.forEach((page, i) => {
      const isFirst = i === 0;
      const isLast = i === setupPages.length - 1;
      const prev = page.querySelector('.page-prev');
      const next = page.querySelector('.page-next');
      const nav = page.querySelector('.page-nav');
      if (prev) {
        prev.hidden = isFirst || isLast;   // visível só nas etapas do meio
        prev.addEventListener('click', () => showSetupPage(setupPages[i - 1].id));
      }
      if (next) {
        next.hidden = isLast;              // some na última etapa
        next.addEventListener('click', () => showSetupPage(setupPages[i + 1].id));
      }
      if (nav && isLast) nav.hidden = true; // última etapa não tem navegação
    });

    // ---- Sidebar subsections: jump to a section inside its page ----
    const subLinks = document.querySelectorAll('.nav-subsections a[href^="#"]');
    const setActiveSub = (id) => {
      subLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
    };
    subLinks.forEach(a => {
      a.addEventListener('click', (ev) => {
        const id = a.getAttribute('href').slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        ev.preventDefault();
        // Switch to the section's page first (without jumping to the top)...
        const page = target.closest('.page');
        if (page && !page.classList.contains('is-active')) showSetupPage(page.id, { scroll: false });
        setActiveSub(id);
        // ...then smooth-scroll to the section once it's laid out.
        requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      });
    });

    // Scroll-spy: highlight the subsection whose section is currently in view.
    const subTargets = Array.from(subLinks)
      .map(a => document.getElementById(a.getAttribute('href').slice(1)))
      .filter(Boolean);
    if (subTargets.length && 'IntersectionObserver' in window) {
      const subIO = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) setActiveSub(e.target.id); });
      }, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });
      subTargets.forEach(t => subIO.observe(t));
    }

    // Initial state: highlight the page already marked active in the HTML.
    const initial = document.querySelector('.page.is-active') || setupPages[0];
    if (initial) updateSidebarActive(initial.id);

    // Deep link: open the page (and scroll to the section) referenced by the URL
    // hash — lets the navbar links on faq.html/suporte.html land in the right spot.
    function applyHash() {
      const id = location.hash.slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      if (target.classList.contains('page')) {
        showSetupPage(id);
        return;
      }
      const page = target.closest('.page');
      if (page) showSetupPage(page.id, { scroll: false });
      setActiveSub(id);
      requestAnimationFrame(() => target.scrollIntoView({ behavior: 'auto', block: 'start' }));
    }
    applyHash();
    window.addEventListener('hashchange', applyHash);
  }

  // ============ Smooth-scroll offset for in-page anchors ============
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href').slice(1);
      if (!id || id.startsWith('page-')) return;   // page links handled above
      if (a.closest('.nav-subsections')) return;   // subsection links handled above
      const el = document.getElementById(id);
      if (!el) return;
      ev.preventDefault();
      const isMobile = window.matchMedia('(max-width: 900px)').matches;
      const offset = isMobile ? 70 : 12;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  // ============ Mobile phone toggle (injetado em cada .task-row.with-phone) ============
  document.querySelectorAll('.task-row.with-phone .task-main').forEach(taskMain => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'phone-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg class="toggle-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="4" y="2" width="8" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="12" r="0.7" fill="currentColor"/></svg><span class="toggle-text">Ver tela de exemplo</span>';
    taskMain.appendChild(btn);
    btn.addEventListener('click', () => {
      const taskRow = btn.closest('.task-row');
      const isOpen = taskRow.classList.toggle('phone-visible');
      btn.classList.toggle('is-open', isOpen);
      btn.setAttribute('aria-expanded', String(isOpen));
      const textEl = btn.querySelector('.toggle-text');
      if (textEl) textEl.textContent = isOpen ? 'Esconder tela' : 'Ver tela de exemplo';
    });
  });

  // ============ Wizard: treinamento guiado de agentes ============
  const wizardQuestions = [
    // ===== PARTE 1: SOBRE SEU NEGÓCIO =====
    // (1) HORÁRIO — antes era texto livre; agora é escolha de opções prontas
    //     + "Outro (especificar)" que abre um campo de texto livre.
    {
      block: 'Sobre seu negócio',
      sectionIntro: 'Vamos começar com o básico. Essas informações ajudam o Waz a responder suas clientes com precisão.',
      key: 'horario',
      pdfLabel: 'Horário',
      q: 'Qual o horário de funcionamento do seu negócio?',
      hint: 'Escolha uma opção ou selecione "Outro" para escrever o seu.',
      type: 'choice-with-followup',
      recommended: true,
      options: [
        { value: 'seg_sex', label: 'Segunda a Sexta, 9h às 18h' },
        { value: 'seg_sab', label: 'Segunda a Sábado, 8h às 20h' },
        { value: 'todos',   label: 'Todos os dias, 10h às 22h' },
        { value: 'outro',   label: 'Outro (especificar)', followup: true },
      ],
      followupKey: 'horario_outro',
      followupHint: 'Descreva o horário de funcionamento.',
      followupPlaceholder: 'Ex: Terça a Domingo, 11h às 19h',
    },
    // (2) PRAZO MÍNIMO — NOVA pergunta: opções de prazo + "Outro (especificar)".
    {
      block: 'Sobre seu negócio',
      key: 'prazo_minimo',
      pdfLabel: 'Prazo mínimo de encomenda',
      q: 'Qual o prazo mínimo para encomendar?',
      hint: 'Quanto tempo de antecedência você precisa para preparar um pedido.',
      type: 'choice-with-followup',
      options: [
        { value: '24h',   label: '24 horas' },
        { value: '48h',   label: '48 horas' },
        { value: '3dias', label: '3 dias' },
        { value: '5dias', label: '5 dias' },
        { value: 'outro', label: 'Outro (especificar)', followup: true },
      ],
      followupKey: 'prazo_minimo_outro',
      followupHint: 'Descreva o prazo mínimo.',
      followupPlaceholder: 'Ex: 1 semana para bolos grandes',
    },
    // (2) EXCEÇÕES DE PRAZO — NOVO campo de texto livre, complementa o prazo mínimo.
    {
      block: 'Sobre seu negócio',
      key: 'prazo_excecoes',
      pdfLabel: 'Exceções de prazo',
      q: 'Exceções de prazo para alguns produtos?',
      hint: 'Produtos que precisam de mais (ou menos) antecedência. Se não tiver, pode pular.',
      type: 'textarea',
      placeholder: 'Ex: Bolos de casamento precisam de 15 dias. Brigadeiros saem no mesmo dia.',
    },
    {
      block: 'Sobre seu negócio',
      key: 'localizacao',
      pdfLabel: 'Localização e entrega',
      q: 'Onde fica seu negócio? Você faz entrega?',
      hint: 'Endereço, bairro/região, se faz entrega e pra onde, valor do frete.',
      type: 'textarea',
      placeholder: 'Rua dos Doces, 42 — Vila Mariana, SP. Entrego na Zona Sul, frete R$ 10.',
      recommended: true,
    },
    // (5) REGRAS — antes era só texto livre; agora traz sugestões prontas como
    //     checkboxes (múltipla seleção) + "Outro (especificar)" para texto livre.
    {
      block: 'Sobre seu negócio',
      key: 'regras',
      pdfLabel: 'Regras',
      q: 'Quais as principais regras que seus clientes precisam saber?',
      hint: 'Marque as que se aplicam e use "Outro" para escrever as suas.',
      type: 'multi-choice',
      options: [
        { value: 'sem_cancelamento', label: 'Não aceitamos cancelamento' },
        { value: 'cancel_48h',       label: 'Cancelamento com 48h de antecedência' },
        { value: 'sinal_50',         label: 'Cobramos 50% de sinal para encomendas' },
        { value: 'sem_gluten',       label: 'Não trabalhamos com produtos sem glúten' },
        { value: 'sem_feriado',      label: 'Não abrimos em feriados' },
      ],
      otherKey: 'regras_outro',
      otherLabel: 'Outro (especificar)',
      otherPlaceholder: 'Escreva outras regras importantes do seu negócio...',
    },
    // (3) CONSERVAÇÃO E CONSUMO — sub-perguntas agora são múltipla escolha
    //     (onde guardar / validade / como servir) + instruções livres por produto.
    {
      block: 'Sobre seu negócio',
      key: 'conservar_onde',
      pdfLabel: 'Conservação — onde guardar',
      q: 'Como conservar e consumir: onde guardar?',
      hint: 'Onde a cliente deve guardar o produto depois de comprar.',
      type: 'single-choice',
      options: [
        { value: 'geladeira', label: 'Geladeira' },
        { value: 'ambiente',  label: 'Temperatura ambiente' },
        { value: 'freezer',   label: 'Freezer' },
        { value: 'depende',   label: 'Depende do produto' },
      ],
    },
    {
      block: 'Sobre seu negócio',
      key: 'conservar_tempo',
      pdfLabel: 'Conservação — validade',
      q: 'Por quanto tempo dura?',
      hint: 'Validade média dos seus produtos depois de prontos.',
      type: 'single-choice',
      options: [
        { value: '1d',   label: '1 dia' },
        { value: '2d',   label: '2 dias' },
        { value: '3d',   label: '3 dias' },
        { value: '5d',   label: '5 dias' },
        { value: '7d',   label: '7 dias' },
        { value: 'mais', label: 'Mais de 7 dias' },
      ],
    },
    {
      block: 'Sobre seu negócio',
      key: 'conservar_servir',
      pdfLabel: 'Conservação — como servir',
      q: 'Como servir melhor?',
      hint: 'A melhor forma de consumir o produto.',
      type: 'single-choice',
      options: [
        { value: 'gelado',      label: 'Servir gelado' },
        { value: 'ambiente',    label: 'Servir em temperatura ambiente' },
        { value: 'micro',       label: 'Aquecer no micro-ondas' },
        { value: 'forno',       label: 'Aquecer no forno' },
        { value: 'sem_preparo', label: 'Não precisa de preparo' },
      ],
    },
    {
      block: 'Sobre seu negócio',
      key: 'conservar_instrucoes',
      pdfLabel: 'Conservação — instruções por produto',
      q: 'Instruções específicas por produto?',
      hint: 'Cuidados que variam de um produto para outro. Se não tiver, pode pular.',
      type: 'textarea',
      placeholder: 'Ex: Bolo gelado dura 5 dias na geladeira. Brigadeiros, 7 dias. Tortas, consumir em 3 dias.',
    },
    // (4) PAGAMENTO — antes era texto; agora é múltipla seleção (checkboxes)
    //     + "Outro", seguido da sub-pergunta de sinal (múltipla escolha).
    {
      block: 'Sobre seu negócio',
      key: 'pagamento',
      pdfLabel: 'Formas de pagamento',
      q: 'Quais formas de pagamento você aceita?',
      hint: 'Selecione todas que se aplicam.',
      type: 'multi-choice',
      recommended: true,
      options: [
        { value: 'pix',            label: 'Pix' },
        { value: 'dinheiro',       label: 'Dinheiro' },
        { value: 'cartao_debito',  label: 'Cartão de débito' },
        { value: 'cartao_credito', label: 'Cartão de crédito' },
        { value: 'parcelamento',   label: 'Parcelamento' },
      ],
      otherKey: 'pagamento_outro',
      otherLabel: 'Outra forma de pagamento',
      otherPlaceholder: 'Ex: vale-alimentação, transferência bancária...',
    },
    {
      block: 'Sobre seu negócio',
      key: 'pagamento_sinal',
      pdfLabel: 'Sinal para encomenda',
      q: 'Exige sinal para confirmar encomenda?',
      hint: 'Valor pago antecipadamente para garantir o pedido.',
      type: 'single-choice',
      options: [
        { value: 'nao',      label: 'Não exijo sinal' },
        { value: 'sim_50',   label: 'Sim, 50% do valor' },
        { value: 'sim_fixo', label: 'Sim, um valor fixo' },
        { value: 'depende',  label: 'Depende do tamanho do pedido' },
      ],
    },
    // (6) TOM DE VOZ — opções atualizadas, cada uma com uma breve descrição
    //     mostrada abaixo do título da opção (render já suporta `desc`).
    {
      block: 'Sobre seu negócio',
      key: 'tom_voz',
      pdfLabel: 'Tom de voz',
      q: 'Qual o tom de voz da sua marca?',
      hint: 'Como o Waz deve "falar" com suas clientes.',
      type: 'single-choice',
      recommended: true,
      options: [
        {
          value: 'casual',
          label: 'Casual e descontraído',
          desc: 'Comunicação leve, informal e amigável, como se conversasse com um amigo. Linguagem simples, emojis e brincadeiras leves para criar proximidade.',
        },
        {
          value: 'afetuoso',
          label: 'Afetuoso e caloroso',
          desc: 'Comunicação acolhedora e carinhosa. Demonstra cuidado e atenção, fazendo a cliente se sentir querida e bem-vinda.',
        },
        {
          value: 'formal',
          label: 'Formal e sóbrio',
          desc: 'Comunicação profissional, séria e respeitosa. Linguagem correta, sem gírias ou excesso de intimidade. Transmite credibilidade e excelência.',
        },
        {
          value: 'tecnico',
          label: 'Técnico e direto',
          desc: 'Comunicação objetiva e prática. Vai direto ao ponto, com informações claras e sem rodeios.',
        },
        {
          value: 'elegante',
          label: 'Elegante e refinado',
          desc: 'Comunicação sofisticada e cuidada. Tom premium, vocabulário selecionado, ideal para marcas mais exclusivas.',
        },
        {
          value: 'divertido',
          label: 'Divertido e bem-humorado',
          desc: 'Comunicação descontraída e cheia de personalidade. Usa humor leve e criatividade para tornar a conversa memorável.',
        },
      ],
    },
    {
      block: 'Sobre seu negócio',
      key: 'uso_emojis',
      pdfLabel: 'Uso de emojis',
      q: 'Com que frequência o Waz deve usar emojis?',
      hint: 'Emojis deixam a conversa mais leve, mas nem todo negócio combina.',
      type: 'choice-with-followup',
      recommended: false,
      options: [
        {
          value: 'sempre',
          label: 'Sempre',
          desc: 'Em quase toda mensagem.',
          followup: true,
        },
        {
          value: 'as_vezes',
          label: 'Às vezes',
          desc: 'Só pra dar um tom simpático, sem exagerar.',
          followup: true,
          recommended: true,
        },
        {
          value: 'nunca',
          label: 'Nunca',
          desc: 'Prefiro texto limpo, sem emojis.',
          followup: false,
        },
      ],
      followupKey: 'emojis_preferidos',
      followupHint: 'Quais emojis combinam com seu negócio? Ex: 🎂💕🍫😊✨',
      followupPlaceholder: '🎂💕😊',
    },
    {
      block: 'Sobre seu negócio',
      key: 'produto_top',
      pdfLabel: 'Produto mais vendido',
      q: 'Me conta sobre seu produto ou serviço mais vendido.',
      hint: 'Nome, preço, o que tem de especial, por que as clientes amam.',
      type: 'textarea',
      placeholder: 'Bolo Red Velvet (R$ 95) — é o mais pedido, a cobertura de cream cheese é feita na hora. As clientes pedem pra aniversário e casamento.',
    },
    {
      block: 'Sobre seu negócio',
      key: 'perguntas_frequentes',
      pdfLabel: 'Perguntas frequentes dos clientes',
      q: 'Quais dessas perguntas suas clientes mais fazem?',
      hint: 'Selecione todas que se aplicam. O Waz vai preparar respostas pra cada uma.',
      type: 'multi-choice',
      recommended: true,
      options: [
        { value: 'cardapio',         label: 'Quais sabores / opções vocês têm?' },
        { value: 'entrega',          label: 'Vocês fazem entrega? Pra onde?' },
        { value: 'prazo_encomenda',  label: 'Qual o prazo pra encomenda?' },
        { value: 'pagamento',        label: 'Quais formas de pagamento?' },
        { value: 'personalizado',    label: 'Fazem bolo personalizado / temático?' },
        { value: 'sem_restricao',    label: 'Tem opção sem glúten / sem lactose / vegano?' },
        { value: 'festa',            label: 'Fazem encomenda pra festa / evento?' },
        { value: 'desconto',         label: 'Tem desconto pra quantidade grande?' },
        { value: 'frete',            label: 'Quanto custa o frete / entrega?' },
        { value: 'disponibilidade',  label: 'Tem disponível pra hoje / amanhã?' },
      ],
      otherKey: 'perguntas_frequentes_outras',
      otherLabel: 'Outras perguntas que recebo',
      otherPlaceholder: 'Escreva outras perguntas que suas clientes fazem e não apareceram na lista acima...',
    },
    {
      block: 'Sobre seu negócio',
      key: 'extra_negocio',
      pdfLabel: 'Extra',
      q: 'Tem mais alguma coisa que você acha importante o Waz saber?',
      hint: 'Qualquer detalhe que não coube nas perguntas anteriores. Se não tiver nada, pode pular.',
      type: 'textarea',
      placeholder: 'A gente fecha em feriados. Em dezembro o prazo de encomenda sobe pra 5 dias.',
    },

    // ===== PARTE 2: COMO A IA PODE TE AJUDAR =====
    {
      block: 'Como a IA pode te ajudar',
      sectionIntro: 'Agora vamos entender sua rotina. Isso ajuda os agentes a priorizarem o que mais importa pra você.',
      key: 'gasta_tempo',
      pdfLabel: 'O que mais toma tempo',
      q: 'O que te toma mais tempo no dia a dia?',
      hint: 'Selecione tudo que pesa na sua rotina. Seus agentes vão focar nisso primeiro.',
      type: 'multi-choice',
      recommended: true,
      options: [
        { value: 'responder_whatsapp',     label: 'Responder mensagens no WhatsApp' },
        { value: 'responder_instagram',    label: 'Responder DMs e comentários no Instagram' },
        { value: 'criar_conteudo',         label: 'Criar posts e conteúdo pro Instagram' },
        { value: 'cobrar_clientes',        label: 'Cobrar clientes / correr atrás de pagamento' },
        { value: 'controle_financeiro',    label: 'Organizar o financeiro (fluxo de caixa, notas)' },
        { value: 'agendar_entregas',       label: 'Organizar entregas e agendamentos' },
        { value: 'mesmas_perguntas',       label: 'Responder as mesmas perguntas toda hora' },
        { value: 'orcamentos',             label: 'Fazer orçamentos e montar propostas' },
        { value: 'reativar_clientes',      label: 'Lembrar de clientes que sumiram' },
        { value: 'marketing_geral',        label: 'Pensar em promoções e campanhas' },
      ],
      otherKey: 'gasta_tempo_outros',
      otherLabel: 'Outra coisa que toma meu tempo',
      otherPlaceholder: 'Descreva o que mais consome seu tempo e não apareceu na lista...',
    },
    {
      block: 'Como a IA pode te ajudar',
      key: 'ia_ajuda',
      pdfLabel: 'Como a IA ajuda',
      q: 'Como você imagina que a IA poderia te ajudar?',
      hint: 'Não precisa ser técnico. Descreva o resultado que quer, como se tivesse contratando um assistente.',
      type: 'textarea',
      placeholder: 'Queria que respondesse o WhatsApp com as informações certas e só me chamasse quando fosse algo que eu preciso resolver pessoalmente.',
    },
    {
      block: 'Como a IA pode te ajudar',
      key: 'nao_delegar',
      pdfLabel: 'Não delegar pra IA',
      q: 'Quais tarefas você acha que NÃO dá pra delegar?',
      hint: 'Selecione tudo que só você pode fazer. Seus agentes vão respeitar esses limites.',
      type: 'multi-choice',
      recommended: false,
      options: [
        { value: 'precificar_grandes',    label: 'Decidir preço de encomendas grandes / personalizadas' },
        { value: 'reclamacoes',           label: 'Resolver reclamações e problemas' },
        { value: 'negociar_desconto',     label: 'Negociar descontos com clientes' },
        { value: 'fornecedores',          label: 'Negociar com fornecedores' },
        { value: 'clientes_vip',          label: 'Atender clientes especiais / VIP' },
        { value: 'decisoes_negocio',      label: 'Decisões estratégicas do negócio' },
      ],
      otherKey: 'nao_delegar_outros',
      otherLabel: 'Outra tarefa que só eu faço',
      otherPlaceholder: 'Descreva outras tarefas que você não quer que a IA faça...',
    },

 
    {
      block: 'Quando chamar você',
      key: 'extra_agentes',
      pdfLabel: 'Observações extras',
      q: 'Última pergunta: tem algo mais que queira dizer pros seus agentes?',
      hint: 'Campo livre. Qualquer coisa que não foi coberta. Se não tiver, pode finalizar.',
      type: 'textarea',
      placeholder: '',
    },
  ];

  // Ordem das partes (pra "Parte X de N" nas telas de transição)
  const wizardSections = wizardQuestions
    .filter(q => q.sectionIntro)
    .map(q => q.block);

  const WIZARD_STORAGE_KEY = 'squad-wizard-answers-v3';
  const wizard = document.getElementById('wizard');
  const wizardCard = document.getElementById('wizard-card');
  const wizardFill = document.getElementById('wizard-progress-fill');
  const wizardProgressText = document.getElementById('wizard-progress-text');
  const wizardCloseBtn = document.getElementById('wizard-close');
  const wizardSkipBtn = document.getElementById('wizard-skip');
  const startWizardBtn = document.getElementById('start-wizard-btn');

  const wizardState = {
    answers: {},
    currentIndex: 0,
    completed: false,
  };

  function wizardLoad() {
    try {
      const raw = localStorage.getItem(WIZARD_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        wizardState.answers = parsed.answers || {};
        wizardState.currentIndex = Math.min(parsed.currentIndex || 0, wizardQuestions.length);
        wizardState.completed = !!parsed.completed;
      }
    } catch (e) {}
  }
  function wizardSave() {
    try {
      localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify(wizardState));
    } catch (e) {}
  }

  function wizardOpen() {
    wizardLoad();
    if (wizardState.completed) {
      renderDone(true);
    } else {
      renderQuestion(wizardState.currentIndex, 'forward');
    }
    document.body.classList.add('in-wizard');
    wizard.setAttribute('aria-hidden', 'false');
    setTimeout(() => {
      const input = wizardCard.querySelector('.wizard-input, .wizard-textarea');
      if (input) input.focus();
    }, 350);
  }
  function wizardClose() {
    document.body.classList.remove('in-wizard');
    wizard.setAttribute('aria-hidden', 'true');
  }

  function updateWizardProgress() {
    const total = wizardQuestions.length;
    const current = Math.min(wizardState.currentIndex + 1, total);
    const pct = wizardState.completed ? 100 : Math.round((current - 1) / total * 100);
    wizardFill.style.width = pct + '%';
    wizardProgressText.textContent = wizardState.completed ? 'Concluído' : current + ' de ' + total;
    wizardSkipBtn.style.visibility = wizardState.completed ? 'hidden' : 'visible';
  }

  function hasAnswer(q) {
    const ans = wizardState.answers[q.key];
    if (q.type === 'multi-choice') return Array.isArray(ans) && ans.length > 0;
    if (q.type === 'single-choice' || q.type === 'choice-with-followup') return !!ans;
    return typeof ans === 'string' && ans.trim().length > 0;
  }
  function updateNextButton() {
    const nextBtn = document.getElementById('wizard-next');
    if (!nextBtn) return;
    const q = wizardQuestions[wizardState.currentIndex];
    if (!q) return;
    nextBtn.disabled = !hasAnswer(q);
  }

  // ---- Wizard: construtores de HTML (puros) por tipo de pergunta ----

  // Cresce uma textarea pra caber o conteúdo (com teto).
  function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 180) + 'px';
  }

  // Corpo de uma pergunta de texto / textarea (com chips de sugestão opcionais).
  function buildTextBody(q) {
    const value = escapeAttr(wizardState.answers[q.key] || '');
    const ph = escapeAttr(q.placeholder || '');
    let html = q.type === 'textarea'
      ? '<textarea class="wizard-textarea" id="wizard-current-input" placeholder="' + ph + '" rows="2">' + value + '</textarea>'
      : '<input type="text" class="wizard-input" id="wizard-current-input" placeholder="' + ph + '" value="' + value + '" />';

    if (Array.isArray(q.examples) && q.examples.length) {
      const splitRe = q.type === 'textarea' ? /\n+/ : /,\s*/;
      const savedTokens = (wizardState.answers[q.key] || '')
        .split(splitRe).map(s => s.trim()).filter(Boolean);
      html += '<div class="wizard-examples">' +
        '<span class="wizard-examples-label">Sugestões rápidas:</span>' +
        '<div class="wizard-chips">';
      q.examples.forEach(ex => {
        const isSel = savedTokens.includes(ex);
        html += '<button type="button" class="wizard-chip' + (isSel ? ' is-selected' : '') + '">' +
          escapeHtml(ex) + '</button>';
      });
      html += '</div></div>';
    }
    return html;
  }

  // Corpo de single-choice / choice-with-followup.
  function buildChoiceBody(q) {
    const selectedValue = wizardState.answers[q.key] || '';
    let html = '<div class="wizard-options" role="radiogroup">';
    q.options.forEach(opt => {
      const isSelected = selectedValue === opt.value;
      html += '<button type="button" class="wizard-option' + (isSelected ? ' is-selected' : '') + '" role="radio" aria-checked="' + isSelected + '" data-value="' + escapeAttr(opt.value) + '">' +
        '<span class="wizard-option-marker"></span>' +
        '<span class="wizard-option-text">' +
          '<strong>' + escapeHtml(opt.label) + '</strong>' +
          (opt.desc ? '<span>' + escapeHtml(opt.desc) + '</span>' : '') +
        '</span>' +
        (opt.recommended ? '<span class="tag-recommended wizard-option-rec">recomendado</span>' : '') +
      '</button>';
    });
    if (q.type === 'choice-with-followup') {
      const selectedOpt = q.options.find(o => o.value === selectedValue);
      const showFollowup = selectedOpt && selectedOpt.followup;
      const fpValue = escapeAttr(wizardState.answers[q.followupKey] || '');
      html += '<div class="wizard-followup' + (showFollowup ? '' : ' is-hidden') + '">';
      if (q.followupHint) html += '<p class="wizard-followup-hint">' + escapeHtml(q.followupHint) + '</p>';
      html += '<input type="text" class="wizard-input wizard-followup-input" placeholder="' + escapeAttr(q.followupPlaceholder || '') + '" value="' + fpValue + '" />';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // Corpo de multi-choice (com campo "outros" opcional).
  function buildMultiBody(q) {
    const selectedValues = Array.isArray(wizardState.answers[q.key]) ? wizardState.answers[q.key] : [];
    let html = '<div class="wizard-options">';
    q.options.forEach(opt => {
      const isSelected = selectedValues.includes(opt.value);
      html += '<button type="button" class="wizard-option is-multi' + (isSelected ? ' is-selected' : '') + '" aria-pressed="' + isSelected + '" data-value="' + escapeAttr(opt.value) + '">' +
        '<span class="wizard-option-marker"></span>' +
        '<span class="wizard-option-text"><strong>' + escapeHtml(opt.label) + '</strong></span>' +
      '</button>';
    });
    if (q.otherKey) {
      const otherSelected = selectedValues.includes('__other__');
      const otherValue = escapeAttr(wizardState.answers[q.otherKey] || '');
      html += '<button type="button" class="wizard-option is-multi' + (otherSelected ? ' is-selected' : '') + '" aria-pressed="' + otherSelected + '" data-value="__other__">' +
        '<span class="wizard-option-marker"></span>' +
        '<span class="wizard-option-text"><strong>' + escapeHtml(q.otherLabel || 'Outros') + '</strong></span>' +
      '</button>';
      html += '<div class="wizard-other' + (otherSelected ? '' : ' is-hidden') + '">';
      html += '<textarea class="wizard-textarea wizard-other-input" placeholder="' + escapeAttr(q.otherPlaceholder || '') + '" rows="2">' + otherValue + '</textarea>';
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  // Escolhe o construtor de corpo certo pro tipo da pergunta.
  function buildQuestionBody(q) {
    if (q.type === 'text' || q.type === 'textarea') return buildTextBody(q);
    if (q.type === 'single-choice' || q.type === 'choice-with-followup') return buildChoiceBody(q);
    if (q.type === 'multi-choice') return buildMultiBody(q);
    return '';
  }

  // Rodapé com os botões Voltar / Pular / Próximo.
  function buildQuestionActions(index) {
    const isLast = index === wizardQuestions.length - 1;
    return '<div class="wizard-actions">' +
      '<button class="wizard-back" type="button" id="wizard-back"' + (index === 0 ? ' disabled' : '') + '>' +
        '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M9 3l-4 4 4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        'Voltar' +
      '</button>' +
      '<div class="wizard-actions-right">' +
        '<button class="wizard-next-skip" type="button">Pular</button>' +
        '<button class="wizard-next" type="button" id="wizard-next" disabled>' +
          (isLast ? 'Finalizar' : 'Próximo') +
          '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</button>' +
      '</div>' +
    '</div>';
  }

  // ---- Wizard: ligadores de eventos por tipo de campo ----

  // Texto/textarea: salva ao digitar, cresce a textarea, Enter avança.
  function bindTextInput(q) {
    const input = document.getElementById('wizard-current-input');
    if (!input) return;
    input.addEventListener('input', () => {
      wizardState.answers[q.key] = input.value.trim();
      wizardSave();
      updateNextButton();
      if (q.type === 'textarea') autoGrow(input);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (q.type !== 'textarea' || (e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        advance();
      }
    });
    if (q.type === 'textarea' && input.value) autoGrow(input);
    setTimeout(() => input.focus(), 50);
    bindSuggestionChips(q, input);
  }

  // Chips de sugestão: ligam/desligam o texto no campo, preservando o que foi digitado.
  function bindSuggestionChips(q, input) {
    if (!Array.isArray(q.examples) || !q.examples.length) return;
    const sep = q.type === 'textarea' ? '\n' : ', ';
    const splitRe = q.type === 'textarea' ? /\n+/ : /,\s*/;
    wizardCard.querySelectorAll('.wizard-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        chip.classList.toggle('is-selected');
        const selectedChips = Array.from(wizardCard.querySelectorAll('.wizard-chip.is-selected'))
          .map(c => c.textContent);
        const tokens = input.value.split(splitRe).map(s => s.trim()).filter(Boolean);
        const freeTokens = tokens.filter(t => !q.examples.includes(t));
        input.value = freeTokens.concat(selectedChips).join(sep);
        input.dispatchEvent(new Event('input'));
        if (q.type === 'textarea') autoGrow(input);
      });
    });
  }

  // Marca/desmarca uma opção multi-choice e revela o campo "outros" quando preciso.
  function toggleMultiOption(q, opt, value) {
    let arr = Array.isArray(wizardState.answers[q.key]) ? wizardState.answers[q.key].slice() : [];
    const idx = arr.indexOf(value);
    if (idx >= 0) {
      arr.splice(idx, 1);
      opt.classList.remove('is-selected');
      opt.setAttribute('aria-pressed', 'false');
    } else {
      arr.push(value);
      opt.classList.add('is-selected');
      opt.setAttribute('aria-pressed', 'true');
    }
    wizardState.answers[q.key] = arr;
    if (value === '__other__') {
      const otherDiv = wizardCard.querySelector('.wizard-other');
      if (otherDiv) {
        const showing = arr.includes('__other__');
        otherDiv.classList.toggle('is-hidden', !showing);
        if (showing) {
          const ta = otherDiv.querySelector('textarea');
          if (ta) setTimeout(() => ta.focus(), 50);
        }
      }
    }
  }

  // Seleciona uma opção single/followup e revela o follow-up quando preciso.
  function selectSingleOption(q, opts, opt, value, isFollowup) {
    opts.forEach(o => { o.classList.remove('is-selected'); o.setAttribute('aria-checked', 'false'); });
    opt.classList.add('is-selected');
    opt.setAttribute('aria-checked', 'true');
    wizardState.answers[q.key] = value;
    if (!isFollowup) return;
    const selectedOpt = q.options.find(o => o.value === value);
    const followupDiv = wizardCard.querySelector('.wizard-followup');
    if (!followupDiv) return;
    const showFollowup = selectedOpt && selectedOpt.followup;
    followupDiv.classList.toggle('is-hidden', !showFollowup);
    if (showFollowup) {
      const inp = followupDiv.querySelector('input');
      if (inp) setTimeout(() => inp.focus(), 50);
    } else if (q.followupKey) {
      delete wizardState.answers[q.followupKey];
    }
  }

  // Liga os botões de opção (single/multi/followup).
  function bindOptions(q) {
    const isMulti = q.type === 'multi-choice';
    const isFollowup = q.type === 'choice-with-followup';
    const opts = wizardCard.querySelectorAll('.wizard-option');
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        const value = opt.dataset.value;
        if (isMulti) toggleMultiOption(q, opt, value);
        else selectSingleOption(q, opts, opt, value, isFollowup);
        wizardSave();
        updateNextButton();
      });
    });
  }

  // Campo de follow-up (choice-with-followup).
  function bindFollowupInput(q) {
    const followupInput = wizardCard.querySelector('.wizard-followup-input');
    if (!followupInput) return;
    followupInput.addEventListener('input', () => {
      wizardState.answers[q.followupKey] = followupInput.value.trim();
      wizardSave();
    });
    followupInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); advance(); }
    });
  }

  // Campo livre "outros" (multi-choice).
  function bindOtherInput(q) {
    const otherInput = wizardCard.querySelector('.wizard-other-input');
    if (!otherInput) return;
    otherInput.addEventListener('input', () => {
      wizardState.answers[q.otherKey] = otherInput.value.trim();
      wizardSave();
      autoGrow(otherInput);
    });
    if (otherInput.value) autoGrow(otherInput);
  }

  // Botões de navegação do rodapé.
  function bindQuestionActions() {
    document.getElementById('wizard-next').addEventListener('click', advance);
    document.getElementById('wizard-back').addEventListener('click', goBack);
    const inlineSkip = wizardCard.querySelector('.wizard-next-skip');
    if (inlineSkip) inlineSkip.addEventListener('click', skip);
  }

  // Agrupa as perguntas pelo seu `block`, preservando a ordem de aparição.
  function groupQuestionsByBlock() {
    const blocks = [];
    const byName = {};
    wizardQuestions.forEach(q => {
      if (!byName[q.block]) {
        byName[q.block] = { name: q.block, rows: [] };
        blocks.push(byName[q.block]);
      }
      byName[q.block].rows.push(q);
    });
    return blocks;
  }

  function renderQuestion(index, direction, opts) {
    direction = direction || 'forward';
    opts = opts || {};
    const leavingClass = direction === 'back' ? 'is-leaving-back' : 'is-leaving-forward';
    const enteringClass = direction === 'back' ? 'is-entering-back' : 'is-entering-forward';

    // Ao avançar pra 1ª pergunta de uma parte, mostra a tela de transição da seção antes.
    const sectionStart = wizardQuestions[index];
    if (direction === 'forward' && sectionStart && sectionStart.sectionIntro && !opts.skipIntro) {
      renderSectionIntro(index, direction);
      return;
    }

    const buildAndShow = () => {
      const q = wizardQuestions[index];
      const introHtml = q.intro ? '<p class="wizard-intro">' + escapeHtml(q.intro) + '</p>' : '';

      wizardCard.innerHTML =
        '<div class="wizard-eyebrow">' + escapeHtml(q.block) + '</div>' +
        '<h1 class="wizard-q" id="wizard-question-text">' + escapeHtml(q.q) +
          (q.recommended ? ' <span class="tag-recommended">recomendado</span>' : '') +
        '</h1>' +
        (q.hint ? '<p class="wizard-hint">' + escapeHtml(q.hint) + '</p>' : '') +
        introHtml +
        buildQuestionBody(q) +
        buildQuestionActions(index);

      wizardCard.classList.remove('is-leaving-forward', 'is-leaving-back');
      wizardCard.classList.add(enteringClass);
      setTimeout(() => wizardCard.classList.remove(enteringClass), 360);

      // Liga só os campos que esta pergunta realmente renderizou (cada ligador
      // é um no-op se o campo não existir).
      bindTextInput(q);
      bindOptions(q);
      bindFollowupInput(q);
      bindOtherInput(q);
      bindQuestionActions();

      wizardState.currentIndex = index;
      wizardSave();
      updateWizardProgress();
      updateNextButton();
    };

    if (wizardCard.children.length) {
      wizardCard.classList.add(leavingClass);
      setTimeout(buildAndShow, 220);
    } else {
      buildAndShow();
    }
  }

  // Tela de transição entre as partes do wizard
  function renderSectionIntro(index, direction) {
    direction = direction || 'forward';
    const leavingClass = direction === 'back' ? 'is-leaving-back' : 'is-leaving-forward';
    const enteringClass = direction === 'back' ? 'is-entering-back' : 'is-entering-forward';

    const buildAndShow = () => {
      const q = wizardQuestions[index];
      const partNum = wizardSections.indexOf(q.block) + 1;
      const totalParts = wizardSections.length;

      wizardCard.innerHTML =
        '<div class="wizard-section-intro">' +
          '<span class="wizard-section-label">Parte ' + partNum + ' de ' + totalParts + '</span>' +
          '<h2 class="wizard-section-title" id="wizard-question-text">' + escapeHtml(q.block) + '</h2>' +
          '<p class="wizard-section-desc">' + escapeHtml(q.sectionIntro) + '</p>' +
          '<button class="wizard-section-continue" type="button" id="wizard-section-continue">Continuar →</button>' +
        '</div>';

      wizardCard.classList.remove('is-leaving-forward', 'is-leaving-back');
      wizardCard.classList.add(enteringClass);
      setTimeout(() => wizardCard.classList.remove(enteringClass), 360);

      const continueBtn = document.getElementById('wizard-section-continue');
      if (continueBtn) {
        continueBtn.addEventListener('click', () => renderQuestion(index, 'forward', { skipIntro: true }));
        setTimeout(() => continueBtn.focus(), 50);
      }

      wizardState.currentIndex = index;
      wizardSave();
      updateWizardProgress();
    };

    if (wizardCard.children.length) {
      wizardCard.classList.add(leavingClass);
      setTimeout(buildAndShow, 220);
    } else {
      buildAndShow();
    }
  }

  function advance() {
    const idx = wizardState.currentIndex;
    if (idx >= wizardQuestions.length - 1) {
      wizardState.completed = true;
      wizardSave();
      renderDone(false);
    } else {
      renderQuestion(idx + 1, 'forward');
    }
  }
  function goBack() {
    const idx = wizardState.currentIndex;
    if (idx <= 0) return;
    renderQuestion(idx - 1, 'back');
  }
  function skip() {
    if (wizardState.completed) return;
    advance();
  }

  function renderDone(isResume) {
    wizardCard.classList.remove('is-leaving-forward', 'is-leaving-back');
    const direction = isResume ? 'forward' : 'forward';
    wizardCard.classList.add('is-entering-' + direction);
    setTimeout(() => wizardCard.classList.remove('is-entering-' + direction), 360);

    // Build summary grouped by block
    const blocks = groupQuestionsByBlock();
    let summaryHtml = '';
    blocks.forEach(b => {
      summaryHtml += '<div class="wizard-summary-block">';
      summaryHtml += '<div class="wizard-summary-eyebrow">' + b.name + '</div>';
      b.rows.forEach(q => {
        const formatted = formatAnswer(q);
        const aHtml = formatted ? '<span class="a">' + escapeHtml(formatted) + '</span>' : '<span class="a empty">não respondida</span>';
        const qIdx = wizardQuestions.indexOf(q);
        summaryHtml += '<div class="wizard-summary-row">' +
          '<span class="q">' + escapeHtml(q.q) + '</span>' +
          aHtml +
          '<button class="edit" type="button" data-edit="' + qIdx + '" aria-label="Editar resposta">editar</button>' +
        '</div>';
      });
      summaryHtml += '</div>';
    });

    wizardCard.innerHTML =
      '<div class="wizard-done">' +
        '<div class="wizard-done-mark" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        '<h1 id="wizard-question-text">Pronto. Seu time já tem o briefing.</h1>' +
        '<p class="wizard-done-sub">A gente organizou suas respostas num PDF estruturado pra alimentar o Waz, a Maky e o Fin de uma vez só.</p>' +
        '<div class="wizard-summary">' + summaryHtml + '</div>' +
        '<div class="wizard-done-actions">' +
          '<button class="wizard-download" type="button" id="wizard-download">' +
            '<svg viewBox="0 0 16 16" fill="none"><path d="M8 2v9m0 0l-3-3m3 3l3-3M3 14h10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            'Baixar PDF' +
          '</button>' +
          '<button class="wizard-review" type="button" id="wizard-review">Revisar respostas</button>' +
        '</div>' +
        '<p class="wizard-done-aux">Agora envie esse PDF na conversa com o <b>Waz</b> em <b>Assistentes</b>. Ele lê e distribui as informações pra Maky e Fin automaticamente.</p>' +
      '</div>';

    document.getElementById('wizard-download').addEventListener('click', downloadPDF);
    document.getElementById('wizard-review').addEventListener('click', () => {
      wizardState.completed = false;
      wizardState.currentIndex = 0;
      wizardSave();
      renderQuestion(0, 'back');
    });
    wizardCard.querySelectorAll('button[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.edit, 10);
        wizardState.completed = false;
        wizardSave();
        renderQuestion(idx, 'back');
      });
    });

    updateWizardProgress();
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatAnswer(q) {
    const ans = wizardState.answers[q.key];
    if (q.type === 'multi-choice') {
      const arr = Array.isArray(ans) ? ans : [];
      if (!arr.length) return '';
      const labels = arr.filter(v => v !== '__other__').map(v => {
        const opt = q.options.find(o => o.value === v);
        return opt ? opt.label : v;
      });
      if (arr.includes('__other__')) {
        const otherText = wizardState.answers[q.otherKey];
        labels.push((q.otherLabel || 'Outros') + (otherText ? ': ' + otherText : ''));
      }
      return labels.join('; ');
    }
    if (q.type === 'single-choice' || q.type === 'choice-with-followup') {
      if (!ans) return '';
      const opt = q.options.find(o => o.value === ans);
      let label = opt ? opt.label : String(ans);
      if (q.type === 'choice-with-followup') {
        const fp = wizardState.answers[q.followupKey];
        if (fp) label += ' — ' + fp;
      }
      return label;
    }
    return ans ? String(ans) : '';
  }

  // O font padrão do jsPDF não suporta emoji — remove pra não quebrar o texto do PDF
  function pdfSafe(str) {
    return String(str == null ? '' : str)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\u{2300}-\u{23FF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}]/gu, '')
      .replace(/\s{2,}/g, ' ')          // colapsa espaços
      .replace(/\s+([—/:])\s*$/, '')    // remove separador solto no fim
      .trim();
  }

  function downloadPDF() {
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('PDF ainda carregando — tenta de novo em 1 segundo.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(17, 24, 39);
    doc.text('Perfil do Negócio', margin, y);
    y += 24;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(107, 114, 128);
    doc.text('Gerado pelo Playbook Squad', margin, y);
    y += 22;
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, pageWidth - margin, y);
    y += 26;

    // Mini-prompt pro Waz (instrução no topo do documento)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 24, 39);
    const promptLines = doc.splitTextToSize(
      'Waz, preciso que siga essas diretrizes para atender os clientes do meu negócio:',
      maxWidth
    );
    promptLines.forEach(line => {
      if (y > pageHeight - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y); y += 16;
    });
    y += 14;

    const blocks = groupQuestionsByBlock();

    blocks.forEach(block => {
      // Só inclui no PDF as perguntas respondidas; pula a parte inteira se vazia
      const filledRows = block.rows.filter(q => !!formatAnswer(q));
      if (!filledRows.length) return;

      if (y > pageHeight - 120) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(block.name.toUpperCase(), margin, y);
      y += 16;
      doc.setDrawColor(17, 24, 39);
      doc.setLineWidth(1.4);
      doc.line(margin, y - 4, margin + 32, y - 4);
      doc.setLineWidth(0.5);
      y += 12;

      filledRows.forEach(q => {
        const label = q.pdfLabel || q.q;
        const answer = formatAnswer(q).replace(/\s*\n\s*/g, ' / ');
        const bullet = pdfSafe('•  ' + label + ': ' + answer);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(17, 24, 39);
        const lines = doc.splitTextToSize(bullet, maxWidth - 10);
        lines.forEach((line, i) => {
          if (y > pageHeight - margin) { doc.addPage(); y = margin; }
          doc.text(line, margin + (i === 0 ? 0 : 12), y);
          y += 15;
        });
        y += 6;
      });
      y += 14;
    });

    // (8) SEÇÃO FIXA "INSTRUÇÕES ADICIONAIS" — sempre incluída no fim do documento,
    //     com campos em branco para o cliente preencher depois (consultar antes de
    //     responder / outras informações). Não vem de nenhuma pergunta do wizard.
    if (y > pageHeight - 170) { doc.addPage(); y = margin; }
    doc.setDrawColor(229, 231, 235);            // separador antes da seção
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 24;
    doc.setFont('helvetica', 'bold');           // título da seção
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text('INSTRUÇÕES ADICIONAIS', margin, y);
    y += 16;
    doc.setDrawColor(17, 24, 39);
    doc.setLineWidth(1.4);
    doc.line(margin, y - 4, margin + 32, y - 4);
    doc.setLineWidth(0.5);
    y += 20;
    [
      'Assuntos para me consultar antes de responder:',
      'Outras informações importantes:',
    ].forEach(label => {
      if (y > pageHeight - margin - 30) { doc.addPage(); y = margin; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(17, 24, 39);
      doc.text(label, margin, y);
      y += 16;
      doc.setFont('helvetica', 'italic');        // placeholder pro cliente preencher
      doc.setTextColor(156, 163, 175);
      doc.text('[Deixar em branco para cliente preencher depois]', margin, y);
      y += 30;
    });

    const totalPages = doc.internal.getNumberOfPages();
    const today = new Date().toLocaleDateString('pt-BR');
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(156, 163, 175);
      doc.text('Gerado em ' + today + '  ·  Squad', margin, pageHeight - 24);
      doc.text(i + '/' + totalPages, pageWidth - margin, pageHeight - 24, { align: 'right' });
    }

    doc.save('perfil-negocio-squad.pdf');
  }

  if (startWizardBtn) startWizardBtn.addEventListener('click', wizardOpen);
  if (wizardCloseBtn) wizardCloseBtn.addEventListener('click', wizardClose);
  if (wizardSkipBtn) wizardSkipBtn.addEventListener('click', skip);

  document.addEventListener('keydown', (e) => {
    if (!document.body.classList.contains('in-wizard')) return;
    if (e.key === 'Escape') wizardClose();
  });

  // ============ (NOVO) Gerador de prompt "O que o Waz não deve fazer" ============
  // Seção independente na página (abaixo do botão "Configurar meus agentes").
  // É 100% opcional: não interfere no fluxo do wizard nem na navegação das páginas.
  // Junta as situações marcadas + a observação livre e gera um texto pronto pro Waz,
  // exibido num modal com botão de copiar.
  const wazGuard = document.getElementById('waz-guard');
  if (wazGuard) {
    const outroCheck = document.getElementById('waz-guard-outro-check');
    const outroInput = document.getElementById('waz-guard-outro');
    const extraInput = document.getElementById('waz-guard-extra');
    const genBtn     = document.getElementById('waz-guard-generate');
    const modal      = document.getElementById('waz-modal');
    const modalText  = document.getElementById('waz-modal-text');
    const copyBtn    = document.getElementById('waz-modal-copy');
    const copyLabel  = copyBtn ? copyBtn.querySelector('.waz-copy-label') : null;
    const closeBtn   = document.getElementById('waz-modal-close');
    const backdrop   = document.getElementById('waz-modal-backdrop');

    // "Outro" mostra/esconde o campo de texto livre correspondente
    if (outroCheck && outroInput) {
      outroCheck.addEventListener('change', () => {
        outroInput.classList.toggle('is-hidden', !outroCheck.checked);
        if (outroCheck.checked) outroInput.focus();
      });
    }

    // Monta o prompt no formato pedido, incluindo só o que foi preenchido
    function buildWazPrompt() {
      const items = [];
      wazGuard.querySelectorAll('.waz-check-box:checked').forEach(c => {
        if (c.value === '__outro__') {
          const o = (outroInput.value || '').trim();
          if (o) items.push(o);                 // usa o texto do "Outro", se houver
        } else {
          items.push(c.value);
        }
      });
      const extra = (extraInput.value || '').trim();

      let out = 'Waz, por favor siga estas instruções ao me ajudar a atender meus clientes:\n\n';
      out += 'Assuntos para me consultar antes de responder:\n';
      out += items.length ? items.map(i => '- ' + i).join('\n') : '- (nenhum por enquanto)';
      if (extra) out += '\n\nOutras informações importantes:\n' + extra;  // só entra se houver texto
      return out;
    }

    function openModal(text) {
      modalText.textContent = text;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      copyBtn.classList.remove('is-copied');
      if (copyLabel) copyLabel.textContent = 'Copiar texto';
    }
    function closeModal() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }

    if (genBtn)   genBtn.addEventListener('click', () => openModal(buildWazPrompt()));
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    // Copiar pra área de transferência (com fallback pra execCommand)
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const text = modalText.textContent;
        let ok = false;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            ok = true;
          }
        } catch (e) { ok = false; }
        if (!ok) {                              // fallback p/ contextos sem Clipboard API
          const ta = document.createElement('textarea');
          ta.value = text;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          try { ok = document.execCommand('copy'); } catch (e) {}
          document.body.removeChild(ta);
        }
        copyBtn.classList.add('is-copied');     // feedback visual
        if (copyLabel) copyLabel.textContent = ok ? 'Copiado!' : 'Copie manualmente';
        setTimeout(() => {
          copyBtn.classList.remove('is-copied');
          if (copyLabel) copyLabel.textContent = 'Copiar texto';
        }, 1800);
      });
    }
  }

  /* ---- Testimonial Card Expand/Collapse ---- */
  const tcardOverlay = document.getElementById('tcard-overlay');
  const tcardClose = document.getElementById('tcard-close');

  if (tcardOverlay) {
    const testimonialData = [
      {
        name: 'Brigadayros',
        role: 'Confeitaria artesanal · São Paulo',
        quote: '"Antes do Squad, eu passava 4 horas por dia só respondendo WhatsApp. Agora o Waz cuida de tudo e eu consigo focar na produção. As vendas aumentaram porque nenhuma cliente fica sem resposta, mesmo de madrugada." (placeholder)',
        result: '-4h/dia no WhatsApp (placeholder)',
      },
      {
        name: 'Doguh Confeitaria',
        role: 'Doces finos & bolos · São Paulo',
        quote: '"A Maky mudou meu Instagram completamente. Eu não tinha tempo pra criar conteúdo e postava uma vez por semana, quando lembrava. Agora tenho posts profissionais saindo toda semana e meus seguidores estão virando clientes." (placeholder)',
        result: '+3x posts por semana (placeholder)',
      },
      {
        name: 'Oito Oitenta',
        role: 'Cookies artesanais · São Paulo',
        quote: '"O Fin me salvou. Eu não sabia quanto tava lucrando de verdade porque não controlava nada. Agora tenho fluxo de caixa atualizado, sei exatamente quem pagou e quem não pagou, e os links de Pix vão direto pelo WhatsApp." (placeholder)',
        result: '100% controle financeiro (placeholder)',
      }
    ];

    let scrollYBeforeOpen = 0;

    function openTestimonial(index) {
      const data = testimonialData[index];
      if (!data) return;

      document.getElementById('tcard-o-role').textContent = data.role;
      document.getElementById('tcard-o-name').textContent = data.name.toLowerCase() + '.';
      document.getElementById('tcard-o-text').textContent = data.quote;

      const resultEl = document.getElementById('tcard-o-result');
      if (resultEl) resultEl.textContent = data.result;

      scrollYBeforeOpen = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollYBeforeOpen + 'px';
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';

      tcardOverlay.classList.add('is-open');
      tcardOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeTestimonial() {
      tcardOverlay.classList.remove('is-open');
      tcardOverlay.setAttribute('aria-hidden', 'true');

      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo({ top: scrollYBeforeOpen, behavior: 'instant' });
    }

    document.querySelectorAll('.tcard').forEach(card => {
      card.addEventListener('click', () => {
        const index = parseInt(card.dataset.index, 10);
        openTestimonial(index);
      });
    });

    if (tcardClose) {
      tcardClose.addEventListener('click', closeTestimonial);
    }

    tcardOverlay.querySelector('.tcard-overlay-backdrop').addEventListener('click', closeTestimonial);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && tcardOverlay.classList.contains('is-open')) {
        closeTestimonial();
      }
    });
  }

  /* ---- Situation Question (Catálogo): pick a path, animate the swap ---- */
  // First pick: the picker (.situation-question) slides out to the right, then
  // the chosen path (.situation-content) slides in from the left. Switching
  // paths afterwards just slides the newly chosen one in.
  const motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function revealSituationPath(scope, target) {
    scope.querySelectorAll('.situation-content').forEach(c => {
      c.classList.remove('is-visible', 'is-entering');
    });
    target.classList.add('is-visible');
    void target.offsetWidth;            // reflow so the slide-in restarts
    target.classList.add('is-entering');
  }

  function showSituationContent(scope, targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    // Mark the chosen option.
    scope.querySelectorAll('.situation-opt').forEach(o => {
      o.classList.toggle('is-selected', o.dataset.shows === targetId);
    });

    const stage = scope.querySelector('.situation-stage') || scope;
    const question = scope.querySelector('.situation-question');
    const pickerVisible = question &&
      !question.classList.contains('is-leaving') &&
      getComputedStyle(question).display !== 'none';

    if (!pickerVisible) {
      // Already past the picker (switching paths) — just slide the new one in.
      revealSituationPath(scope, target);
      return;
    }

    if (motionReduced) {
      question.style.display = 'none';
      revealSituationPath(scope, target);
      return;
    }

    // Lock the height so the stage doesn't collapse while the picker is absolute.
    stage.style.minHeight = stage.offsetHeight + 'px';
    question.classList.add('is-leaving');

    let swapped = false;
    const afterLeave = () => {
      if (swapped) return;
      swapped = true;
      question.style.display = 'none';
      revealSituationPath(scope, target);
      target.addEventListener('animationend', () => { stage.style.minHeight = ''; }, { once: true });
    };
    question.addEventListener('animationend', afterLeave, { once: true });
    setTimeout(afterLeave, 600); // fallback if animationend doesn't fire
  }

  document.querySelectorAll('.situation-opt, .situation-switch').forEach(el => {
    el.addEventListener('click', () => {
      const scope = el.closest('.stage') || document;
      showSituationContent(scope, el.dataset.shows);
    });
  });

  // ============ Flow Explorer (training section spotlight) ============
  const flowExplorer = document.querySelector('.flow-explorer');
  if (flowExplorer) {
    const flowItems = Array.from(flowExplorer.querySelectorAll('.flow-item'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let flowActiveIndex = 0;
    let flowInView = false;

    const setFlowActive = (idx) => {
      flowActiveIndex = idx;
      flowItems.forEach((it, i) => {
        const active = i === idx;
        it.classList.toggle('is-active', active);
        it.classList.remove('is-running');
        it.setAttribute('aria-selected', String(active));
      });
      if (flowInView && !reducedMotion) {
        void flowItems[idx].offsetWidth; // reflow to restart bar animation
        flowItems[idx].classList.add('is-running');
      }
    };

    // Pausa: hover (temporária) OU clique (travada). A barra congela em qualquer um.
    let flowHoverPause = false;
    let flowClickLock = false;
    const syncFlowPause = () => {
      flowExplorer.classList.toggle('is-paused', flowHoverPause || flowClickLock);
    };

    flowItems.forEach((item, idx) => {
      const fill = item.querySelector('.flow-bar-fill');
      if (fill) {
        fill.addEventListener('animationend', (e) => {
          // Só avança quando a barra de preenchimento completa (não no loop do gradiente)
          if (e.animationName !== 'flow-fill') return;
          if (flowExplorer.classList.contains('is-paused')) return;
          if (idx === flowActiveIndex && flowInView && !reducedMotion) {
            setFlowActive((flowActiveIndex + 1) % flowItems.length);
          }
        });
      }
      // Clicar num card seleciona ele e trava a pausa (tempo pra ler).
      // Clicar de novo no card ativo alterna pausa/retomada.
      item.addEventListener('click', () => {
        if (idx !== flowActiveIndex) {
          flowClickLock = true;
          setFlowActive(idx);
        } else {
          flowClickLock = !flowClickLock;
          if (!flowClickLock) setFlowActive(idx); // retoma com barra nova
        }
        syncFlowPause();
      });
      // Passar o mouse num card o destaca (vira o card em foco), além de pausar.
      item.addEventListener('mouseenter', () => {
        if (idx !== flowActiveIndex) setFlowActive(idx);
      });
      item.addEventListener('focus', () => {
        if (idx !== flowActiveIndex) setFlowActive(idx);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
      });
    });

    // Hover no explorer pausa; sair retoma (a não ser que tenha travado por clique).
    flowExplorer.addEventListener('mouseenter', () => { flowHoverPause = true; syncFlowPause(); });
    flowExplorer.addEventListener('mouseleave', () => { flowHoverPause = false; syncFlowPause(); });

    const flowIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        flowInView = e.isIntersecting;
        if (flowInView) {
          setFlowActive(flowActiveIndex);
        } else {
          flowItems.forEach(i => i.classList.remove('is-running'));
        }
      });
    }, { threshold: 0.2 });
    flowIO.observe(flowExplorer);
  }


  // ============ Fluxo de integração (Etapa 3): intro -> checklist -> agendar ============
  const intStage = document.getElementById('integration-stage');
  if (intStage) {
    const introSlide = intStage.querySelector('.slide-intro');
    const checklistSlide = intStage.querySelector('.slide-checklist');
    const startBtn = document.getElementById('integration-start');
    const checks = Array.from(intStage.querySelectorAll('.int-check-box'));
    const schedule = document.getElementById('integration-schedule');
    const hint = document.getElementById('integration-locked-hint');

    const setStageHeight = (el) => { if (el) intStage.style.height = el.offsetHeight + 'px'; };

    // Clicar no gatilho: swipe da intro pro checklist
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        setStageHeight(introSlide);            // congela a altura atual (pra transicionar)
        requestAnimationFrame(() => {
          intStage.classList.add('show');
          setStageHeight(checklistSlide);
        });
      });
    }

    // Libera o botão de agendar só quando todos os itens estão marcados
    const syncChecklist = () => {
      const all = checks.length > 0 && checks.every(c => c.checked);
      if (schedule) schedule.classList.toggle('is-locked', !all);
      if (hint) hint.style.display = all ? 'none' : '';
      if (intStage.classList.contains('show')) setStageHeight(checklistSlide); // botão apareceu/sumiu
    };
    checks.forEach(c => c.addEventListener('change', syncChecklist));
    syncChecklist();

    window.addEventListener('resize', () => {
      setStageHeight(intStage.classList.contains('show') ? checklistSlide : introSlide);
    });
  }

  // ============ Personagens espiando (Waz e Maky) alinhados ao .training-cta-block ============
  // Ficam nas bordas (Waz na sidebar/esquerda, Maky na direita) e rolam junto com a seção.
  const wazPeek = document.querySelector('.waz-peek');
  const makyPeek = document.querySelector('.maky-peek');
  const peekApp = document.querySelector('.app');
  const peekCta = document.querySelector('.training-cta-block');
  if (peekApp && peekCta && (wazPeek || makyPeek)) {
    const placePeeks = () => {
      const a = peekApp.getBoundingClientRect();
      const c = peekCta.getBoundingClientRect();
      if (!c.height) return; // app escondido / sem layout ainda
      const centerInApp = (c.top - a.top) + c.height / 2;
      if (wazPeek) {
        wazPeek.style.top = Math.round(centerInApp - wazPeek.offsetHeight / 2) + 'px';
      }
      if (makyPeek) {
        // Maky um pouco acima da linha do Waz
        makyPeek.style.top = Math.round(centerInApp - makyPeek.offsetHeight / 2 - 70) + 'px';
      }
    };
    placePeeks();
    if (wazPeek) wazPeek.addEventListener('load', placePeeks);
    if (makyPeek) makyPeek.addEventListener('load', placePeeks);
    window.addEventListener('load', placePeeks);
    window.addEventListener('resize', placePeeks);
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(placePeeks);
      ro.observe(peekApp);
      const content = document.querySelector('.content');
      if (content) ro.observe(content);
    }
  }
