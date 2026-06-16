/* =============================================
   script.js — GABUNGAN (Home, Blog, Portofolio, Single)
   Author: Rizky Ahmad Nasrulloh
   ============================================= */

// ─── 1. Header scroll effect ─────────────────
(function initHeaderScroll() {
  const header = document.getElementById('site-header');
  if (!header) return;

  window.addEventListener('scroll', function () {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }, { passive: true });
})();

// ─── 2. Intersection Observer — fade-in-up ───
(function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-in-up');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
  );

  elements.forEach(function (el) {
    observer.observe(el);
  });
})();

// ─── 3. Toast Notification ───────────────────
function tampilToast(pesan, durasi) {
  durasi = durasi || 3000;
  var toast = document.getElementById('toast-notif');
  if (!toast) return;

  toast.textContent = pesan;
  toast.classList.add('show');
  setTimeout(function () {
    toast.classList.remove('show');
  }, durasi);
}

// ─── 4. Filter Artikel (Halaman Blog) ───────
function filterKategori(kategori) {
  const cards = document.querySelectorAll('.blog-card');
  const filterBtns = document.querySelectorAll('.filter-btn');
  let tampil = 0;

  filterBtns.forEach(function (btn) {
    var isActive = btn.getAttribute('onclick') && btn.getAttribute('onclick').includes("'" + kategori + "'");
    btn.classList.toggle('active-filter', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  cards.forEach(function (card) {
    var cocok = (kategori === 'semua') || (card.getAttribute('data-category') === kategori);
    if (cocok) {
      card.style.display = 'flex';
      card.style.opacity = '0';
      card.style.transition = 'opacity 0.35s ease ' + (tampil * 0.06) + 's';
      setTimeout(() => card.style.opacity = '1', 20);
      tampil++;
    } else {
      card.style.opacity = '0';
      card.style.display = 'none';
    }
  });
  const countEl = document.getElementById('count-number');
  if (countEl) countEl.textContent = tampil;
}

// ─── 5. Smooth scroll ────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ─── 6. Reading Progress Bar (Single Post) ───
window.addEventListener('scroll', function() {
  const progressBar = document.getElementById('readingProgress');
  if (!progressBar) return;
  const scrollPos = document.documentElement.scrollTop || document.body.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  progressBar.style.width = (scrollPos / height) * 100 + '%';
});

// ─── 7. Form Kontak Prosedural ──────────────
(function initContactForm() {
  const form = document.getElementById('form-kontak');
  if (!form) return;
  
  const btnKirim = document.getElementById('btn-kirim');
  const btnText = document.getElementById('btn-kirim-text');
  const btnIcon = document.getElementById('btn-kirim-icon');

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const nama = document.getElementById('nama').value.trim();
    const email = document.getElementById('email').value.trim();
    const pesan = document.getElementById('pesan').value.trim();

    if (!nama || !email || !pesan) {
      tampilToast('⚠️ Tolong isi semua kolom formulir ya!');
      return;
    }

    btnKirim.disabled = true;
    if (btnText) btnText.textContent = 'Mengirim...';
    if (btnIcon) btnIcon.textContent = '⏳';

    setTimeout(function () {
      btnKirim.disabled = false;
      if (btnText) btnText.textContent = 'Kirim Pesan';
      if (btnIcon) btnIcon.textContent = '→';
      form.reset();
      tampilToast('🎉 Pesan berhasil terkirim!');
    }, 1400);
  });
})();

// ─── 8. Toggle Catatan (Portofolio) ─────────
function toggleCatatan() {
  const areaCatatan = document.getElementById('area-catatan');
  if (!areaCatatan) return;
  areaCatatan.style.display = (areaCatatan.style.display === 'none' || areaCatatan.style.display === '') ? 'block' : 'none';
}
