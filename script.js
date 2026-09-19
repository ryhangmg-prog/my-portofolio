(function () {
  "use strict";

  /* =========================================================
     MENU (mobile) — buka / tutup panel navigasi
     ========================================================= */
  var menuToggle = document.getElementById("menuToggle");
  var primaryNav = document.getElementById("primaryNav");

  function setMenu(open) {
    primaryNav.classList.toggle("open", open);
    menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    menuToggle.textContent = open ? "Close" : "Menu";
  }

  menuToggle.addEventListener("click", function () {
    setMenu(!primaryNav.classList.contains("open"));
  });

  // Tutup menu saat memilih halaman
  primaryNav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setMenu(false);
  });

  // Tutup menu saat menekan area di luar panel
  document.addEventListener("click", function (e) {
    if (
      primaryNav.classList.contains("open") &&
      !primaryNav.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      setMenu(false);
    }
  });

  // Tutup menu dengan tombol Escape
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && primaryNav.classList.contains("open")) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  // "Skip to content"
  var main = document.getElementById("main");
  document.querySelector(".skip-link").addEventListener("click", function (e) {
    e.preventDefault();
    main.focus();
  });

  /* =========================================================
     PROJECTS — video jalan tanpa suara (hanya yang terlihat di layar).
     Klik kartu: suara menyala + tombol kontrol (pause / seek) muncul.
     ========================================================= */
  var wraps = document.querySelectorAll(".video-wrap");
  var videos = document.querySelectorAll(".video-wrap video");
  var visibleWraps = new Set();
  var observer = null;

  function safePlay(video) {
    var p = video.play();
    if (p && p.catch) p.catch(function () {});
  }

  function deactivate(wrap) {
    var video = wrap.querySelector("video");
    var wasActive = wrap.classList.contains("playing");
    video.muted = true;
    video.controls = false;
    wrap.classList.remove("playing");
    wrap.setAttribute("role", "button");
    wrap.setAttribute("tabindex", "0");
    // kembali ke putaran senyap kalau kartunya masih terlihat
    if (wasActive && visibleWraps.has(wrap)) safePlay(video);
  }

  function activate(wrap, viaKeyboard) {
    if (wrap.classList.contains("playing")) return;   // kontrol bawaan video yang bekerja
    var video = wrap.querySelector("video");
    wraps.forEach(function (w) { if (w !== wrap) deactivate(w); });
    video.muted = false;
    // Kontrol dipasang setelah klik selesai; kalau langsung, Chrome ikut
    // menganggap klik itu sebagai "pause" dan videonya berhenti sendiri.
    setTimeout(function () {
      video.controls = true;
      if (viaKeyboard) video.focus();
    }, 0);
    wrap.classList.add("playing");
    wrap.removeAttribute("role");
    wrap.removeAttribute("tabindex");
    safePlay(video);
  }

  function onIntersect(entries) {
    entries.forEach(function (entry) {
      var wrap = entry.target;
      var video = wrap.querySelector("video");
      if (entry.isIntersecting) visibleWraps.add(wrap); else visibleWraps.delete(wrap);
      if (wrap.classList.contains("playing")) return;  // sedang ditonton dengan suara
      if (entry.isIntersecting) safePlay(video); else video.pause();
    });
  }

  function startVideos() {
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(onIntersect, { threshold: 0.25 });
      wraps.forEach(function (w) { observer.observe(w); });
    } else {
      videos.forEach(safePlay);
    }
  }

  function stopVideos() {
    if (observer) { observer.disconnect(); observer = null; }
    visibleWraps.clear();
    wraps.forEach(deactivate);
    videos.forEach(function (v) { v.pause(); });
  }

  wraps.forEach(function (wrap) {
    wrap.addEventListener("click", function () { activate(wrap, false); });
    wrap.addEventListener("keydown", function (e) {
      if (e.target === wrap && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        activate(wrap, true);
      }
    });
  });

  /* =========================================================
     PAGES — satu halaman, sidebar tidak pernah hilang
     ========================================================= */
  var routes = ["about", "projects", "contact", "words", "hire"];
  var titles = {
    about: "Let's know each other",
    projects: "Projects page",
    contact: "Contact me please!",
    words: "Words",
    hire: "Hire me - Naldi"
  };
  var navLinks = primaryNav.querySelectorAll("a");

  function showPage(route, initial) {
    routes.forEach(function (r) {
      document.getElementById("page-" + r).hidden = (r !== route);
    });

    navLinks.forEach(function (a) {
      if (a.getAttribute("href") === "#" + route) {
        a.setAttribute("aria-current", "page");
      } else {
        a.removeAttribute("aria-current");
      }
    });

    document.title = titles[route];

    if (route === "projects") startVideos();
    else stopVideos();

    if (!initial) {
      window.scrollTo(0, 0);
      var heading = document.querySelector("#page-" + route + " .page-title");
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
  }

  function routeFromHash() {
    var h = window.location.hash.replace("#", "");
    return routes.indexOf(h) === -1 ? "about" : h;
  }

  window.addEventListener("hashchange", function () {
    showPage(routeFromHash(), false);
  });

  showPage(routeFromHash(), true);

  /* =========================================================
     FORM — kode diskon (lihat / sembunyikan) + kirim ke WhatsApp
     ========================================================= */
  // Nomor WhatsApp tujuan (format internasional tanpa + atau spasi)
  var NOMOR_WA = "6283180101104";

  var form = document.getElementById("orderForm");
  var layananError = document.getElementById("layananError");
  var kode = document.getElementById("kode");
  var toggleKode = document.getElementById("toggleKode");
  var deadline = document.getElementById("deadline");

  // Target selesai tidak boleh tanggal yang sudah lewat
  var now = new Date();
  var mm = ("0" + (now.getMonth() + 1)).slice(-2);
  var dd = ("0" + now.getDate()).slice(-2);
  deadline.min = now.getFullYear() + "-" + mm + "-" + dd;

  // Tombol lihat / sembunyikan kode diskon
  toggleKode.addEventListener("click", function () {
    var reveal = kode.type === "password";
    kode.type = reveal ? "text" : "password";
    toggleKode.textContent = reveal ? "Sembunyikan" : "Lihat";
    toggleKode.setAttribute("aria-label", reveal ? "Sembunyikan kode diskon" : "Lihat kode diskon");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    var layanan = form.querySelectorAll('input[name="layanan"]:checked');
    layananError.style.display = layanan.length ? "none" : "block";

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!layanan.length) {
      document.getElementById("layananGroup").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    var data = new FormData(form);
    var daftarLayanan = Array.prototype.map.call(layanan, function (c) { return c.value; }).join(", ");
    var kodeDiskon = (data.get("kode") || "").trim();

    var pesan =
      "Halo Naldi, saya ingin memesan jasa.\n\n" +
      "*Data Pemesan*\n" +
      "Nama: " + data.get("nama") + "\n" +
      "Email: " + data.get("email") + "\n" +
      "WhatsApp: " + data.get("wa") + "\n" +
      "Kota Asal: " + data.get("kota") + "\n" +
      "Jenis Kelamin: " + (data.get("gender") || "-") + "\n\n" +
      "*Detail Pesanan*\n" +
      "Layanan: " + daftarLayanan + "\n" +
      "Target Selesai: " + (data.get("deadline") || "-") + "\n" +
      (kodeDiskon ? "Kode Diskon: " + kodeDiskon + "\n" : "") +
      "Keterangan: " + data.get("detail");

    window.location.href = "https://wa.me/" + NOMOR_WA + "?text=" + encodeURIComponent(pesan);
  });
})();
