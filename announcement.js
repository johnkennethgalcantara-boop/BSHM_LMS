/* ACES Polytechnic College – Announcements (student) */
(function () {
  const KEY = "bshm.ann.custom"; // must match the teacher page
  const CATS = [["all", "All Announcements"], ["academic", "Academic"], ["administrative", "Administrative"], ["events", "Events"], ["others", "Others"]];
  const BADGE = { academic: "Academic", administrative: "Administrative", events: "Events", others: "Others" };
  const ICON = { administrative: "file", academic: "cal", events: "star", others: "alert" };

  const DATA = [
    { id: 1, title: "Class Suspension on April 24, 2025", category: "administrative", by: "Office of the President", when: "2025-04-23T10:30", text: "Please be informed that all classes are suspended on Thursday, April 24, 2025, due to inclement weather. Stay safe and take care, ACESians!" },
    { id: 2, title: "F&B Services Workshop (Practical)", category: "academic", by: "BSHM Department", when: "2025-04-22T14:15", text: "The F&B Services (Practical) workshop will be held on April 28, 2025, at the Training Kitchen. All BSHM 2nd Year students are required to attend. Please come in proper uniform." },
    { id: 3, title: "BSHM 2nd Year Grand Hospitality Week", category: "events", by: "BSHM Student Council", when: "2025-04-21T16:45", text: "Mark your calendars! The BSHM 2nd Year Grand Hospitality Week will be held on May 12–16, 2025 at the ACES Campus. Enjoy exciting activities, competitions, and more!" },
    { id: 4, title: "Submission of Midterm Grades", category: "academic", by: "Registrar's Office", when: "2025-04-20T09:20", text: "Please be reminded that the deadline for submission of midterm grades is on April 25, 2025. Kindly submit through the Student Information System (SIS)." },
    { id: 5, title: "Dress Code Reminder", category: "others", by: "Student Affairs Office", when: "2025-04-18T11:10", text: "This is a friendly reminder to all students to strictly follow the school's dress code policy, including proper uniform and ID. Let's maintain a neat and professional appearance at all times." },
    { id: 6, title: "Enrollment for SY 2025–2026", category: "administrative", by: "Registrar's Office", when: "2025-04-15T15:25", text: "The enrollment schedule for SY 2025–2026 is now open. Please check the updated schedule and requirements on the student portal or visit the Registrar's Office." },
    { id: 7, title: "BSHM Practical Examination Schedule", category: "academic", by: "BSHM Department", when: "2025-04-14T13:00", text: "The BSHM practical examination will be held on May 2, 2025. Bring your complete uniform and tools. Check your course page for the room assignment." },
    { id: 8, title: "Culinary Showcase Night", category: "events", by: "BSHM Student Council", when: "2025-04-12T10:00", text: "Join the Culinary Showcase Night on May 9, 2025 at the ACES Campus Hall. Students may sign up as participants or attend as guests." }
  ];

  /* Teacher posts (saved by the teacher page) + built-in mock data */
  const loadCustom = () => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  };
  const getAll = () => [...loadCustom(), ...DATA];

  const $ = (s) => document.querySelector(s);
  const state = { cat: "all" };
  let lastFocus = null;

  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const ico = (n) => `<svg class="i"><use href="#${n}"/></svg>`;

  function renderControls() {
    const L = getAll();
    const n = (k) => (k === "all" ? L.length : L.filter((a) => a.category === k).length);
    $("#tabs").innerHTML = CATS.map(([k, label]) =>
      `<button type="button" role="tab" data-k="${k}" aria-selected="${k === state.cat}" class="${k === state.cat ? "on" : ""}">${label} (${n(k)})</button>`).join("");
  }

  function renderList() {
    const rows = getAll()
      .filter((a) => state.cat === "all" || a.category === state.cat)
      .sort((a, b) => b.when.localeCompare(a.when));
    $("#list").innerHTML = rows.length ? rows.map((a) => `
      <article class="ai ${a.category}" role="button" tabindex="0" data-id="${a.id}" aria-label="Open ${esc(a.title)}">
        <span class="ic">${ico(ICON[a.category])}</span>
        <div>
          <b>${esc(a.title)}</b>
          <p class="ad">${esc(a.text)}</p>
          <div class="am"><span>${ico("user")}Posted by: ${esc(a.by)}</span><span>${ico("cal")}${fmtDate(a.when)}</span><span>${ico("clock")}${fmtTime(a.when)}</span></div>
        </div>
        <div class="rt"><span class="bdg ${a.category}">${BADGE[a.category]}</span>${ico("chev").replace('class="i"', 'class="i go"')}</div>
      </article>`).join("")
      : `<div class="empty"><b>No announcements found</b>Try a different category or search term.</div>`;
  }

  const render = () => { renderControls(); renderList(); };

  /* Modal */
  function openModal(id) {
    const a = getAll().find((x) => String(x.id) === String(id));
    if (!a) return;
    lastFocus = document.activeElement;
    $("#m-title").textContent = a.title;
    $("#m-text").textContent = a.text;
    $("#m-meta").innerHTML = `<span class="bdg ${a.category}">${BADGE[a.category]}</span><span>${ico("user")}Posted by: ${esc(a.by)}</span><span>${ico("cal")}${fmtDate(a.when)}</span><span>${ico("clock")}${fmtTime(a.when)}</span>`;
    const m = $("#modal");
    m.classList.add("show");
    m.setAttribute("aria-hidden", "false");
    $("#m-close").focus();
  }
  function closeModal() {
    const m = $("#modal");
    if (!m.classList.contains("show")) return;
    m.classList.remove("show");
    m.setAttribute("aria-hidden", "true");
    if (lastFocus) lastFocus.focus();
  }

  /* Events */
  $("#tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { state.cat = b.dataset.k; render(); } });
  $("#list").addEventListener("click", (e) => { const c = e.target.closest(".ai"); if (c) openModal(c.dataset.id); });
  $("#list").addEventListener("keydown", (e) => {
    const c = e.target.closest(".ai");
    if (c && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openModal(c.dataset.id); }
  });
  $("#m-x").addEventListener("click", closeModal);
  $("#m-close").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

  /* Sidebar toggle / drawer: handled once by shell.js */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  /* Live update when the teacher posts or deletes in another tab */
  window.addEventListener("storage", (e) => { if (e.key === KEY) render(); });

  /* Refresh when returning to this tab */
  document.addEventListener("visibilitychange", () => { if (!document.hidden) render(); });

  render();
})();