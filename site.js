// ==========================================================================
// Rapid Wash — page features (plain JS, no build step)
// Before/after slider, scroll-to-clean scene, service-area fees,
// plan builder, and the step-by-step quote. script.js still runs the
// menu, sticky CTA and the homepage quote form.
// ==========================================================================

const RW = (() => {
  // Keep in sync with QUOTE_REQUEST_EMAIL in script.js.
  const EMAIL = "rapidwashprosbros@gmail.com";
  const PHONE = "(629) 301-1813";
  const HOME = [36.2523, -85.9516]; // Carthage, TN

  // [town, lat, lon]. Distances are straight-line from Carthage.
  const TOWNS = [
    ["Carthage", 36.2523, -85.9516], ["South Carthage", 36.2442, -85.953],
    ["Gordonsville", 36.1773, -85.9297], ["Granville", 36.2706, -85.7811],
    ["Alexandria", 36.077, -86.0333], ["Watertown", 36.1003, -86.1328],
    ["Hartsville", 36.3909, -86.1677], ["Gainesboro", 36.3556, -85.6583],
    ["Baxter", 36.1537, -85.643], ["Lebanon", 36.2081, -86.2911],
    ["Red Boiling Springs", 36.5331, -85.8494], ["Lafayette", 36.5212, -86.0264],
    ["Smithville", 35.9606, -85.8139], ["Cookeville", 36.1628, -85.5016],
    ["Algood", 36.1959, -85.4486], ["Westmoreland", 36.562, -86.2478],
    ["Gallatin", 36.3884, -86.4467], ["Woodbury", 35.8273, -86.0717],
    ["Mt. Juliet", 36.2001, -86.5186], ["Celina", 36.5501, -85.505],
    ["Sparta", 35.9259, -85.4641], ["Livingston", 36.3834, -85.323],
    ["Hendersonville", 36.3048, -86.62], ["Murfreesboro", 35.8456, -86.3903],
    ["McMinnville", 35.6834, -85.7697], ["Nashville", 36.1627, -86.7816],
    ["Crossville", 35.9489, -85.0269],
  ];

  // Rapid Wash price list, per square foot.
  const RATES = { concrete: 0.2, soft1: 0.2, soft2: 0.25 };

  // Travel fee per visit by straight-line miles from Carthage.
  const FEES = [
    { max: 30, fee: 0, label: "No travel fee" },
    { max: 45, fee: 25, label: "$25 travel fee per visit" },
    { max: 55, fee: 50, label: "$50 travel fee per visit" },
  ];

  function miles([lat, lon]) {
    const r = (d) => (d * Math.PI) / 180;
    const dLat = r(lat - HOME[0]), dLon = r(lon - HOME[1]);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(r(HOME[0])) * Math.cos(r(lat)) * Math.sin(dLon / 2) ** 2;
    return 3958.8 * 2 * Math.asin(Math.sqrt(a));
  }

  // null = outside the 55-mile area (ask us).
  const tier = (mi) => FEES.find((t) => mi <= t.max) || null;

  function town(name) {
    const t = TOWNS.find((t) => t[0] === name);
    if (!t) return null;
    const mi = miles([t[1], t[2]]);
    return { name, mi: Math.round(mi), tier: tier(mi) };
  }

  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

  function sendEmail(subject, lines) {
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.filter(Boolean).join("\n"))}`;
  }

  function townOptions(select) {
    TOWNS.map((t) => town(t[0]))
      .sort((a, b) => a.mi - b.mi)
      .forEach((t) => select.add(new Option(`${t.name} (${t.mi} mi)`, t.name)));
    select.add(new Option("Somewhere else", "Other"));
  }

  return { EMAIL, PHONE, TOWNS, RATES, FEES, miles, tier, town, money, sendEmail, townOptions };
})();

// Self-check of the fee math (shows in the console if it ever breaks).
console.assert(RW.town("Carthage").mi === 0 && RW.town("Carthage").tier.fee === 0, "fee: Carthage");
console.assert(RW.town("Lebanon").mi === 19, "miles: Lebanon");
console.assert(RW.tier(30).fee === 0 && RW.tier(30.5).fee === 25 && RW.tier(55).fee === 50 && RW.tier(56) === null, "fee tiers");

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Before/after slider ----------
  // A full-size range input sits on top, so mouse, touch and arrow keys all work.
  document.querySelectorAll("[data-ba]").forEach((ba) => {
    const range = ba.querySelector("input[type=range]");
    const set = () => ba.style.setProperty("--pos", range.value + "%");
    range.addEventListener("input", set);
    set();
  });

  document.querySelectorAll("[data-ba-tabs]").forEach((tabs) => {
    const buttons = tabs.querySelectorAll("[data-ba-tab]");
    buttons.forEach((btn) =>
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.setAttribute("aria-selected", b === btn));
        document.querySelectorAll(`[data-ba-group="${tabs.dataset.baTabs}"]`).forEach((ba) => {
          ba.hidden = ba.dataset.baName !== btn.dataset.baTab;
        });
      })
    );
  });

  // ---------- Job clips: play only while on screen (saves data); controls instead if motion is reduced ----------
  const clips = document.querySelectorAll("video[data-autoplay]");
  if (clips.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      clips.forEach((v) => (v.controls = true));
    } else {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (e.isIntersecting) e.target.play().catch(() => (e.target.controls = true));
        else e.target.pause();
      }), { threshold: 0.4 });
      clips.forEach((v) => io.observe(v));
    }
  }

  // ---------- Our Work: filter photos by job type ----------
  const filter = document.querySelector("[data-work-filter]");
  if (filter) {
    const buttons = filter.querySelectorAll("[data-filter]");
    buttons.forEach((b) => b.addEventListener("click", () => {
      buttons.forEach((x) => x.setAttribute("aria-pressed", x === b));
      document.querySelectorAll("[data-work-grid] figure").forEach((fig) => {
        fig.hidden = b.dataset.filter !== "all" && fig.dataset.cat !== b.dataset.filter;
      });
    }));
  }

  // ---------- Service list: photo follows the hovered row ----------
  const peek = document.querySelector("[data-peek-img]");
  if (peek) {
    document.querySelectorAll("[data-peek]").forEach((a) => {
      const swap = () => { if (peek.getAttribute("src") !== a.dataset.peek) peek.src = a.dataset.peek; };
      a.addEventListener("mouseenter", swap);
      a.addEventListener("focus", swap);
    });
  }

  // ---------- Self-rinsing clean scene ----------
  // When the photo is on screen, streams of water run down it and wash the grime (a canvas over the clean
  // photo) away from the top down. It holds clean, the grime slowly regrows, then it rinses again.
  // No interaction needed and page scrolling is never held. Without JS the clean photo simply shows.
  const scene = document.querySelector("[data-clean-scene]");
  if (scene) {
    const stage = scene.querySelector(".clean-sticky");
    const before = stage.querySelector("img:not(.clean-after)");
    const shade = stage.querySelector(".clean-shade");
    const mk = (cls) => { const c = document.createElement("canvas"); c.className = cls; c.setAttribute("aria-hidden", "true"); stage.insertBefore(c, shade); return c; };
    const grime = mk("clean-canvas"), water = mk("clean-fx");
    scene.classList.add("is-prep"); // show the dirty photo until the grime layer is painted
    const g = grime.getContext("2d"), w = water.getContext("2d");
    const COLS = 32, ROWS = 18, DONE_AT = 0.9;     // coverage grid: fade the rest once 90% is washed
    const HOLD = 3000, REGROW = 6000, REST = 1500;  // keep REGROW in sync with .is-regrow in styles.css
    let cells, washed = 0, width = 0, streams = [], running = false, inView = false, phase = "idle", last = 0, startedAt = 0;

    const paintGrime = () => {
      if (!before.naturalWidth) return false;
      const r = stage.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.round(r.width);
      grime.width = water.width = Math.round(r.width * dpr);
      grime.height = water.height = Math.round(r.height * dpr);
      const s = Math.max(grime.width / before.naturalWidth, grime.height / before.naturalHeight); // object-fit: cover
      const iw = before.naturalWidth * s, ih = before.naturalHeight * s;
      g.globalCompositeOperation = "source-over";
      g.drawImage(before, (grime.width - iw) / 2, (grime.height - ih) / 2, iw, ih);
      // On a first visit the photo can report a size before it's drawable, leaving the layer blank:
      // check the paint took, and if not, try again shortly instead of rinsing a clean photo.
      if (!g.getImageData(grime.width >> 1, grime.height >> 1, 1, 1).data[3]) {
        setTimeout(() => { if (!cells) ready(); }, 250);
        return false;
      }
      cells = new Uint8Array(COLS * ROWS); washed = 0;
      scene.classList.add("is-wipe");
      scene.classList.remove("is-prep");
      return true;
    };
    const erase = (x, y, rad) => {
      const grd = g.createRadialGradient(x, y, rad * 0.3, x, y, rad);
      grd.addColorStop(0, "rgba(0,0,0,1)"); grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
      const cx = Math.floor((x / grime.width) * COLS), cy = Math.floor((y / grime.height) * ROWS);
      const span = Math.max(0, Math.floor(((rad * 0.6) / grime.width) * COLS));
      for (let i = -span; i <= span; i++) {
        const gx = cx + i, k = cy * COLS + gx;
        if (gx >= 0 && gx < COLS && cy >= 0 && cy < ROWS && !cells[k]) { cells[k] = 1; washed++; }
      }
    };
    const newStream = (W, H, delay) => ({
      x: Math.random() * W, y: -Math.random() * H * 0.15, delay,
      v: H * (0.00018 + Math.random() * 0.00022),        // px per ms: about 3-6 s top to bottom
      wob: Math.random() * Math.PI * 2, wobAmp: W * (0.002 + Math.random() * 0.004),
      w: W * (0.018 + Math.random() * 0.02), trail: [],
    });
    const startRinse = () => {
      const W = grime.width, H = grime.height;
      streams = Array.from({ length: Math.round(14 + W / 90) }, (_, i) => newStream(W, H, i * 90 + Math.random() * 600));
      phase = "rinse"; startedAt = performance.now();
      scene.classList.remove("is-clean", "is-regrow");
      loop();
    };
    const loop = () => { if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); } };
    const frame = (now) => {
      const dt = Math.min(50, now - last); last = now;
      const W = water.width, H = water.height, t = now - startedAt;
      w.clearRect(0, 0, W, H);
      if (phase === "rinse") {
        g.globalCompositeOperation = "destination-out";
        streams.forEach((s) => {
          if (t < s.delay) return;
          if (s.y < H + s.w * 2) {
            s.y += s.v * dt * (1 + Math.min(1, s.y / H) * 0.6); // speeds up a little as it runs down
            s.wob += dt * 0.004;
            s.x += Math.sin(s.wob) * s.wobAmp * 0.08;
            erase(s.x, s.y, s.w);
            s.trail.push({ x: s.x, y: s.y });
          }
          // the wet trail spreads sideways over time so neighbouring streams join up
          if (s.trail.length > 4) {
            const p = s.trail[Math.floor(Math.random() * s.trail.length)];
            erase(p.x + (Math.random() - 0.5) * s.w * 2, p.y, s.w * (1.2 + Math.min(2.2, t / 2500)));
          }
          // the visible water: a faint wet film along the run, and a thin see-through streak that fades toward the top
          w.lineCap = "round"; w.lineJoin = "round";
          if (s.trail.length > 2) {
            w.strokeStyle = "rgba(210, 235, 255, 0.07)"; w.lineWidth = s.w * 1.3;
            w.beginPath(); w.moveTo(s.trail[0].x, s.trail[0].y);
            for (let i = 3; i < s.trail.length; i += 3) w.lineTo(s.trail[i].x, s.trail[i].y);
            w.stroke();
          }
          const len = Math.min(s.trail.length, 30);
          if (len > 2 && s.y < H + s.w * 2) {
            const tail = s.trail.slice(-len), a = tail[0];
            const grad = w.createLinearGradient(a.x, a.y, s.x, s.y);
            grad.addColorStop(0, "rgba(230, 244, 255, 0)"); grad.addColorStop(1, "rgba(230, 244, 255, 0.42)");
            w.strokeStyle = grad; w.lineWidth = Math.max(1.5, s.w * 0.22);
            w.beginPath(); w.moveTo(a.x, a.y); tail.forEach((q) => w.lineTo(q.x, q.y)); w.stroke();
            w.fillStyle = "rgba(255, 255, 255, 0.5)"; // small glint at the leading edge
            w.beginPath(); w.arc(s.x, s.y, Math.max(1.2, s.w * 0.14), 0, Math.PI * 2); w.fill();
          }
        });
        if (washed / cells.length > DONE_AT || t > 9000) {
          phase = "hold"; startedAt = now; scene.classList.add("is-clean");
        }
      } else if (phase === "hold" && t > HOLD) {
        // grime grows back slowly (CSS fade), then the next rinse runs if the photo is still on screen
        paintGrime(); scene.classList.add("is-regrow"); scene.classList.remove("is-clean");
        phase = "regrow"; startedAt = now;
      } else if (phase === "regrow" && t > REGROW + REST) {
        scene.classList.remove("is-regrow");
        if (inView) startRinse(); else phase = "idle";
      }
      if (phase === "idle") { running = false; w.clearRect(0, 0, W, H); return; }
      requestAnimationFrame(frame);
    };

    const begin = () => {
      if (phase !== "idle" || !inView || !cells) return;
      if (reduceMotion) { // no running water: a gentle one-time fade from dirty to clean
        phase = "done"; scene.classList.add("is-clean"); return;
      }
      startRinse();
    };
    before.loading = "eager"; // the canvas needs this photo up front
    const ready = () => { if (!cells && paintGrime()) begin(); };
    before.addEventListener("load", ready);
    if (before.decode) before.decode().then(ready, () => {});
    if (before.complete && before.naturalWidth) ready();
    window.addEventListener("resize", () => {
      const r = stage.getBoundingClientRect();
      if (Math.round(r.width) !== width && phase === "idle" && cells) paintGrime(); // ignore height-only resizes (mobile URL bar)
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { inView = e.isIntersecting; begin(); }, { threshold: 0.35 }).observe(stage);
    } else { inView = true; begin(); }
    console.assert(DONE_AT > 0.5 && REGROW > 0, "rinse settings look wrong");
  }

  // ---------- Service area: town lookup ----------
  document.querySelectorAll("[data-town-check]").forEach((box) => {
    const select = box.querySelector("select");
    const out = box.querySelector("[data-town-result]");
    RW.townOptions(select);
    select.addEventListener("change", () => {
      const t = RW.town(select.value);
      out.innerHTML = !t
        ? `Text your address to <a href="sms:6293011813">${RW.PHONE}</a> and we'll tell you if we can get there.`
        : t.tier
          ? `<strong>${t.name}</strong> is about ${t.mi} miles from Carthage. <strong>${t.tier.label}.</strong>`
          : `<strong>${t.name}</strong> is about ${t.mi} miles from Carthage, outside our usual area. Text us at <a href="sms:6293011813">${RW.PHONE}</a> and ask.`;
    });
  });

  // ---------- Service area: radius map ----------
  const map = document.querySelector("[data-radius-map]");
  if (map) {
    const S = 4.2; // px per mile; map is 520 x 520 centered on Carthage
    const ns = "http://www.w3.org/2000/svg";
    const el = (tag, attrs, text) => {
      const n = document.createElementNS(ns, tag);
      Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
      if (text) n.textContent = text;
      return n;
    };
    const rings = map.querySelector("[data-rings]");
    [...RW.FEES].reverse().forEach((t, i) => {
      rings.append(el("circle", { cx: 260, cy: 260, r: t.max * S, class: `ring ring-${2 - i}` }));
      rings.append(el("text", { x: 260, y: 260 - t.max * S + 14, class: "ring-label" }, `${t.max} mi`));
    });
    const dots = map.querySelector("[data-towns]");
    RW.TOWNS.forEach(([name, lat, lon]) => {
      if (name === "South Carthage") return;
      const x = 260 + (lon + 85.9516) * 69.17 * Math.cos((36.25 * Math.PI) / 180) * S;
      const y = 260 - (lat - 36.2523) * 69 * S;
      if (x < 0 || x > 520 || y < 0 || y > 520) return;
      const home = name === "Carthage";
      dots.append(el("circle", { cx: x, cy: y, r: home ? 7 : 3.5, class: home ? "town home" : "town" }));
      // Towns right next to Carthage would pile labels on top of it; their dots still show.
      if (!home && (RW.town(name).mi < 14 || name === "Baxter" || name === "Algood")) return;
      const right = x > 430; // keep labels near the right edge inside the map
      dots.append(el("text", { x: right ? x - 7 : x + (home ? 11 : 7), y: y + 4, "text-anchor": right ? "end" : "start", class: home ? "town-label home" : "town-label" }, name));
    });
  }

  // ---------- Service area: real map tiles (Leaflet) ----------
  // Replaces the drawn SVG only when Leaflet loaded; otherwise the SVG stays as the fallback.
  const areaMap = document.querySelector("[data-area-map]");
  if (areaMap && window.L) {
    const box = document.createElement("div");
    box.className = "leaflet-area";
    box.setAttribute("role", "img");
    box.setAttribute("aria-label", areaMap.querySelector(".radius-map").getAttribute("aria-label"));
    areaMap.prepend(box);
    const svgMap = areaMap.querySelector(".radius-map");
    svgMap.style.display = "none";
    try {
    const touch = window.matchMedia("(pointer: coarse)").matches; // don't trap page scrolling on phones
    const m = L.map(box, { scrollWheelZoom: false, dragging: !touch, tap: false, zoomSnap: 0.25 });
    // If the tile server is blocked or down (no tile ever loads), show the drawn map instead of broken squares.
    let tileOk = false;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    })
      .on("tileload", () => { tileOk = true; })
      .on("tileerror", () => { if (!tileOk && box.isConnected) { m.remove(); box.remove(); svgMap.style.display = ""; } })
      .addTo(m);

    const HOME = [36.2523, -85.9516];
    const BLUE = "#0ea5e9";
    [...RW.FEES].reverse().forEach((t, i) => {
      // i: 0 = outermost (55 mi, lightest) ... 2 = innermost (30 mi, strongest)
      L.circle(HOME, {
        radius: t.max * 1609.34, color: BLUE, weight: 2, opacity: [0.5, 0.7, 1][i],
        dashArray: ["2 7", "6 6", null][i], fillColor: BLUE, fillOpacity: [0.05, 0.08, 0.14][i], interactive: false,
      }).addTo(m);
      L.marker([HOME[0] + t.max / 69, HOME[1]], {
        icon: L.divIcon({ className: "ring-tag", html: `${t.max} mi`, iconSize: null }), interactive: false, keyboard: false,
      }).addTo(m);
    });

    RW.TOWNS.forEach(([name, lat, lon]) => {
      if (name === "South Carthage") return;
      const home = name === "Carthage";
      const t = RW.town(name);
      L.circleMarker([lat, lon], { radius: home ? 8 : 5, color: "#fff", weight: 2, fillColor: home ? BLUE : "#0f172a", fillOpacity: 1 })
        .bindTooltip(home ? "Carthage, home base" : `${name}: ${t.mi} mi, ${t.tier ? t.tier.label.toLowerCase() : "ask us"}`, {
          permanent: home, direction: "right", offset: [8, 0], className: home ? "town-tip home" : "town-tip",
        })
        .addTo(m);
    });

    m.fitBounds(L.latLng(HOME).toBounds(RW.FEES.at(-1).max * 1609.34 * 2), { padding: [8, 8] });
    } catch (err) {
      // Fall back to the drawn map rather than leaving an empty box.
      box.remove();
      svgMap.style.display = "";
      console.error(err);
    }
  }

  // ---------- Plan builder ----------
  const plan = document.querySelector("[data-plan]");
  if (plan) {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const SERVICES = [
      ["house", "House soft wash"], ["concrete", "Driveway & concrete"], ["windows", "Windows"],
      ["gutters", "Gutters"], ["fence", "Fence"], ["deck", "Deck"],
    ];
    const PRESETS = { twice: [3, 9], three: [3, 6, 9], four: [2, 5, 8, 10] };
    const state = new Map(); // month index -> Set of service keys

    const monthsEl = plan.querySelector("[data-plan-months]");
    const visitsEl = plan.querySelector("[data-plan-visits]");
    const f = plan.querySelector("form");
    RW.townOptions(f.town);

    MONTHS.forEach((m, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "month";
      b.textContent = m;
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", () => {
        state.has(i) ? state.delete(i) : state.set(i, new Set(["house", "concrete"]));
        render();
      });
      monthsEl.append(b);
    });

    plan.querySelectorAll("[data-preset]").forEach((b) =>
      b.addEventListener("click", () => {
        state.clear();
        PRESETS[b.dataset.preset].forEach((i) => state.set(i, new Set(i === 3 || i === 9 ? ["house", "concrete", "windows"] : ["concrete", "windows"])));
        render();
      })
    );

    function visitPrice(services) {
      const sq = +f.homeSqft.value || 0, cq = +f.concreteSqft.value || 0;
      let known = 0, quoted = [];
      services.forEach((s) => {
        if (s === "house") sq ? (known += sq * (f.stories.value === "2" ? RW.RATES.soft2 : RW.RATES.soft1)) : quoted.push("house wash (add home size)");
        else if (s === "concrete") cq ? (known += cq * RW.RATES.concrete) : quoted.push("concrete (add square feet)");
        else quoted.push(SERVICES.find((x) => x[0] === s)[1].toLowerCase());
      });
      return { known, quoted };
    }

    function render() {
      monthsEl.querySelectorAll(".month").forEach((b, i) => {
        b.setAttribute("aria-pressed", state.has(i));
      });
      visitsEl.innerHTML = "";
      const t = RW.town(f.town.value);
      const fee = t && t.tier ? t.tier.fee : 0;
      let year = 0;
      const quotedAll = new Set();
      const listEl = plan.querySelector("[data-plan-list]");
      listEl.innerHTML = "";
      [...state.keys()].sort((a, b) => a - b).forEach((i) => {
        const set = state.get(i);
        const { known, quoted } = visitPrice(set);
        quoted.forEach((q) => quotedAll.add(q));
        const visitTotal = set.size ? known + fee : 0;
        year += visitTotal;
        const priceText = visitTotal ? RW.money(visitTotal) + (quoted.length ? " +" : "") : quoted.length ? "Quoted" : "Pick services";
        const li = document.createElement("li");
        li.innerHTML = `<span>${MONTHS[i]} visit</span><strong>${priceText}</strong>`;
        listEl.append(li);
        const row = document.createElement("div");
        row.className = "visit";
        row.innerHTML = `<div class="visit-head"><strong>${MONTHS[i]}</strong><span>${priceText}</span></div>`;
        const chips = document.createElement("div");
        chips.className = "chips";
        SERVICES.forEach(([key, label]) => {
          const c = document.createElement("button");
          c.type = "button";
          c.className = "chip";
          c.textContent = label;
          c.setAttribute("aria-pressed", set.has(key));
          c.addEventListener("click", () => { set.has(key) ? set.delete(key) : set.add(key); render(); });
          chips.append(c);
        });
        row.append(chips);
        visitsEl.append(row);
      });

      const visits = state.size;
      plan.querySelector("[data-plan-count]").textContent = visits ? `${visits} visit${visits > 1 ? "s" : ""} a year` : "No visits yet";
      plan.querySelector("[data-plan-year]").textContent = year ? RW.money(year) : "$0";
      plan.querySelector("[data-plan-fee]").textContent = !f.town.value
        ? "Pick your town to add any travel fee."
        : t ? (t.tier ? `${t.tier.label} (${t.name}, about ${t.mi} mi).` : `${t.name} is outside our usual area. Text us to ask.`) : "Travel fee depends on your address.";
      plan.querySelector("[data-plan-quoted]").textContent = quotedAll.size ? `Not included yet, priced when we see the property: ${[...quotedAll].join(", ")}.` : "";
      plan.querySelector("[data-plan-empty]").hidden = visits > 0;
    }

    ["input", "change"].forEach((ev) => f.addEventListener(ev, render));

    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const err = plan.querySelector("[data-plan-error]");
      if (!state.size) return (err.textContent = "Pick at least one month first.");
      if (!f.name.value.trim() || !f.phone.value.trim()) return (err.textContent = "Add your name and phone number.");
      err.textContent = "";
      const prices = [...plan.querySelectorAll("[data-plan-list] strong")].map((s) => s.textContent);
      const lines = [...state.keys()].sort((a, b) => a - b).map((i, n) => `- ${MONTHS[i]} (${prices[n]}): ${[...state.get(i)].map((k) => SERVICES.find((s) => s[0] === k)[1]).join(", ")}`);
      RW.sendEmail(`Plan Request from ${f.name.value} - ${state.size} visits/year`, [
        `Name: ${f.name.value}`, `Phone: ${f.phone.value}`, f.email.value && `Email: ${f.email.value}`,
        `Town: ${f.town.value || "Not given"}`, f.address.value && `Address: ${f.address.value}`,
        `Home: ${f.homeSqft.value || "?"} sq ft, ${f.stories.value}-story`, `Concrete: ${f.concreteSqft.value || "?"} sq ft`,
        "", "Visits:", ...lines, "",
        `Website estimate: ${plan.querySelector("[data-plan-year]").textContent} for the year, billed per visit`,
        plan.querySelector("[data-plan-quoted]").textContent,
        f.notes.value && `Notes: ${f.notes.value}`,
      ]);
      plan.querySelector("[data-plan-sent]").hidden = false;
    });

    render();
  }

  // ---------- Step-by-step quote ----------
  const wiz = document.querySelector("[data-wizard]");
  if (wiz) {
    const steps = [...wiz.querySelectorAll(".wiz-step")];
    const bar = wiz.querySelector("[data-wiz-bar]");
    const count = wiz.querySelector("[data-wiz-count]");
    const back = wiz.querySelector("[data-wiz-back]");
    const next = wiz.querySelector("[data-wiz-next]");
    const submit = wiz.querySelector("[data-wiz-submit]");
    const f = wiz.querySelector("form");
    let at = 0;
    RW.townOptions(f.town);

    // ?service=Driveways preselects a service (used by buttons on other pages).
    const pre = new URLSearchParams(location.search).get("service");
    if (pre) f.querySelectorAll("input[name=service]").forEach((c) => { if (c.value === pre) c.checked = true; });

    const show = (i) => {
      at = i;
      steps.forEach((s, j) => (s.hidden = j !== i));
      bar.style.width = ((i + 1) / steps.length) * 100 + "%";
      count.textContent = `${i + 1} / ${steps.length}`;
      back.hidden = i === 0;
      next.hidden = i === steps.length - 1;
      submit.hidden = i !== steps.length - 1;
      const first = steps[i].querySelector("input:not([type=checkbox]):not([type=radio]), select, textarea");
      if (first && !("ontouchstart" in window)) first.focus();
    };

    function check(i) {
      const step = steps[i];
      const err = step.querySelector(".form-error");
      let msg = "";
      if (step.dataset.need === "service" && !f.querySelector("input[name=service]:checked")) msg = "Pick at least one service.";
      if (step.dataset.need === "contact") {
        if (!f.name.value.trim()) msg = "Name is required.";
        else if (!f.phone.value.trim()) msg = "Phone number is required.";
        else if (f.email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value)) msg = "That email address doesn't look right.";
      }
      if (err) err.textContent = msg;
      return !msg;
    }

    f.town.addEventListener("change", () => {
      const t = RW.town(f.town.value);
      wiz.querySelector("[data-wiz-fee]").textContent = !t
        ? "No problem. We'll check the distance from your address."
        : t.tier ? `About ${t.mi} miles from Carthage. ${t.tier.label}.` : `About ${t.mi} miles away, outside our usual area. Send it anyway and we'll let you know.`;
    });

    next.addEventListener("click", () => { if (check(at)) show(at + 1); });
    back.addEventListener("click", () => show(Math.max(0, at - 1)));
    f.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.tagName !== "BUTTON") {
        e.preventDefault();
        if (at === steps.length - 1) f.requestSubmit();
        else if (check(at)) show(at + 1);
      }
    });

    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!check(at)) return;
      const services = [...f.querySelectorAll("input[name=service]:checked")].map((c) => c.value);
      const lights = services.includes("Christmas Lighting");
      const t = RW.town(f.town.value);
      RW.sendEmail(`Quote Request from ${f.name.value} - ${services.join(", ")}`, [
        `Name: ${f.name.value}`, `Phone: ${f.phone.value}`, f.email.value && `Email: ${f.email.value}`,
        `Services: ${services.join(", ")}`, `Property: ${f.property.value}`,
        `Town: ${f.town.value || "Not given"}${t ? ` (about ${t.mi} mi from Carthage)` : ""}`,
        f.address.value && `Address: ${f.address.value}`, f.timing.value && `Timing: ${f.timing.value}`,
        f.message.value && `Message: ${f.message.value}`,
        lights ? "\nPhotos: Please send photos of the sides and areas of your home you want lit. Text them to (629) 301-1813 or attach them to your quote email. We'll use them to create your free mockup." : null,
      ]);
      wiz.querySelector("[data-wiz-photo]").hidden = !lights;
      wiz.querySelector("[data-wiz-form]").hidden = true;
      wiz.querySelector("[data-wiz-done]").hidden = false;
    });

    wiz.querySelector("[data-wiz-again]").addEventListener("click", () => {
      f.reset();
      wiz.querySelector("[data-wiz-fee]").textContent = "";
      wiz.querySelector("[data-wiz-done]").hidden = true;
      wiz.querySelector("[data-wiz-form]").hidden = false;
      show(0);
    });

    show(0);
  }
});
