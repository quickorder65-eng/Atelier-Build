/* ============================================================
   ATELIER BUILS — script.js  v3
   ============================================================ */
(function () {
  'use strict';

  /* ─── MOBILE MENU ──────────────────────────────────────── */
  var brg     = document.getElementById('brg');
  var mob     = document.getElementById('mob');
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

  /* ─── HEADER SCROLL ────────────────────────────────────── */
  var hdr = document.getElementById('hdr');
  if (hdr) {
    window.addEventListener('scroll', function () {
      hdr.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });
  }

  /* ─── SMOOTH SCROLL ────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      var hdrH = hdr ? hdr.offsetHeight : 64;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - hdrH,
        behavior: 'smooth'
      });
      if (brg && brg.classList.contains('open')) menuToggle(false);
    });
  });

  /* ─── REVEAL ON SCROLL ─────────────────────────────────── */
  var fiEls = document.querySelectorAll('.fi');

  if (fiEls.length && 'IntersectionObserver' in window) {
    var fiObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          fiObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -32px 0px' });

    fiEls.forEach(function (el) { fiObs.observe(el); });
  } else {
    fiEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ─── FAQ ACCORDION ────────────────────────────────────── */
  document.querySelectorAll('.ai__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item   = this.closest('.ai');
      var body   = item.querySelector('.ai__bd');
      var isOpen = item.classList.contains('open');

      document.querySelectorAll('.ai.open').forEach(function (openItem) {
        openItem.classList.remove('open');
        openItem.querySelector('.ai__btn').setAttribute('aria-expanded', 'false');
        openItem.querySelector('.ai__bd').style.maxHeight = '0';
      });

      if (!isOpen) {
        item.classList.add('open');
        this.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* ─── QUIZ ─────────────────────────────────────────────── */
  var STEPS = 6;
  var answers = {};
  var step = 1;

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
    document.querySelectorAll('.qslide').forEach(function (el) {
      el.classList.remove('active');
    });
    var el = document.querySelector('.qslide[data-step="' + n + '"]');
    if (el) el.classList.add('active');
    updateUI();
  }

  /* Option click */
  document.querySelectorAll('.qopt').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var q = this.dataset.q;
      if (!q) return;
      this.closest('.qopts').querySelectorAll('.qopt').forEach(function (b) {
        b.classList.remove('sel');
      });
      this.classList.add('sel');
      answers['q' + q] = this.dataset.v;
    });
  });

  /* Contact field validation */
  function validateContact() {
    var nameEl  = document.getElementById('qName');
    var phoneEl = document.getElementById('qPhone');
    var valid = true;

    if (nameEl && !nameEl.value.trim()) {
      nameEl.classList.add('err');
      valid = false;
    }
    if (phoneEl) {
      var digits = phoneEl.value.replace(/\D/g, '');
      if (digits.length < 10) {
        phoneEl.classList.add('err');
        valid = false;
      }
    }
    return valid;
  }

  ['qName', 'qPhone'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function () { this.classList.remove('err'); });
  });

  /* Next */
  if (qzNext) {
    qzNext.addEventListener('click', function () {
      if (step === STEPS) {
        if (!validateContact()) return;
        var nameEl  = document.getElementById('qName');
        var phoneEl = document.getElementById('qPhone');
        answers.name    = nameEl  ? nameEl.value.trim()  : '';
        answers.phone   = phoneEl ? phoneEl.value.trim() : '';
        answers.contact = answers['q6'] || '';
        submitQuiz();
      } else {
        step = Math.min(step + 1, STEPS);
        showStep(step);
      }
    });
  }

  /* Prev */
  if (qzPrev) {
    qzPrev.addEventListener('click', function () {
      step = Math.max(step - 1, 1);
      showStep(step);
    });
  }

  function submitQuiz() {
    console.log('=== Atelier Buils — Quiz ===');
    console.log('Объект:',    answers.q1 || '—');
    console.log('Площадь:',   answers.q2 || '—');
    console.log('Что нужно:', answers.q3 || '—');
    console.log('Уровень:',   answers.q4 || '—');
    console.log('Старт:',     answers.q5 || '—');
    console.log('Имя:',       answers.name  || '—');
    console.log('Телефон:',   answers.phone || '—');
    console.log('Связь:',     answers.contact || '—');

    var GAS_URL = 'https://script.google.com/macros/s/AKfycbx8o1B7hfUxYt9RkklO-Grwz19sfx836n0xRa0r75z4qw-MwhcSrcePwMc61kISSaQpHQ/exec';

    /* Отправка через скрытый iframe — без CORS */
    var iframeId = 'gas_iframe';
    if (!document.getElementById(iframeId)) {
      var iframe = document.createElement('iframe');
      iframe.name = iframeId;
      iframe.id   = iframeId;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
    }

    var form = document.createElement('form');
    form.method = 'POST';
    form.action = GAS_URL;
    form.target = iframeId;
    form.style.display = 'none';

    var fields = {
      q1: answers.q1, q2: answers.q2, q3: answers.q3,
      q4: answers.q4, q5: answers.q5,
      name: answers.name, phone: answers.phone, contact: answers.contact
    };
    Object.keys(fields).forEach(function(key) {
      var inp = document.createElement('input');
      inp.type  = 'hidden';
      inp.name  = key;
      inp.value = fields[key] || '';
      form.appendChild(inp);
    });

    document.body.appendChild(form);
    form.submit();
    setTimeout(function() { document.body.removeChild(form); }, 2000);

    document.querySelectorAll('.qslide').forEach(function (el) {
      el.classList.remove('active');
    });
    if (qzDone) {
      qzDone.hidden = false;
    }
    if (qzNav)  qzNav.style.display = 'none';
    if (qzFill) qzFill.style.width  = '100%';
    if (qzStep) qzStep.textContent  = 'Заявка отправлена';
  }

  /* Init quiz */
  updateUI();

  /* ─── PHONE MASK ───────────────────────────────────────── */
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

/* ============================================================
   CHAT WIDGET
   ============================================================ */
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

  var isOpen   = false;
  var greeted  = false;

  /* ── Сценарий бота ──────────────────────────────────────── */
  var GREET = 'Здравствуйте! Я менеджер Atelier Buils. Чем могу помочь?';

  var CHIPS = [
    { label: 'Рассчитать стоимость', key: 'calc' },
    { label: 'Посмотреть работы',    key: 'works' },
    { label: 'Позвонить нам',        key: 'call' },
    { label: 'Написать в WhatsApp',  key: 'wa' },
  ];

  var REPLIES = {
    calc: {
      text: 'Переходите к расчёту — ответьте на 6 вопросов, и мы подготовим смету.',
      after: function () {
        setTimeout(function () {
          var t = document.getElementById('calc');
          if (t) t.scrollIntoView({ behavior: 'smooth' });
          toggleChat(false);
        }, 1100);
      }
    },
    works: {
      text: 'Открываю портфолио — посмотрите реализованные объекты.',
      after: function () {
        setTimeout(function () {
          var t = document.getElementById('works');
          if (t) t.scrollIntoView({ behavior: 'smooth' });
          toggleChat(false);
        }, 900);
      }
    },
    call: {
      text: 'Звоните: +7 700 123-45-67. Работаем ежедневно с 9:00 до 19:00.',
      after: null
    },
    wa: {
      text: 'Перевожу в WhatsApp — там ответим быстро.',
      after: function () {
        setTimeout(function () {
          window.open('https://wa.me/77001234567', '_blank');
        }, 700);
      }
    },
    fallback: {
      text: 'Принял! Менеджер ответит в ближайшее время. Для быстрой связи — напишите в WhatsApp.',
      after: null
    }
  };

  /* ── Helpers ──────────────────────────────────────────────*/
  function scrollBottom() {
    cwMsgs.scrollTop = cwMsgs.scrollHeight;
  }

  function addMsg(text, type) {
    var el = document.createElement('div');
    el.className = 'cw-msg cw-msg--' + type;
    el.textContent = text;
    cwMsgs.appendChild(el);
    scrollBottom();
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'cw-typing';
    el.id = 'cwTyping';
    el.innerHTML = '<span></span><span></span><span></span>';
    cwMsgs.appendChild(el);
    scrollBottom();
    return el;
  }

  function removeTyping() {
    var el = document.getElementById('cwTyping');
    if (el) el.remove();
  }

  function botSay(key) {
    var reply = REPLIES[key] || REPLIES.fallback;
    var typing = showTyping();
    setTimeout(function () {
      removeTyping();
      addMsg(reply.text, 'bot');
      if (reply.after) reply.after();
    }, 900);
  }

  function renderChips(chips) {
    cwChips.innerHTML = '';
    chips.forEach(function (c) {
      var btn = document.createElement('button');
      btn.className = 'cw-chip';
      btn.textContent = c.label;
      btn.addEventListener('click', function () {
        cwChips.innerHTML = '';
        addMsg(c.label, 'user');
        botSay(c.key);
      });
      cwChips.appendChild(btn);
    });
  }

  /* ── Открыть / закрыть ──────────────────────────────────── */
  function toggleChat(force) {
    isOpen = (force !== undefined) ? force : !isOpen;
    cw.classList.toggle('open', isOpen);
    cwBtn.setAttribute('aria-expanded', String(isOpen));
    cwBox.setAttribute('aria-hidden', String(!isOpen));

    if (isOpen && !greeted) {
      greeted = true;
      setTimeout(function () {
        addMsg(GREET, 'bot');
        setTimeout(function () { renderChips(CHIPS); }, 400);
      }, 350);
    }
  }

  cwBtn.addEventListener('click', function () { toggleChat(); });
  if (cwClose) cwClose.addEventListener('click', function () { toggleChat(false); });

  /* Закрыть кликом вне виджета */
  document.addEventListener('click', function (e) {
    if (isOpen && !cw.contains(e.target)) toggleChat(false);
  });

  /* ── Отправка сообщения ─────────────────────────────────── */
  function sendMsg() {
    var val = cwIn.value.trim();
    if (!val) return;
    cwChips.innerHTML = '';
    addMsg(val, 'user');
    cwIn.value = '';
    botSay('fallback');

    /*
      ── CRM ИНТЕГРАЦИЯ ──────────────────────────────────────
      Чтобы получать сообщения из чата в CRM/Google Sheets:

      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: val, ts: new Date().toISOString() })
      });

      Создайте /api/chat.js на Vercel — он записывает строку
      в Google Sheets через googleapis (см. /api/quiz.js).
      ─────────────────────────────────────────────────────── */
  }

  if (cwSend) cwSend.addEventListener('click', sendMsg);
  if (cwIn)   cwIn.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') sendMsg();
  });

  /* Авто-открытие через 20 секунд (первый визит) */
  setTimeout(function () {
    if (!isOpen && !sessionStorage.getItem('cw_opened')) {
      toggleChat(true);
      sessionStorage.setItem('cw_opened', '1');
    }
  }, 20000);

})();
