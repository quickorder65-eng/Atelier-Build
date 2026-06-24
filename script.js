/* ============================================================
   ATELIER BUILS — script.js  v4
   ============================================================ */

/* ─── ANALYTICS TRACKER ────────────────────────────────────── */
(function () {
  'use strict';

  var GA_ID = window.__GA_ID || '';
  var YM_ID = window.__YM_ID || '';

  function track(eventName, params) {
    var p = params || {};

    // Google Analytics 4
    if (typeof gtag === 'function') {
      gtag('event', eventName, p);
    }

    // Yandex.Metrica
    if (typeof ym === 'function' && YM_ID) {
      ym(YM_ID, 'reachGoal', eventName, p);
    }

    // Dev console fallback
    if (!GA_ID && !YM_ID) {
      console.log('[Analytics]', eventName, p);
    }
  }

  window.AB = window.AB || {};
  window.AB.track = track;

  // Page view
  track('page_view');

  // WhatsApp clicks
  document.querySelectorAll('a[href*="wa.me"]').forEach(function (el) {
    el.addEventListener('click', function () { track('whatsapp_click'); });
  });

  // Phone clicks
  document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
    el.addEventListener('click', function () { track('phone_click'); });
  });
})();

/* ─── MOBILE MENU ──────────────────────────────────────────── */
(function () {
  'use strict';

  var brg      = document.getElementById('brg');
  var mob      = document.getElementById('mob');
  var navLinks = document.querySelectorAll('.mob-nav a, .mob-foot .btn');

  function menuToggle(force) {
    var isOpen = (force !== undefined) ? force : !brg.classList.contains('open');
    brg.classList.toggle('open', isOpen);
    mob.classList.toggle('open', isOpen);
    brg.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  if (brg) brg.addEventListener('click', function () { menuToggle(); });

  navLinks.forEach(function (link) {
    link.addEventListener('click', function () { menuToggle(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && brg && brg.classList.contains('open')) menuToggle(false);
  });
})();

/* ─── HEADER SCROLL ────────────────────────────────────────── */
(function () {
  'use strict';
  var hdr = document.getElementById('hdr');
  if (hdr) {
    window.addEventListener('scroll', function () {
      hdr.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }
})();

/* ─── SMOOTH SCROLL ────────────────────────────────────────── */
(function () {
  'use strict';
  var hdr = document.getElementById('hdr');
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var hdrH = hdr ? hdr.offsetHeight : 64;
      window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - hdrH, behavior: 'smooth' });
    });
  });
})();

/* ─── REVEAL ON SCROLL ─────────────────────────────────────── */
(function () {
  'use strict';
  var fiEls = document.querySelectorAll('.fi');
  if (fiEls.length && 'IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -32px 0px' });
    fiEls.forEach(function (el) { obs.observe(el); });
  } else {
    fiEls.forEach(function (el) { el.classList.add('in'); });
  }
})();

/* ─── FAQ ACCORDION ────────────────────────────────────────── */
(function () {
  'use strict';
  document.querySelectorAll('.ai__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item   = this.closest('.ai');
      var body   = item.querySelector('.ai__bd');
      var isOpen = item.classList.contains('open');
      document.querySelectorAll('.ai.open').forEach(function (o) {
        o.classList.remove('open');
        o.querySelector('.ai__btn').setAttribute('aria-expanded', 'false');
        o.querySelector('.ai__bd').style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
})();

/* ─── QUIZ ─────────────────────────────────────────────────── */
(function () {
  'use strict';

  var STEPS   = 6;
  var answers = {};
  var step    = 1;

  var qzFill = document.getElementById('qzFill');
  var qzStep = document.getElementById('qzStep');
  var qzPrev = document.getElementById('qzPrev');
  var qzNext = document.getElementById('qzNext');
  var qzNav  = document.getElementById('qzNav');
  var qzDone = document.getElementById('qzDone');

  function updateUI() {
    if (qzFill) qzFill.style.width = ((step / STEPS) * 100) + '%';
    if (qzStep) qzStep.textContent  = 'Шаг ' + step + ' из ' + STEPS;
    if (qzPrev) qzPrev.style.visibility = step > 1 ? 'visible' : 'hidden';
    if (qzNext) qzNext.textContent = step === STEPS ? 'Отправить' : 'Далее';
  }

  function showStep(n) {
    document.querySelectorAll('.qslide').forEach(function (el) { el.classList.remove('active'); });
    var el = document.querySelector('.qslide[data-step="' + n + '"]');
    if (el) el.classList.add('active');
    updateUI();

    if (n === 4) window.AB && window.AB.track('quiz_step_renovation_type');
    if (n === 5) window.AB && window.AB.track('quiz_step_timeline');
    if (n === 6) window.AB && window.AB.track('quiz_step_contact');
  }

  document.querySelectorAll('.qopt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var q = this.dataset.q;
      if (!q) return;
      this.closest('.qopts').querySelectorAll('.qopt').forEach(function (b) { b.classList.remove('sel'); });
      this.classList.add('sel');
      answers['q' + q] = this.dataset.v;
    });
  });

  function validateContact() {
    var nameEl  = document.getElementById('qName');
    var phoneEl = document.getElementById('qPhone');
    var valid = true;
    if (nameEl && !nameEl.value.trim())  { nameEl.classList.add('err');  valid = false; }
    if (phoneEl && phoneEl.value.replace(/\D/g, '').length < 10) { phoneEl.classList.add('err'); valid = false; }
    return valid;
  }

  ['qName', 'qPhone'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function () { this.classList.remove('err'); });
  });

  if (qzNext) {
    qzNext.addEventListener('click', function () {
      if (step === STEPS) {
        if (!validateContact()) return;
        var nameEl  = document.getElementById('qName');
        var phoneEl = document.getElementById('qPhone');
        answers.name    = nameEl  ? nameEl.value.trim()  : '';
        answers.phone   = phoneEl ? phoneEl.value.replace(/\D/g, '') : '';
        answers.contact = answers['q6'] || '';
        submitQuiz();
      } else {
        var curSlide = document.querySelector('.qslide[data-step="' + step + '"]');
        if (curSlide && curSlide.querySelector('.qopt') && !curSlide.querySelector('.qopt.sel')) {
          curSlide.querySelector('.qopts').classList.add('shake');
          setTimeout(function () { curSlide.querySelector('.qopts').classList.remove('shake'); }, 500);
          return;
        }
        step = Math.min(step + 1, STEPS);
        showStep(step);
      }
    });
  }

  if (qzPrev) {
    qzPrev.addEventListener('click', function () {
      step = Math.max(step - 1, 1);
      showStep(step);
    });
  }

  function submitQuiz() {
    window.AB && window.AB.track('quiz_submit');

    var payload = {
      name:            answers.name,
      phone:           answers.phone,
      objectType:      answers.q1 || '—',
      area:            answers.q2 || '—',
      designProject:   answers.q3 || '—',
      renovationType:  answers.q4 || '—',
      timeline:        answers.q5 || '—',
      preferredContact:answers.q6 || '',
      comment:         ''
    };

    // Primary: POST to /api/leads (CRM + Telegram notification)
    fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (r) {
      if (!r.ok) console.warn('[Quiz] /api/leads returned', r.status);
      window.AB && window.AB.track('crm_lead_created');
    }).catch(function (e) {
      console.warn('[Quiz] /api/leads error:', e.message);
    });

    // Show success state
    document.querySelectorAll('.qslide').forEach(function (el) { el.classList.remove('active'); });
    if (qzDone)  qzDone.hidden = false;
    if (qzNav)   qzNav.style.display  = 'none';
    if (qzFill)  qzFill.style.width   = '100%';
    if (qzStep)  qzStep.textContent   = 'Заявка отправлена';
  }

  updateUI();
  window.AB && window.AB.track('calculator_open');

  /* Phone mask */
  var phoneInput = document.getElementById('qPhone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function () {
      var raw = this.value.replace(/\D/g, '');
      if (raw.charAt(0) === '8') raw = '7' + raw.slice(1);
      if (!raw) { this.value = ''; return; }
      var out = '+7';
      if (raw.length > 1) out += ' ' + raw.slice(1, 4);
      if (raw.length > 4) out += ' ' + raw.slice(4, 7);
      if (raw.length > 7) out += '-' + raw.slice(7, 9);
      if (raw.length > 9) out += '-' + raw.slice(9, 11);
      this.value = out;
    });
  }
})();

/* ─── CHAT WIDGET (Gemini + fallback) ─────────────────────── */
(function () {
  'use strict';

  var cw      = document.getElementById('cw');
  var cwBtn   = document.getElementById('cwBtn');
  var cwClose = document.getElementById('cwClose');
  var cwMsgs  = document.getElementById('cwMsgs');
  var cwChips = document.getElementById('cwChips');
  var cwIn    = document.getElementById('cwIn');
  var cwSend  = document.getElementById('cwSend');
  var cwBox   = document.getElementById('cwBox');

  if (!cw || !cwBtn) return;

  var isOpen  = false;
  var greeted = false;
  var chatHistory = [];

  // Collect lead data from chat
  var collectedData = {};

  /* ── Quick chips ──────────────────────────────────────────── */
  var CHIPS = [
    { label: 'Рассчитать стоимость', key: 'calc' },
    { label: 'Посмотреть работы',    key: 'works' },
    { label: 'Позвонить нам',        key: 'call' },
    { label: 'Оставить заявку',      key: 'lead' }
  ];

  var LOCAL_REPLIES = {
    calc:  { text: 'Переходите к расчёту — ответьте на 6 вопросов, и мы подготовим смету.',
             after: function () { setTimeout(function () { var t = document.getElementById('calc'); if (t) t.scrollIntoView({ behavior: 'smooth' }); toggleChat(false); }, 1100); } },
    works: { text: 'Открываю портфолио — посмотрите реализованные объекты.',
             after: function () { setTimeout(function () { var t = document.getElementById('works'); if (t) t.scrollIntoView({ behavior: 'smooth' }); toggleChat(false); }, 900); } },
    call:  { text: 'Звоните: +7 700 123-45-67. Работаем ежедневно с 9:00 до 19:00.', after: null },
    lead:  { text: 'Отлично! Подскажите ваше имя и номер телефона — менеджер свяжется в течение часа.', after: null }
  };

  /* ── Helpers ──────────────────────────────────────────────── */
  function scrollBottom() { cwMsgs.scrollTop = cwMsgs.scrollHeight; }

  function addMsg(text, type) {
    var el = document.createElement('div');
    el.className = 'cw-msg cw-msg--' + type;
    el.textContent = text;
    cwMsgs.appendChild(el);
    scrollBottom();
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'cw-typing'; el.id = 'cwTyping';
    el.innerHTML = '<span></span><span></span><span></span>';
    cwMsgs.appendChild(el); scrollBottom();
    return el;
  }

  function removeTyping() { var el = document.getElementById('cwTyping'); if (el) el.remove(); }

  function renderChips(chips) {
    cwChips.innerHTML = '';
    chips.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'cw-chip'; btn.textContent = c.label;
      btn.addEventListener('click', function () {
        cwChips.innerHTML = '';
        addMsg(c.label, 'user');
        handleLocalReply(c.key, c.label);
      });
      cwChips.appendChild(btn);
    });
  }

  function handleLocalReply(key, userText) {
    var reply = LOCAL_REPLIES[key];
    if (!reply) { sendToAI(userText); return; }
    var typing = showTyping();
    setTimeout(function () {
      removeTyping();
      addMsg(reply.text, 'bot');
      if (reply.after) reply.after();
    }, 700);
  }

  /* ── AI via /api/chat ──────────────────────────────────────── */
  function sendToAI(userText) {
    window.AB && window.AB.track('chat_message_sent');
    var typing = showTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText, history: chatHistory.slice(-6) })
    })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      removeTyping();
      var reply = data.reply || 'Принял! Менеджер ответит в ближайшее время.';
      addMsg(reply, 'bot');
      chatHistory.push({ role: 'user', text: userText });
      chatHistory.push({ role: 'model', text: reply });

      // Detect if user shared contact info
      var phoneMatch = userText.match(/[\+7][\s\-]?\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}/);
      if (phoneMatch) collectedData.phone = phoneMatch[0];
      var nameGuess = userText.match(/^[А-ЯЁ][а-яё]+/);
      if (nameGuess && !collectedData.name) collectedData.name = nameGuess[0];

      if (collectedData.name && collectedData.phone && !collectedData.leadSent) {
        collectedData.leadSent = true;
        var historyText = chatHistory.map(function(m){
          return (m.role === 'user' ? 'Клиент' : 'Бот') + ': ' + m.text;
        }).join('\n');
        fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: collectedData.name,
            phone: collectedData.phone,
            comment: 'Заявка из ИИ-чата:\n' + historyText,
            source: 'Чат'
          })
        }).catch(function(){});
        window.AB && window.AB.track('crm_lead_created', { source: 'chat' });
      }
    })
    .catch(function (e) {
      removeTyping();
      console.warn('[Chat] /api/chat error:', e.message);
      addMsg('Принял! Менеджер ответит в ближайшее время. Для быстрой связи — напишите в WhatsApp.', 'bot');
    });
  }

  /* ── Open/close ────────────────────────────────────────────── */
  function toggleChat(force) {
    isOpen = (force !== undefined) ? force : !isOpen;
    cw.classList.toggle('open', isOpen);
    cwBtn.setAttribute('aria-expanded', String(isOpen));
    cwBox.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen) {
      window.AB && window.AB.track('chat_open');
      if (!greeted) {
        greeted = true;
        setTimeout(function () {
          addMsg('Здравствуйте! Я ИИ-ассистент Atelier Buils. Чем могу помочь?', 'bot');
          setTimeout(function () { renderChips(CHIPS); }, 400);
        }, 350);
      }
    }
  }

  cwBtn.addEventListener('click', function () { toggleChat(); });
  if (cwClose) cwClose.addEventListener('click', function () { toggleChat(false); });

  document.addEventListener('click', function (e) {
    if (isOpen && !cw.contains(e.target)) toggleChat(false);
  });

  /* ── Send message ──────────────────────────────────────────── */
  function sendMsg() {
    var val = cwIn.value.trim();
    if (!val) return;
    cwChips.innerHTML = '';
    addMsg(val, 'user');
    cwIn.value = '';
    sendToAI(val);
  }

  if (cwSend) cwSend.addEventListener('click', sendMsg);
  if (cwIn)   cwIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') sendMsg(); });

  /* Auto-open after 20 sec on first visit */
  setTimeout(function () {
    if (!isOpen && !sessionStorage.getItem('cw_opened')) {
      toggleChat(true);
      sessionStorage.setItem('cw_opened', '1');
    }
  }, 20000);
})();
