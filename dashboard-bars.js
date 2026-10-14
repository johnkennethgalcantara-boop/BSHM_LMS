/* dashboard-bars.js
   Tags each course progress bar with data-level so CSS can color it:
   70%+ lavender, 40-69% peach, under 40% red. Load after student.js. */
(function () {
  function tag() {
    document.querySelectorAll('#courses .bar').forEach(function (bar) {
      var fill = bar.querySelector('i');
      if (!fill) return;
      var p = parseFloat(fill.style.width);
      if (isNaN(p)) return;
      bar.dataset.level = p >= 70 ? 'high' : p >= 40 ? 'mid' : 'low';
    });
  }
  tag();
  var box = document.getElementById('courses');
  if (box) new MutationObserver(tag).observe(box, { childList: true, subtree: true });
})();

/* dashboard-bars.js
   Tags each course progress bar with data-level so CSS can color it:
   70%+ lavender, 40-69% peach, under 40% red.
   Works on student.html (#courses) and courses.html (.cg). Load after the page script. */
(function () {
  var BOXES = '#courses, .cg';
  function pct(bar) {
    var fill = bar.querySelector('i, span') || bar.firstElementChild;
    if (!fill) return NaN;
    var p = parseFloat(fill.style.width);
    if (!isNaN(p)) return p;
    var w = bar.getBoundingClientRect().width;
    return w ? (fill.getBoundingClientRect().width / w) * 100 : NaN;
  }
  function tag() {
    document.querySelectorAll('#courses .bar, .cg .cc .bar').forEach(function (bar) {
      var p = pct(bar);
      if (isNaN(p)) return;
      bar.dataset.level = p >= 70 ? 'high' : p >= 40 ? 'mid' : 'low';
    });
  }
  tag();
  document.querySelectorAll(BOXES).forEach(function (box) {
    new MutationObserver(tag).observe(box, { childList: true, subtree: true });
  });
})();