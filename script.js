(function () {
  const header = document.querySelector(".site-header");
  const nav = document.querySelector(".nav");
  const navToggle = document.querySelector(".nav-toggle");
  const yearEl = document.getElementById("year");
  const reveals = document.querySelectorAll("[data-reveal]");
  const asciiPre = document.querySelector(".hero-ascii-bg");

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  /** 히어로 illy 줄 단위 인트로: 흩어졌다가 다시 모임 */
  function buildIntroScatterHtml(lines) {
    return lines
      .map(function (line, i) {
        var sx = (Math.random() - 0.5) * 2;
        var sy = (Math.random() - 0.5) * 2;
        var sr = (Math.random() - 0.5) * 2;
        return (
          '<span class="scatter-line" style="--sx:' +
          sx +
          ";--sy:" +
          sy +
          ";--sr:" +
          sr +
          ";--line-i:" +
          i +
          '">' +
          escapeHtml(line) +
          "</span>"
        );
      })
      .join("");
  }

  if (asciiPre) {
    fetch("illy2.txt")
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then((text) => {
        var norm = text.replace(/\r\n/g, "\n").trimEnd();
        var lines = norm.split("\n");
        var reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        if (reduceMotion || lines.length === 0) {
          asciiPre.textContent = norm;
          return;
        }

        asciiPre.classList.add("hero-ascii-bg--intro-scatter");
        asciiPre.innerHTML = buildIntroScatterHtml(lines);

        var dur = window.matchMedia("(max-width: 720px)").matches ? 2.05 : 2.45;
        var stagger = 0.018;
        var settleMs = (dur + (lines.length - 1) * stagger + 0.08) * 1000;
        window.setTimeout(function () {
          asciiPre.classList.add("hero-ascii-bg--scatter-settled");
        }, settleMs);
      })
      .catch(() => {});
  }

  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  function setHeaderScrolled() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  setHeaderScrolled();
  window.addEventListener("scroll", setHeaderScrolled, { passive: true });

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
      navToggle.querySelector(".sr-only").textContent = open
        ? "메뉴 열기"
        : "메뉴 닫기";
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
        navToggle.querySelector(".sr-only").textContent = "메뉴 열기";
      });
    });
  }

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );

    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /** Hero ASCII background: subtle mouse-follow tilt (illy2 / ascii-art layer) */
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const hero = document.querySelector(".hero");
    if (hero) {
      const smooth = { x: 0, y: 0 };
      const target = { x: 0, y: 0 };
      let rafId = null;
      let heroVisible = true;

      function setHeroVars(x, y) {
        hero.style.setProperty("--ascii-nx", x.toFixed(5));
        hero.style.setProperty("--ascii-ny", y.toFixed(5));
      }

      function loop() {
        const k = heroVisible ? 0.09 : 0.06;
        smooth.x += (target.x - smooth.x) * k;
        smooth.y += (target.y - smooth.y) * k;
        setHeroVars(smooth.x, smooth.y);

        const epsilon = heroVisible ? 0.004 : 0.001;
        if (
          Math.abs(target.x - smooth.x) > epsilon ||
          Math.abs(target.y - smooth.y) > epsilon
        ) {
          rafId = requestAnimationFrame(loop);
        } else {
          rafId = null;
          if (!heroVisible) {
            smooth.x = 0;
            smooth.y = 0;
            target.x = 0;
            target.y = 0;
            setHeroVars(0, 0);
          }
        }
      }

      function kick() {
        if (!rafId) {
          rafId = requestAnimationFrame(loop);
        }
      }

      function pointerToTarget(ev) {
        const w = window.innerWidth;
        const h = window.innerHeight;
        let cx = ev.clientX;
        let cy = ev.clientY;
        if (ev.touches?.length) {
          cx = ev.touches[0].clientX;
          cy = ev.touches[0].clientY;
        }
        target.x = (cx / Math.max(w, 1) - 0.5) * 2;
        target.y = (cy / Math.max(h, 1) - 0.5) * 2;
        if (heroVisible) {
          kick();
        }
      }

      window.addEventListener("mousemove", pointerToTarget, {
        passive: true,
      });
      window.addEventListener("touchstart", pointerToTarget, {
        passive: true,
      });
      window.addEventListener("touchmove", pointerToTarget, {
        passive: true,
      });

      if ("IntersectionObserver" in window) {
        const heroIo = new IntersectionObserver(
          ([entry]) => {
            heroVisible = entry.isIntersecting;
            if (!heroVisible) {
              target.x = 0;
              target.y = 0;
              kick();
            }
          },
          { root: null, threshold: 0.08 }
        );
        heroIo.observe(hero);
      }
    }
  }

  /** Work: 세로 스크롤에 연동해 카드 트랙 가로 이동 */
  function initWorkCarousel() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const host = document.getElementById("work-scroll-host");
    const range = document.querySelector(".work-pin-scroll-range");
    const sticky = document.querySelector(".work-pin-sticky");
    const viewport = document.querySelector(".work-cards-viewport");
    const track = document.getElementById("work-cards-track");
    if (!host || !range || !sticky || !viewport || !track) return;
    const focusId = new URLSearchParams(window.location.search).get("focus");
    let focusApplied = false;

    let frame = null;

    function updateTransform() {
      const maxScroll = host.scrollHeight - host.clientHeight;
      const progress =
        maxScroll <= 0 ? 0 : Math.min(1, host.scrollTop / maxScroll);
      const maxX = Math.max(0, track.scrollWidth - viewport.clientWidth);
      track.style.transform = "translateX(" + -progress * maxX + "px)";
    }

    function layoutCarouselHeights() {
      const H = host.clientHeight;
      if (H < 1) return;

      host.style.setProperty("--work-sticky-h", H + "px");
      sticky.style.minHeight = H + "px";

      const maxX = Math.max(0, track.scrollWidth - viewport.clientWidth);
      range.style.minHeight = H + maxX + "px";

      updateTransform();
      alignToFocusedCard();
    }

    function alignToFocusedCard() {
      if (focusApplied || !focusId) return;

      const targetCard = track.querySelector(
        '.project-card[data-project-id="' + focusId + '"]'
      );
      if (!targetCard) return;

      const maxX = Math.max(0, track.scrollWidth - viewport.clientWidth);
      const maxScroll = host.scrollHeight - host.clientHeight;
      if (maxX <= 0 || maxScroll <= 0) {
        focusApplied = true;
        return;
      }

      const targetX = Math.min(Math.max(targetCard.offsetLeft, 0), maxX);
      host.scrollTop = (targetX / maxX) * maxScroll;
      updateTransform();
      focusApplied = true;
    }

    function onScroll() {
      if (frame != null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () {
        frame = null;
        updateTransform();
      });
    }

    host.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", layoutCarouselHeights);

    var ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(function () {
            layoutCarouselHeights();
          })
        : null;
    if (ro) {
      ro.observe(host);
      ro.observe(track);
      ro.observe(viewport);
    }

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(layoutCarouselHeights).catch(layoutCarouselHeights);
    } else {
      window.requestAnimationFrame(layoutCarouselHeights);
    }

    window.addEventListener("load", layoutCarouselHeights);

    layoutCarouselHeights();
  }

  initWorkCarousel();
})();
