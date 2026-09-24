(function(){
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var WA_NUMBER = "2223565552";
  var INTENT_MESSAGES = {
    pedido: "Hola, quiero pedir una pipa de agua.",
    casa: "Hola, quiero pedir agua para mi casa.",
    negocio: "Hola, quiero cotizar agua para mi negocio.",
    obra: "Hola, quiero coordinar entrega de agua para mi obra."
  };

  /* =========================================================
     LOADER — real asset-progress droplet gauge
     ========================================================= */
  function initLoader(onDone){
    var loader = document.getElementById("loader");
    var pctEl = document.getElementById("loader-pct");
    var fillRect = document.getElementById("drop-fill-rect");
    var shineRect = document.getElementById("drop-shine-rect");
    var html = document.documentElement;

    if(!loader){ onDone(); return; }

    var shown = 0;
    var target = 6;
    var done = false;
    var rafId = null;

    function paint(){
      shown += (target - shown) * 0.14;
      if(target - shown < 0.35) shown = target;
      var pct = Math.round(shown);
      if(pctEl) pctEl.textContent = pct;
      var y = 128 - (shown / 100) * 128;
      if(fillRect){
        fillRect.setAttribute("y", y);
        fillRect.setAttribute("height", 148 - y);
      }
      if(shineRect) shineRect.setAttribute("y", y);

      if(shown < target || !done){
        rafId = requestAnimationFrame(paint);
      } else {
        cancelAnimationFrame(rafId);
        finish();
      }
    }
    rafId = requestAnimationFrame(paint);

    function setTarget(p){
      target = Math.max(target, Math.min(p, 100));
    }

    var images = Array.prototype.slice.call(document.images);
    var total = images.length || 1;
    var loaded = 0;
    function bumpAsset(){
      loaded++;
      setTarget((loaded / total) * 82);
    }
    if(images.length === 0){ setTarget(82); }
    images.forEach(function(img){
      if(img.complete){ bumpAsset(); }
      else{
        img.addEventListener("load", bumpAsset, { once: true });
        img.addEventListener("error", bumpAsset, { once: true });
      }
    });

    var minTime = new Promise(function(res){ setTimeout(res, 1050); });
    var pageLoaded = new Promise(function(res){
      if(document.readyState === "complete") res();
      else window.addEventListener("load", res, { once: true });
    });
    var safety = new Promise(function(res){ setTimeout(res, 4200); });

    Promise.race([Promise.all([minTime, pageLoaded]), safety]).then(function(){
      setTarget(100);
      done = true;
    });

    function finish(){
      html.classList.remove("is-loading");
      loader.classList.add("is-hidden");
      loader.setAttribute("aria-hidden", "true");
      setTimeout(onDone, 550);
    }
  }

  /* =========================================================
     HERO ENTRANCE — staggered reveal once the loader clears
     ========================================================= */
  function revealHero(){
    var els = document.querySelectorAll(".hero [data-reveal]");
    els.forEach(function(el, i){
      setTimeout(function(){ el.classList.add("is-visible"); }, i * 130);
    });
  }

  /* =========================================================
     SCROLL REVEAL — everything below the hero
     ========================================================= */
  function initScrollReveal(){
    var els = Array.prototype.filter.call(
      document.querySelectorAll("[data-reveal]"),
      function(el){ return !el.closest(".hero"); }
    );

    var groups = new Map();
    els.forEach(function(el){
      var parent = el.parentElement;
      if(!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });
    groups.forEach(function(list){
      list.forEach(function(el, i){ el.style.setProperty("--d", i); });
    });

    if(reduceMotion || !("IntersectionObserver" in window)){
      els.forEach(function(el){ el.classList.add("is-visible"); });
      return;
    }

    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    els.forEach(function(el){ io.observe(el); });
  }

  /* =========================================================
     HEADER STATE + SCROLL PROGRESS + TIMELINE PROGRESS
     Single rAF-gated scroll handler (no per-event layout work).
     ========================================================= */
  function initScrollEffects(){
    var header = document.getElementById("site-header");
    var progressBar = document.getElementById("scroll-progress");
    var timeline = document.getElementById("timeline");
    var timelineProgress = document.getElementById("timeline-progress");
    var ticking = false;

    function update(){
      var scrollY = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      if(progressBar) progressBar.style.width = pct + "%";
      if(header) header.classList.toggle("is-scrolled", scrollY > 40);

      if(timeline && timelineProgress){
        var rect = timeline.getBoundingClientRect();
        var vh = window.innerHeight;
        var visibleStart = vh * 0.78;
        var raw = (visibleStart - rect.top) / rect.height;
        var clamped = Math.max(0, Math.min(1, raw));
        timelineProgress.style.height = (clamped * 100) + "%";
      }
      ticking = false;
    }

    function onScroll(){
      if(!ticking){
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
  }

  /* =========================================================
     MOBILE NAV
     ========================================================= */
  function initMobileNav(){
    var toggle = document.getElementById("nav-toggle");
    var nav = document.getElementById("main-nav");
    var scrim = document.getElementById("nav-scrim");
    if(!toggle || !nav) return;

    function openNav(){
      document.body.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
    }
    function closeNav(){
      document.body.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
    }
    toggle.addEventListener("click", function(){
      document.body.classList.contains("nav-open") ? closeNav() : openNav();
    });
    if(scrim) scrim.addEventListener("click", closeNav);
    nav.querySelectorAll("[data-nav-link]").forEach(function(link){
      link.addEventListener("click", closeNav);
    });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape") closeNav();
    });
  }

  /* =========================================================
     WHATSAPP MODAL — context-aware primary option
     ========================================================= */
  function initWaModal(){
    var modal = document.getElementById("wa-modal");
    if(!modal) return;
    var primaryOption = document.getElementById("wa-modal-primary-option");
    var openers = document.querySelectorAll("[data-wa-trigger]");
    var closers = modal.querySelectorAll("[data-wa-close]");
    var lastFocused = null;

    function open(intent){
      if(primaryOption){
        var msg = INTENT_MESSAGES[intent] || INTENT_MESSAGES.pedido;
        primaryOption.href = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg);
      }
      lastFocused = document.activeElement;
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
      var closeBtn = modal.querySelector(".wa-modal-close");
      if(closeBtn) closeBtn.focus();
    }
    function close(){
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      if(lastFocused) lastFocused.focus();
    }

    openers.forEach(function(btn){
      btn.addEventListener("click", function(){ open(btn.dataset.waIntent || "pedido"); });
    });
    closers.forEach(function(btn){ btn.addEventListener("click", close); });
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && modal.classList.contains("is-open")) close();
    });
  }

  /* =========================================================
     CONTACT FORM → WHATSAPP
     ========================================================= */
  function initContactForm(){
    var form = document.getElementById("contact-form");
    if(!form) return;
    var note = document.getElementById("form-note");
    var defaultNote = note ? note.textContent : "";
    var requiredFields = ["name", "phone", "service", "zone"];

    form.querySelectorAll("input, select, textarea").forEach(function(el){
      el.addEventListener("input", function(){
        var row = el.closest(".form-row");
        if(row) row.classList.remove("has-error");
        el.removeAttribute("aria-invalid");
      });
      el.addEventListener("change", function(){
        var row = el.closest(".form-row");
        if(row) row.classList.remove("has-error");
        el.removeAttribute("aria-invalid");
      });
    });

    form.addEventListener("submit", function(e){
      e.preventDefault();
      var valid = true;
      var firstInvalid = null;

      requiredFields.forEach(function(name){
        var input = form.elements[name];
        if(!input) return;
        var row = input.closest(".form-row");
        var ok = input.value.trim().length > 0;
        if(row) row.classList.toggle("has-error", !ok);
        input.setAttribute("aria-invalid", String(!ok));
        if(!ok){
          valid = false;
          if(!firstInvalid) firstInvalid = input;
        }
      });

      if(!valid){
        if(note) note.textContent = "Falta completar algunos campos para continuar.";
        if(firstInvalid) firstInvalid.focus();
        return;
      }

      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var service = form.elements.service.value;
      var zone = form.elements.zone.value.trim();
      var message = form.elements.message.value.trim();

      var text = "Hola, soy " + name + ". Quiero pedir agua para: " + service + ".\n" +
                 "Zona o dirección: " + zone + ".\n" +
                 "Mi teléfono: " + phone + ".";
      if(message) text += "\n" + message;

      var url = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(text);
      if(note) note.textContent = "Te estamos redirigiendo a WhatsApp...";
      window.open(url, "_blank", "noopener");

      setTimeout(function(){ if(note) note.textContent = defaultNote; }, 4000);
    });
  }

  /* =========================================================
     CANVAS WATER FIELD — used for the hero and the statement
     break. Pauses off-screen, freezes under reduced motion.
     ========================================================= */
  function createWaterField(canvas, opts){
    if(!canvas) return;
    var ctx = canvas.getContext("2d");
    var width = 0, height = 0, dpr = 1;
    var particles = [];
    var time = 0;
    var rafId = null;
    var running = false;

    function resize(){
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = [];
      var count = opts.particleCount || 24;
      for(var i = 0; i < count; i++){
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 1 + Math.random() * 2.2,
          speed: 0.12 + Math.random() * 0.3,
          drift: Math.random() * Math.PI * 2
        });
      }
    }

    function drawWaves(){
      opts.layers.forEach(function(layer, i){
        ctx.beginPath();
        var baseY = height * layer.baseY;
        ctx.moveTo(0, baseY);
        for(var x = 0; x <= width; x += 14){
          var y = baseY + Math.sin((x * layer.frequency) + time * layer.speed + i * 1.4) * layer.amplitude;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = layer.color;
        ctx.fill();
      });
    }

    function drawParticles(){
      ctx.save();
      particles.forEach(function(p){
        p.y -= p.speed;
        p.x += Math.sin(time * 0.6 + p.drift) * 0.3;
        if(p.y < -8){ p.y = height + 8; p.x = Math.random() * width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = opts.particleColor || "rgba(255,255,255,.5)";
        ctx.fill();
      });
      ctx.restore();
    }

    function frame(){
      time += 0.016;
      ctx.clearRect(0, 0, width, height);
      drawWaves();
      drawParticles();
      rafId = requestAnimationFrame(frame);
    }

    function start(){
      if(running || reduceMotion) return;
      running = true;
      rafId = requestAnimationFrame(frame);
    }
    function stop(){
      running = false;
      if(rafId) cancelAnimationFrame(rafId);
    }

    resize();

    if(reduceMotion){
      ctx.clearRect(0, 0, width, height);
      drawWaves();
    } else if("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          entry.isIntersecting ? start() : stop();
        });
      }, { threshold: 0.05 });
      io.observe(canvas);
    } else {
      start();
    }

    var resizeTimer;
    window.addEventListener("resize", function(){
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function(){
        resize();
        if(reduceMotion || !running){ ctx.clearRect(0, 0, width, height); drawWaves(); }
      }, 200);
    });
  }

  function initCanvases(){
    createWaterField(document.getElementById("hero-canvas"), {
      particleCount: 28,
      particleColor: "rgba(180,222,255,.55)",
      layers: [
        { amplitude: 16, frequency: 0.006, speed: 0.55, baseY: 0.86, color: "rgba(10,60,100,.55)" },
        { amplitude: 24, frequency: 0.0038, speed: 0.35, baseY: 0.94, color: "rgba(5,10,17,.92)" }
      ]
    });
    createWaterField(document.getElementById("statement-canvas"), {
      particleCount: 16,
      particleColor: "rgba(180,222,255,.32)",
      layers: [
        { amplitude: 14, frequency: 0.007, speed: 0.45, baseY: 0.74, color: "rgba(10,60,100,.4)" },
        { amplitude: 20, frequency: 0.0045, speed: 0.3, baseY: 0.9, color: "rgba(5,10,17,.7)" }
      ]
    });
  }

  /* =========================================================
     MISC
     ========================================================= */
  function initFooterYear(){
    var el = document.getElementById("year");
    if(el) el.textContent = new Date().getFullYear();
  }

  /* =========================================================
     BOOT
     ========================================================= */
  initFooterYear();
  initMobileNav();
  initWaModal();
  initContactForm();
  initScrollEffects();
  initScrollReveal();
  initCanvases();

  initLoader(function(){
    revealHero();
  });
})();
