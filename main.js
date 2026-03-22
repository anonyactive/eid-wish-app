const dictionary = {
  en: {
    create_your_own: 'Create Your Own Wish',
    subtitle: 'Instantly generate and preview a personalized card to share.',
    recipient_placeholder: "Enter recipient's name",
    sender_placeholder: "Your Name (Optional)",
    generate_btn: 'Create Wish Link',
    link_ready: 'Your custom link is ready!',
    eid_mubarak: 'Eid Mubarak',
    greeting_msg: 'May the guidance and blessings of Allah be with you and your family. Wishing you a joyous and peaceful Eid surrounded by those you love!',
    from_label: 'From:',
    default_friend: 'Friend',
    open_gift: 'Tap to Open Gift 🎁',
    share_msg: 'Eid Mubarak, {name}! I created a special Eid wish for you. Check it out here:'
  },
  ur: {
    create_your_own: 'اپنا عید کا پیغام بنائیں',
    subtitle: 'فوری طور پر ایک خوبصورت پیغام بنائیں اور شیئر کریں۔',
    recipient_placeholder: 'وصول کنندہ کا نام درج کریں',
    sender_placeholder: 'آپ کا نام (اختیاری)',
    generate_btn: 'لنک بنائیں',
    link_ready: 'آپ کا اپنی مرضی کا لنک تیار ہے!',
    eid_mubarak: 'عید مبارک',
    greeting_msg: 'بعد رمضان کے عید ہوتی ہے،<br/>رب کی رحمت مزید ہوتی ہے۔<br/><br/>اللہ آپ کی تمام عبادات قبول فرمائے۔ عید مبارک!',
    from_label: 'منجانب:',
    default_friend: 'دوست',
    open_gift: 'تحفہ کھولنے کے لیے کلک کریں 🎁',
    share_msg: 'عید مبارک، {name}! میں نے آپ کے لیے عید کا ایک خاص پیغام بنایا ہے۔ اسے یہاں دیکھیں:'
  }
};

let currentLang = 'en';

// History constants (defined at top-level to avoid TDZ issues)
const HISTORY_KEY = 'eid_link_history';
const MAX_HISTORY = 20;

document.addEventListener('DOMContentLoaded', () => {
  // Register Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker Registered'))
      .catch(err => console.error('Service Worker Registry Failed', err));
  }
  const urlParams = new URLSearchParams(window.location.search);
  const nameParam = urlParams.get('name') || urlParams.get('n');
  const fromParam = urlParams.get('from') || urlParams.get('f');
  const langParam = urlParams.get('lang') || urlParams.get('l');

  if (langParam === 'ur' || langParam === 'en') {
    currentLang = langParam;
  }

  applyLanguage(currentLang);

  const decodedName = nameParam ? decodeURIComponent(nameParam).trim() : '';
  const decodedFrom = fromParam ? decodeURIComponent(fromParam).trim() : '';

  const nameInput = document.getElementById('name-input');
  const fromInput = document.getElementById('from-input');
  if (decodedName) nameInput.value = decodedName;
  if (decodedFrom) fromInput.value = decodedFrom;

  updateCardPreview(decodedName, decodedFrom);

  setupGeneratorLogic();
  setupLangToggle();
  setupClearHistory();
  renderHistory();
  createSparkles();

  if (decodedName || decodedFrom) {
    const overlay = document.getElementById('envelope-overlay');
    const openBtn = document.getElementById('open-envelope-btn');
    overlay.classList.remove('hidden');
    openBtn.addEventListener('click', () => {
      overlay.classList.add('hidden-overlay');
      setTimeout(() => overlay.remove(), 800);
      createCelebration();
    });
  }
});

function applyLanguage(lang) {
  const htmlRoot = document.getElementById('html-root');
  const langBtn = document.getElementById('lang-toggle');

  if (lang === 'ur') {
    htmlRoot.setAttribute('dir', 'rtl');
    htmlRoot.setAttribute('lang', 'ur');
    langBtn.textContent = 'English';
  } else {
    htmlRoot.setAttribute('dir', 'ltr');
    htmlRoot.setAttribute('lang', 'en');
    langBtn.textContent = 'اردو';
  }

  const strings = dictionary[lang];

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (strings[key]) {
      el.innerHTML = strings[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (strings[key]) {
      el.setAttribute('placeholder', strings[key]);
    }
  });

  // Re-run the preview update so the default fallback names translate too
  const nameInput = document.getElementById('name-input');
  const fromInput = document.getElementById('from-input');
  updateCardPreview(nameInput.value.trim(), fromInput.value.trim());
}

function setupLangToggle() {
  const langBtn = document.getElementById('lang-toggle');
  langBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ur' : 'en';
    applyLanguage(currentLang);
  });
}

function updateCardPreview(name, fromName) {
  const recipientNameEl = document.getElementById('recipient-name');
  const senderContainer = document.getElementById('sender-container');
  const senderNameEl = document.getElementById('sender-name');

  const displayFriend = name || dictionary[currentLang].default_friend;
  const eidMubarakText = dictionary[currentLang].eid_mubarak;

  // Update Preview or use fallback language default
  recipientNameEl.textContent = displayFriend;

  // Update Document Title
  document.title = `${eidMubarakText} ${displayFriend}`;

  // Update Meta Tags for Social Sharing (WhatsApp previews)
  const ogTitle = document.getElementById('og-title');
  const ogDesc = document.getElementById('og-description');
  const metaDesc = document.querySelector('meta[name="description"]');

  if (ogTitle) ogTitle.setAttribute('content', document.title);

  const desc = fromName 
    ? `A special Eid greeting from ${fromName} for ${displayFriend}!`
    : `A special Eid greeting for ${displayFriend}!`;

  if (ogDesc) ogDesc.setAttribute('content', desc);
  if (metaDesc) metaDesc.setAttribute('content', desc);

  if (fromName && fromName !== '') {
    senderNameEl.textContent = fromName;
    senderContainer.classList.remove('hidden');
  } else {
    senderContainer.classList.add('hidden');
  }
}

function setupGeneratorLogic() {
  const nameInput = document.getElementById('name-input');
  const fromInput = document.getElementById('from-input');
  const generateBtn = document.getElementById('generate-btn');
  const shareBox = document.getElementById('share-box');
  const generatedLinkInput = document.getElementById('generated-link');
  const copyBtn = document.getElementById('copy-btn');
  const nativeShareBtn = document.getElementById('native-share-btn');
  const whatsappShareBtn = document.getElementById('whatsapp-share-btn');
  const toast = document.getElementById('toast');

  whatsappShareBtn.addEventListener('click', () => {
    const name = nameInput.value.trim() || dictionary[currentLang].default_friend;
    const shareMsgTemplate = dictionary[currentLang].share_msg;
    const personalizedMsg = shareMsgTemplate.replace('{name}', name);
    const text = encodeURIComponent(`${personalizedMsg}\n\n${generatedLinkInput.value}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  });

  if (navigator.share) {
    nativeShareBtn.classList.remove('hidden');
    nativeShareBtn.addEventListener('click', async () => {
      try {
        await navigator.share({
          title: document.title,
          text: document.title,
          url: generatedLinkInput.value
        });
      } catch (err) {
        console.log('Error sharing or user cancelled', err);
      }
    });
  }

  // Live Preview functionality
  const handleInput = () => {
    updateCardPreview(nameInput.value.trim(), fromInput.value.trim());
  };
  nameInput.addEventListener('input', handleInput);
  fromInput.addEventListener('input', handleInput);

  generateBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const from = fromInput.value.trim();

    if (!name && !from) {
      nameInput.focus();
      return;
    }

    let queryParams = `?`;
    if (name) queryParams += `n=${encodeURIComponent(name)}`;
    if (from) {
      if (queryParams.length > 1) queryParams += '&';
      queryParams += `f=${encodeURIComponent(from)}`;
    }
    if (currentLang === 'ur') {
      if (queryParams.length > 1) queryParams += '&';
      queryParams += `l=ur`;
    }

    let baseUrl = window.location.href.split('?')[0];
    if (baseUrl.startsWith('http')) {
      baseUrl = baseUrl.replace(/index\.html$/, '');
    }

    const fullLink = `${baseUrl}${queryParams}`;

    generatedLinkInput.value = fullLink;
    shareBox.classList.remove('hidden');
    shareBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Save to history
    saveToHistory(name, from, fullLink);
  });

  const handleEnter = (e) => {
    if (e.key === 'Enter') generateBtn.click();
  };
  nameInput.addEventListener('keypress', handleEnter);
  fromInput.addEventListener('keypress', handleEnter);

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(generatedLinkInput.value);
      showToast(currentLang === 'ur' ? 'لنک کاپی ہو گیا!' : 'Link copied to clipboard!');
    } catch (err) {
      generatedLinkInput.select();
      document.execCommand('copy');
      showToast(currentLang === 'ur' ? 'لنک کاپی ہو گیا!' : 'Link copied!');
    }
  });

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
}

// ── History Feature ───────────────────────────────────────────

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch { return []; }
}

function saveToHistory(name, from, url) {
  let history = loadHistory();
  // Remove duplicate by URL
  history = history.filter(h => h.url !== url);
  history.unshift({ name, from, url, ts: Date.now() });
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const section = document.getElementById('history-section');
  const list = document.getElementById('history-list');
  const history = loadHistory();

  if (!history.length) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  list.innerHTML = '';

  history.forEach(entry => {
    const li = document.createElement('li');
    li.className = 'history-item';

    const namesText = entry.from
      ? `For: ${entry.name || '—'} · From: ${entry.from}`
      : `For: ${entry.name || '—'}`;

    li.innerHTML = `
      <div class="history-item-info">
        <div class="history-item-names">${namesText}</div>
        <div class="history-item-link">${entry.url}</div>
      </div>
      <button class="history-item-copy" title="Copy link">Copy</button>
    `;

    // Click the row → prefill inputs
    li.querySelector('.history-item-info').addEventListener('click', () => {
      document.getElementById('name-input').value = entry.name || '';
      document.getElementById('from-input').value = entry.from || '';
      updateCardPreview(entry.name || '', entry.from || '');
      document.getElementById('generated-link').value = entry.url;
      document.getElementById('share-box').classList.remove('hidden');
      document.getElementById('share-box').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    // Copy button
    li.querySelector('.history-item-copy').addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(entry.url);
      } catch {
        const tmp = document.createElement('textarea');
        tmp.value = entry.url;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
      }
      const btn = e.currentTarget;
      btn.textContent = '✓';
      setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
    });

    list.appendChild(li);
  });
}

function setupClearHistory() {
  document.getElementById('clear-history-btn').addEventListener('click', () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  });
}

function createSparkles() {
  const container = document.body;
  const numSparkles = 20;

  for (let i = 0; i < numSparkles; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';

    const top = Math.random() * 100;
    const left = Math.random() * 100;
    const size = Math.random() * 4 + 1;
    const delay = Math.random() * 4;

    sparkle.style.top = `${top}vh`;
    sparkle.style.left = `${left}vw`;
    sparkle.style.width = `${size}px`;
    sparkle.style.height = `${size}px`;
    sparkle.style.animationDelay = `${delay}s`;

    container.appendChild(sparkle);
  }
}

function playCelebrationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Play Magical Chime Arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      // Lower gain so it doesn't overpower the pops
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.7);
    });

    // Subtler, rounder balloon pop sound
    const playPop = (time) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, time);
      osc.frequency.exponentialRampToValueAtTime(100, time + 0.05);

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(1, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.1);
    };

    // Play a sequence of 12 distinct pops spanning ~3 seconds to create a clear trail
    for (let i = 0; i < 12; i++) {
      playPop(ctx.currentTime + 0.3 + (i * 0.25) + (Math.random() * 0.15));
    }
  } catch (e) {
    console.log("Audio play failed", e);
  }
}

function createCelebration() {
  playCelebrationSound();
  const container = document.body;
  const emojis = ['🥳', '🎉', '🎊', '🎈'];
  const numEmojis = 25;

  for (let i = 0; i < numEmojis; i++) {
    const el = document.createElement('div');
    el.className = 'floating-emoji';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    // Randomize starting position, duration, and delay
    const left = Math.random() * 100;
    const duration = 3 + Math.random() * 5; // 3 to 8 seconds
    const delay = Math.random() * 2;
    // Make emojis even smaller based on request
    const fontSize = 0.8 + Math.random() * 0.8; // 0.8rem to 1.6rem

    el.style.left = `${left}vw`;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;
    el.style.fontSize = `${fontSize}rem`;

    container.appendChild(el);

    // Clean up
    setTimeout(() => {
      if (el.parentNode) el.remove();
    }, (duration + delay) * 1000 + 500);
  }
}
