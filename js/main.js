/* ===========================================================
   yesh@infra — main.js
   1. three.js server-fleet node network (hero background)
   2. typewriter hero headline
   3. animated stat counters
   4. scroll-reveal via IntersectionObserver
   5. mobile nav toggle
   =========================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- mobile nav ---------- */
  var navToggle = document.getElementById("navToggle");
  var navLinksEl = document.querySelector(".nav-links");
  if (navToggle && navLinksEl) {
    navToggle.addEventListener("click", function () {
      var open = navLinksEl.classList.toggle("nav-links-open");
      navLinksEl.style.cssText = open
        ? "display:flex;flex-direction:column;position:absolute;top:56px;right:20px;background:#0e1413;border:1px solid #1c2624;border-radius:6px;padding:16px 20px;gap:16px;"
        : "";
    });
    navLinksEl.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        navLinksEl.style.cssText = "";
        navLinksEl.classList.remove("nav-links-open");
      });
    });
  }

  /* ---------- profile picture modal ---------- */
  var profileTrigger = document.getElementById("profilePicTrigger");
  var profileModal = document.getElementById("profileModal");
  var profileModalClose = document.getElementById("profileModalClose");
  if (profileTrigger && profileModal && profileModalClose) {
    var lastFocused = null;

    function openProfileModal() {
      lastFocused = document.activeElement;
      profileModal.hidden = false;
      requestAnimationFrame(function () {
        profileModal.classList.add("is-open");
      });
      document.body.style.overflow = "hidden";
      profileModalClose.focus();
      document.addEventListener("keydown", onProfileKeydown);
    }

    function closeProfileModal() {
      profileModal.classList.remove("is-open");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onProfileKeydown);
      var onEnd = function () {
        profileModal.hidden = true;
        profileModal.removeEventListener("transitionend", onEnd);
      };
      if (reduceMotion) {
        profileModal.hidden = true;
      } else {
        profileModal.addEventListener("transitionend", onEnd);
      }
      if (lastFocused) lastFocused.focus();
    }

    function onProfileKeydown(e) {
      if (e.key === "Escape") closeProfileModal();
    }

    profileTrigger.addEventListener("click", openProfileModal);
    profileModalClose.addEventListener("click", closeProfileModal);
    profileModal.addEventListener("click", function (e) {
      if (e.target === profileModal) closeProfileModal();
    });
  }

  /* ---------- typewriter ---------- */
  var twEl = document.getElementById("typewriter");
  if (twEl) {
    var lines = ["Yeshwanth Mootakoduru"];
    var full = lines[0];
    if (reduceMotion) {
      twEl.textContent = full;
    } else {
      var i = 0;
      (function type() {
        if (i <= full.length) {
          twEl.textContent = full.slice(0, i);
          i++;
          setTimeout(type, 55);
        }
      })();
    }
  }

  /* ---------- animated counters ---------- */
  function animateCounters() {
    var stats = document.querySelectorAll(".stat-num");
    stats.forEach(function (el) {
      if (el.dataset.done) return;
      var target = parseFloat(el.getAttribute("data-target"));
      var suffix = el.getAttribute("data-suffix") || "";
      var decimals = parseInt(el.getAttribute("data-decimal") || "0", 10);
      el.dataset.done = "1";
      if (reduceMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      var start = null;
      var duration = 1400;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var val = target * eased;
        el.textContent = val.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals) + suffix;
      }
      requestAnimationFrame(step);
    });
  }

  var heroStats = document.querySelector(".hero-stats");
  if (heroStats) {
    setTimeout(animateCounters, 650); /* start after terminal intro settles */
  }

  /* ---------- scroll reveal ---------- */
  var revealTargets = document.querySelectorAll(
    ".section-eyebrow, .about-grid, .log-entry, .config-block, .project-card, .edu-item, .contact-title"
  );
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach(function (t) { io.observe(t); });
  } else {
    revealTargets.forEach(function (t) { t.classList.add("in-view"); });
  }

  /* ===========================================================
     three.js — server fleet node network
     A slowly drifting field of glowing nodes with connecting
     lines when two nodes are near each other. Represents the
     server topology / fleet the copy talks about.
     =========================================================== */
  var canvas = document.getElementById("bg-canvas");
  if (!canvas || typeof THREE === "undefined") return;

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 60;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  var NODE_COUNT = window.innerWidth < 700 ? 55 : 110;
  var SPREAD = { x: 90, y: 55, z: 40 };
  var LINK_DIST = 15;

  var nodes = [];
  var positions = new Float32Array(NODE_COUNT * 3);

  for (var n = 0; n < NODE_COUNT; n++) {
    var x = (Math.random() - 0.5) * SPREAD.x * 2;
    var y = (Math.random() - 0.5) * SPREAD.y * 2;
    var z = (Math.random() - 0.5) * SPREAD.z * 2;
    nodes.push({
      pos: new THREE.Vector3(x, y, z),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      )
    });
    positions[n * 3] = x;
    positions[n * 3 + 1] = y;
    positions[n * 3 + 2] = z;
  }

  var pointGeo = new THREE.BufferGeometry();
  pointGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  var pointMat = new THREE.PointsMaterial({
    color: 0x3ddc84,
    size: 1.6,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true
  });
  var pointCloud = new THREE.Points(pointGeo, pointMat);
  scene.add(pointCloud);

  /* line segments, rebuilt each frame based on proximity */
  var maxLines = NODE_COUNT * 6;
  var lineGeo = new THREE.BufferGeometry();
  var linePositions = new Float32Array(maxLines * 2 * 3);
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  var lineMat = new THREE.LineBasicMaterial({
    color: 0x3ddc84,
    transparent: true,
    opacity: 0.12
  });
  var lineMesh = new THREE.LineSegments(lineGeo, lineMat);
  scene.add(lineMesh);

  var clock = new THREE.Clock();
  var mouseX = 0, mouseY = 0;

  window.addEventListener("mousemove", function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function updateNodes() {
    for (var n = 0; n < NODE_COUNT; n++) {
      var node = nodes[n];
      node.pos.add(node.vel);

      if (node.pos.x > SPREAD.x || node.pos.x < -SPREAD.x) node.vel.x *= -1;
      if (node.pos.y > SPREAD.y || node.pos.y < -SPREAD.y) node.vel.y *= -1;
      if (node.pos.z > SPREAD.z || node.pos.z < -SPREAD.z) node.vel.z *= -1;

      positions[n * 3] = node.pos.x;
      positions[n * 3 + 1] = node.pos.y;
      positions[n * 3 + 2] = node.pos.z;
    }
    pointGeo.attributes.position.needsUpdate = true;

    var lineIdx = 0;
    for (var a = 0; a < NODE_COUNT && lineIdx < maxLines; a++) {
      for (var b = a + 1; b < NODE_COUNT && lineIdx < maxLines; b++) {
        var dx = nodes[a].pos.x - nodes[b].pos.x;
        var dy = nodes[a].pos.y - nodes[b].pos.y;
        var dz = nodes[a].pos.z - nodes[b].pos.z;
        var distSq = dx * dx + dy * dy + dz * dz;
        if (distSq < LINK_DIST * LINK_DIST) {
          var base = lineIdx * 6;
          linePositions[base] = nodes[a].pos.x;
          linePositions[base + 1] = nodes[a].pos.y;
          linePositions[base + 2] = nodes[a].pos.z;
          linePositions[base + 3] = nodes[b].pos.x;
          linePositions[base + 4] = nodes[b].pos.y;
          linePositions[base + 5] = nodes[b].pos.z;
          lineIdx++;
        }
      }
    }
    lineGeo.setDrawRange(0, lineIdx * 2);
    lineGeo.attributes.position.needsUpdate = true;
  }

  var isVisible = true;
  document.addEventListener("visibilitychange", function () {
    isVisible = !document.hidden;
  });

  function animate() {
    requestAnimationFrame(animate);
    if (!isVisible) return;

    if (!reduceMotion) {
      updateNodes();
      camera.position.x += (mouseX * 8 - camera.position.x) * 0.02;
      camera.position.y += (-mouseY * 5 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);
      pointCloud.rotation.y += 0.0006;
      lineMesh.rotation.y += 0.0006;
    }
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
