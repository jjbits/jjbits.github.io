/* Mounts computescope's GPU die badge (gpu-die-badge.js) on the home page and
   keeps it in the site's theme. Loaded deferred after three.min.js and
   gpu-die-badge.js, in that order. Until it runs, and whenever WebGL is
   unavailable, the <img> of the badge's first pose stays visible. */
(function () {
  'use strict';
  var stage = document.querySelector('.gpu-badge-stage');
  if (!stage || !window.gpuDieBadge || !window.THREE) return;
  var root = document.documentElement;
  var theme = function () { return root.classList.contains('dark') ? 'dark' : 'light'; };
  var badge;
  try {
    badge = window.gpuDieBadge.mount(stage, { theme: theme() });
  } catch (e) {
    // No WebGL context: drop the dead canvas the mount may have added, keep the image.
    stage.querySelectorAll('canvas').forEach(function (c) { c.remove(); });
    return;
  }
  stage.classList.add('is-live');
  // Blowfish's appearance switcher toggles the class; follow it.
  new MutationObserver(function () { badge.setTheme(theme()); })
    .observe(root, { attributes: true, attributeFilter: ['class'] });
})();
