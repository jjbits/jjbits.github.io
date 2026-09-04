/*
 * Animated wireframe tetrahedron for the site header.
 *
 * Spins a regular tetrahedron about its own centre, re-picking a new spin
 * every few seconds. Both the axis and the speed are drawn from true uniform
 * distributions -- see randomAxis() for why the obvious approach is wrong.
 *
 * Faithful to the brand logo: orange edges, dark vertex dots, and the edge
 * that is hidden behind the solid drawn dashed. Which edge that is gets
 * recomputed every frame from the current orientation.
 *
 * No dependencies. Orthographic projection, ~60 lines of actual maths.
 */
(function () {
  "use strict";

  var svg = document.getElementById("tetra-logo");
  if (!svg) return;

  var lines = [].slice.call(svg.querySelectorAll("line[data-e]"));
  var dots = [].slice.call(svg.querySelectorAll("circle[data-v]"));
  if (lines.length !== 6 || dots.length !== 4) return;

  // Respect the reader's motion preference: leave the static brand pose alone.
  var motionQuery =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery && motionQuery.matches) return;

  /* ---- geometry -------------------------------------------------------- */

  // Regular tetrahedron, centred on its centroid, circumradius 1. Because the
  // four vertices sum to zero, the face opposite vertex k has its outward
  // normal along -v[k] -- which makes the hidden-edge test below exact.
  var K = 1 / Math.sqrt(3);
  var BASE = [
    [K, K, K],
    [K, -K, -K],
    [-K, K, -K],
    [-K, -K, K],
  ];

  var VIEW = 100; // SVG viewBox is 100x100
  var RADIUS = 42; // leaves room for stroke width and vertex dots

  var edgeVerts = lines.map(function (el) {
    var p = el.getAttribute("data-e").split("-");
    return [+p[0], +p[1]];
  });
  var dotVerts = dots.map(function (el) {
    return +el.getAttribute("data-v");
  });
  // For edge (i,j), the two vertices it does NOT touch.
  var edgeOthers = edgeVerts.map(function (e) {
    return [0, 1, 2, 3].filter(function (v) {
      return v !== e[0] && v !== e[1];
    });
  });

  /* ---- random spin ----------------------------------------------------- */

  // Uniform on the unit sphere. Normalising three uniform samples is NOT
  // uniform -- it clusters toward the cube's corners. Sampling z uniformly and
  // the azimuth independently is, by Archimedes' hat-box theorem: equal bands
  // of z carry equal area.
  function randomAxis() {
    var z = Math.random() * 2 - 1;
    var theta = Math.random() * 2 * Math.PI;
    var r = Math.sqrt(1 - z * z);
    return [r * Math.cos(theta), r * Math.sin(theta), z];
  }

  var SPEED_MIN = 1.1; // rad/s -- a revolution every ~5.7s
  var SPEED_MAX = 2.6; // rad/s -- a revolution every ~2.4s
  var HOLD_MIN = 2.5; // s before picking a new spin
  var HOLD_MAX = 5.0;
  var BLEND = 1.1; // s to ease from the old spin into the new one

  function randomOmega() {
    var a = randomAxis();
    var s = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
    return [a[0] * s, a[1] * s, a[2] * s];
  }
  function randomHold() {
    return HOLD_MIN + Math.random() * (HOLD_MAX - HOLD_MIN);
  }

  var omegaFrom = randomOmega();
  var omegaTo = randomOmega();
  var blendT = 0;
  var holdT = randomHold();

  /* ---- orientation state ----------------------------------------------- */

  // Quaternion [w,x,y,z]. Integrating orientation as a quaternion avoids the
  // gimbal lock and drift that Euler angles would accumulate over long runs.
  var q = [1, 0, 0, 0];

  function qmul(a, b) {
    return [
      a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
      a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
      a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
      a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
    ];
  }

  function integrate(omega, dt) {
    var mag = Math.sqrt(
      omega[0] * omega[0] + omega[1] * omega[1] + omega[2] * omega[2]
    );
    if (mag < 1e-9) return;
    var half = (mag * dt) / 2;
    var s = Math.sin(half) / mag;
    q = qmul([Math.cos(half), omega[0] * s, omega[1] * s, omega[2] * s], q);
    var n = Math.sqrt(q[0] * q[0] + q[1] * q[1] + q[2] * q[2] + q[3] * q[3]);
    q = [q[0] / n, q[1] / n, q[2] / n, q[3] / n];
  }

  function rotated() {
    var w = q[0],
      x = q[1],
      y = q[2],
      z = q[3];
    var m = [
      [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
      [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
      [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
    ];
    return BASE.map(function (v) {
      return [
        m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
        m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
        m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2],
      ];
    });
  }

  /* ---- drawing --------------------------------------------------------- */

  var edgeGroup = svg.querySelector(".tetra-edges");
  var lastOrder = "";

  function draw(verts) {
    var half = VIEW / 2;
    var px = verts.map(function (v) {
      // Orthographic. SVG's y axis points down, so negate.
      return [half + v[0] * RADIUS, half - v[1] * RADIUS];
    });

    for (var i = 0; i < lines.length; i++) {
      var e = edgeVerts[i];
      var a = px[e[0]],
        b = px[e[1]];
      var el = lines[i];
      el.setAttribute("x1", a[0].toFixed(2));
      el.setAttribute("y1", a[1].toFixed(2));
      el.setAttribute("x2", b[0].toFixed(2));
      el.setAttribute("y2", b[1].toFixed(2));

      // An edge is hidden exactly when both faces meeting along it face away.
      // Face k faces away when v[k].z >= 0, so the edge is hidden when both
      // vertices it does not touch are in front of it.
      var o = edgeOthers[i];
      var hidden = verts[o[0]][2] >= 0 && verts[o[1]][2] >= 0;
      if (hidden) el.setAttribute("stroke-dasharray", "1.2 4.9");
      else el.removeAttribute("stroke-dasharray");
    }

    for (var d = 0; d < dots.length; d++) {
      var p = px[dotVerts[d]];
      dots[d].setAttribute("cx", p[0].toFixed(2));
      dots[d].setAttribute("cy", p[1].toFixed(2));
    }

    // Painter's order: draw far edges first so near ones sit on top. Only
    // touch the DOM when the ordering actually changes.
    var order = lines
      .map(function (el, i) {
        var e = edgeVerts[i];
        return { el: el, i: i, z: (verts[e[0]][2] + verts[e[1]][2]) / 2 };
      })
      .sort(function (a, b) {
        return a.z - b.z;
      });
    var key = order
      .map(function (o) {
        return o.i;
      })
      .join(",");
    if (key !== lastOrder) {
      order.forEach(function (o) {
        edgeGroup.appendChild(o.el);
      });
      lastOrder = key;
    }
  }

  /* ---- loop ------------------------------------------------------------ */

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  var last = 0;
  function frame(now) {
    if (!last) last = now;
    // Clamp so a backgrounded tab does not resume with one huge jump.
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (blendT < BLEND) {
      blendT = Math.min(blendT + dt, BLEND);
    } else {
      holdT -= dt;
      if (holdT <= 0) {
        omegaFrom = omegaTo;
        omegaTo = randomOmega();
        blendT = 0;
        holdT = randomHold();
      }
    }

    var t = smoothstep(BLEND > 0 ? blendT / BLEND : 1);
    var omega = [
      omegaFrom[0] + (omegaTo[0] - omegaFrom[0]) * t,
      omegaFrom[1] + (omegaTo[1] - omegaFrom[1]) * t,
      omegaFrom[2] + (omegaTo[2] - omegaFrom[2]) * t,
    ];

    integrate(omega, dt);
    draw(rotated());
    requestAnimationFrame(frame);
  }

  // Start from a uniformly random orientation rather than a fixed one, so the
  // logo does not begin from the same pose on every page load.
  (function seedOrientation() {
    var a = randomAxis();
    var ang = Math.random() * 2 * Math.PI;
    var s = Math.sin(ang / 2);
    q = [Math.cos(ang / 2), a[0] * s, a[1] * s, a[2] * s];
  })();

  requestAnimationFrame(frame);
})();
