/**
 * Tech Icon Network Animation
 * Fully connected mesh network with Font Awesome icons
 * Isolated animation that won't interfere with starfield
 */

(function () {
  "use strict";

  const techCanvas = document.getElementById("tech-network-canvas");
  if (!techCanvas) {
    console.error("Tech network canvas not found!");
    return;
  }

  const ctx = techCanvas.getContext("2d");
  let width, height;
  let iconNodes = [];
  let animationId = null;

  // Solid-only icon set (Font Awesome Free Solid) for reliable canvas rendering
  // Each entry: { code: '\ufxxx', family: 'Font Awesome 6 Free', weight: '900' }
  const solidIcons = [
    "\uf233", // server
    "\uf1c0", // database
    "\uf0c2", // cloud
    "\uf121", // code
    "\uf544", // robot
    "\uf085", // gear
    "\uf109", // laptop
    "\uf120", // terminal
    "\uf023", // lock
    "\uf1eb", // wifi
    "\uf6ff", // network-wired
    "\uf2db", // microchip
    "\uf108", // desktop
    "\uf11c", // keyboard
    "\uf0ad", // wrench
    "\uf013", // cog
    "\uf188", // bug
    "\uf5dc", // brain
    "\uf5d2", // atom
    "\uf0e8", // sitemap
    "\uf03e", // camera
    "\uf135", // rocket
    "\uf0eb", // lightbulb
    "\uf2f6", // signal
    "\uf242", // battery
    "\uf0c1", // link
    "\uf0ce", // table
    "\uf1c6", // file-code
    "\uf1c7", // file-archive
    "\uf1c3", // file-lines
    "\uf0a3", // certificate
    "\uf132", // shield
    "\uf240", // plug
    "\uf26c", // tv
    "\uf3fd", // memory
    "\uf538", // mobile-screen
    "\uf201", // chart-line
    "\uf080", // chart-bar
    "\uf1fe", // chart-pie
    "\uf0e0", // envelope
    "\uf095", // phone
    "\uf02d", // book
    "\uf073", // calendar
    "\uf0c0", // users
    "\uf007", // user
    "\uf466", // boxes
    "\uf126", // code-branch
    "\uf0c7", // save
    "\uf15b", // file
    "\uf09d", // credit-card
    "\uf029", // qrcode
  ].map((code) => ({ code, family: "Font Awesome 6 Free", weight: "200" }));

  // Brands icon set (Font Awesome Brands) - weight 400
  const brandIcons = [
    "\uf41b", // react
    "\uf3b9", // js
    "\uf13b", // html5
    "\uf13c", // css3
    "\uf419", // node
    "\uf3e2", // python
    "\uf09b", // github
    "\uf0e1", // linkedin
    "\uf16c", // stack-overflow
    "\uf099", // twitter
    "\uf09a", // facebook
    "\uf3d4", // npm
    "\uf395", // docker
    "\uf1d3", // git
    "\uf41f", // vuejs
    "\uf420", // angular
    "\uf375", // aws
    "\uf4e4", // java
    "\uf17c", // linux
    "\uf17b", // android
    "\uf179", // apple
    "\uf3ab", // chrome
    "\uf269", // firefox
    "\uf26b", // edge
    "\uf3b1", // safari
    "\uf392", // ubuntu
    "\uf3af", // fedora
    "\uf3c5", // windows
    "\uf42d", // php
    "\uf1a9", // spotify
    "\uf167", // youtube
    "\uf16d", // instagram
    "\uf3d0", // slack
    "\uf1d1", // gitlab
    "\uf3d2", // trello
    "\uf1e7", // dropbox
    "\uf3e0", // google
    "\uf412", // digital-ocean
    "\uf3d7", // wordpress
    "\uf16a", // reddit
    "\uf415", // bootstrap
    "\uf41e", // sass
    "\uf799", // figma
    "\uf3fa", // sketch
    "\uf1f0", // stripe
    "\uf1ed", // paypal
    "\uf3ca", // microsoft
    "\uf7bc", // redhat
    "\uf3b6", // jenkins
    "\uf198", // slack
    "\uf2c6", // telegram
    "\uf3b7", // php-alt
    "\uf3dd", // rust
    "\uf3e0", // swift
    "\uf3b3", // ruby
    "\uf3af", // dev
    "\uf0d5", // stack-overflow-alt
    "\uf1b4", // behance
    "\uf1b5", // dribbble
    "\uf3d3", // medium
    "\uf121", // codepen
    "\uf171", // bitbucket
    "\uf433", // flutter
    "\uf3b9", // unity
    "\uf084", // discord
  ].map((code) => ({ code, family: "Font Awesome 6 Brands", weight: "200" }));

  const CONFIG = {
    LATITUDE_RINGS: 9, // Number of latitude circles
    LONGITUDE_LINES: 13, // Number of longitude meridians
    ICON_SIZE: 20,
    MOVE_SPEED: 0.008, // Auto-rotation speed
    LINE_WIDTH: 1.0,
    LINE_OPACITY: 0.5,
    BASE_RADIUS: 180, // Base globe radius
  };

  // Selected Font Awesome families/weights (detected at runtime)
  let faSolidFamily = "Font Awesome 6 Free";
  let faSolidWeight = "200";
  let faBrandFamily = "Font Awesome 6 Brands";
  let faBrandWeight = "200";

  // Interaction state
  let isDragging = false;
  let lastMouseX = 0;
  let lastMouseY = 0;
  let dragVelocityX = 0;
  let dragVelocityY = 0;
  let zoomLevel = 1.0;
  let autoRotate = true;

  function initNetwork() {
    // Match CSS size and scale by device pixel ratio for crisp rendering
    const rect = techCanvas.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    techCanvas.width = Math.round(rect.width * dpr);
    techCanvas.height = Math.round(rect.height * dpr);
    // Draw in CSS pixel space
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    width = rect.width;
    height = rect.height;

    console.log("Tech Network initialized:", width, "x", height);

    // Create nodes at latitude-longitude grid intersections
    iconNodes = [];
    const iconPool = solidIcons.concat(brandIcons);
    let iconIndex = 0;

    // Create latitude rings (horizontal circles)
    for (let latRing = 0; latRing <= CONFIG.LATITUDE_RINGS; latRing++) {
      // phi goes from 0 (north pole) to PI (south pole)
      const phi = (latRing / CONFIG.LATITUDE_RINGS) * Math.PI;

      // Number of points on this latitude ring (more at equator, fewer at poles)
      const pointsOnRing =
        latRing === 0 || latRing === CONFIG.LATITUDE_RINGS
          ? 1 // Poles have single point
          : CONFIG.LONGITUDE_LINES;

      for (let lonPoint = 0; lonPoint < pointsOnRing; lonPoint++) {
        const theta = (lonPoint / pointsOnRing) * Math.PI * 2; // longitude
        const icon = iconPool[iconIndex % iconPool.length];

        const node = {
          theta,
          phi,
          latRing, // Store which latitude ring
          lonPoint, // Store which longitude point
          x: 0,
          y: 0,
          z: 0,
          icon,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.01 + Math.random() * 0.015,
        };
        iconNodes.push(node);
        iconIndex++;
      }
    }

    console.log(`Created ${iconNodes.length} nodes on lat-long grid`);
  }

  let rotationX = 0;
  let rotationY = 0;

  function updatePositions() {
    const cx = width / 2;
    const cy = height / 2;

    // Auto-rotation when not dragging
    if (autoRotate && !isDragging) {
      rotationY += CONFIG.MOVE_SPEED;
      rotationX += CONFIG.MOVE_SPEED * 0.3;
    }

    // Apply drag velocity with damping
    if (!isDragging) {
      rotationY += dragVelocityX * 0.02;
      rotationX += dragVelocityY * 0.02;
      dragVelocityX *= 0.95; // Damping
      dragVelocityY *= 0.95;
    }

    const radius = CONFIG.BASE_RADIUS * zoomLevel;

    iconNodes.forEach((node) => {
      // Convert spherical to Cartesian
      let x = radius * Math.sin(node.phi) * Math.cos(node.theta);
      let y = radius * Math.sin(node.phi) * Math.sin(node.theta);
      let z = radius * Math.cos(node.phi);

      // Apply rotation around Y axis (horizontal spin)
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      // Apply rotation around X axis (vertical tilt)
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // Project to 2D (orthographic projection)
      node.x = cx + x1;
      node.y = cy + y2;
      node.z = z2; // depth for sorting/visibility

      // Update pulse for animation
      node.pulse += node.pulseSpeed;
    });

    // Sort by depth (back to front) for proper rendering
    iconNodes.sort((a, b) => a.z - b.z);
  }

  function drawGlobeMesh() {
    ctx.lineWidth = CONFIG.LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.shadowBlur = 2;
    ctx.shadowColor = "rgba(114, 161, 222, 0.25)";

    // Draw latitude circles (horizontal rings)
    for (let latRing = 0; latRing <= CONFIG.LATITUDE_RINGS; latRing++) {
      // Skip poles (single points)
      if (latRing === 0 || latRing === CONFIG.LATITUDE_RINGS) continue;

      const nodesOnRing = iconNodes.filter((n) => n.latRing === latRing);
      if (nodesOnRing.length < 2) continue;

      // Sort by theta to connect in order
      nodesOnRing.sort((a, b) => a.theta - b.theta);

      // Calculate average depth for this ring
      const avgZ =
        nodesOnRing.reduce((sum, n) => sum + n.z, 0) / nodesOnRing.length;
      const depthFactor =
        (avgZ + CONFIG.BASE_RADIUS * zoomLevel) /
        (CONFIG.BASE_RADIUS * zoomLevel * 2);
      const opacity =
        CONFIG.LINE_OPACITY * Math.max(0.15, Math.min(0.7, depthFactor));

      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(nodesOnRing[0].x, nodesOnRing[0].y);

      for (let i = 1; i < nodesOnRing.length; i++) {
        ctx.lineTo(nodesOnRing[i].x, nodesOnRing[i].y);
      }
      // Close the ring
      ctx.lineTo(nodesOnRing[0].x, nodesOnRing[0].y);
      ctx.stroke();
    }

    // Draw longitude meridians (vertical lines from pole to pole)
    for (let lonLine = 0; lonLine < CONFIG.LONGITUDE_LINES; lonLine++) {
      const nodesOnMeridian = [];

      // Collect nodes on this longitude line
      for (let latRing = 0; latRing <= CONFIG.LATITUDE_RINGS; latRing++) {
        if (latRing === 0 || latRing === CONFIG.LATITUDE_RINGS) {
          // Poles
          const poleNode = iconNodes.find((n) => n.latRing === latRing);
          if (poleNode && !nodesOnMeridian.includes(poleNode)) {
            nodesOnMeridian.push(poleNode);
          }
        } else {
          // Regular latitude rings
          const node = iconNodes.find(
            (n) => n.latRing === latRing && n.lonPoint === lonLine
          );
          if (node) nodesOnMeridian.push(node);
        }
      }

      if (nodesOnMeridian.length < 2) continue;

      // Sort by phi (latitude) to connect from pole to pole
      nodesOnMeridian.sort((a, b) => a.phi - b.phi);

      // Calculate average depth for this meridian
      const avgZ =
        nodesOnMeridian.reduce((sum, n) => sum + n.z, 0) /
        nodesOnMeridian.length;
      const depthFactor =
        (avgZ + CONFIG.BASE_RADIUS * zoomLevel) /
        (CONFIG.BASE_RADIUS * zoomLevel * 2);
      const opacity =
        CONFIG.LINE_OPACITY * Math.max(0.15, Math.min(0.7, depthFactor));

      ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.beginPath();
      ctx.moveTo(nodesOnMeridian[0].x, nodesOnMeridian[0].y);

      for (let i = 1; i < nodesOnMeridian.length; i++) {
        ctx.lineTo(nodesOnMeridian[i].x, nodesOnMeridian[i].y);
      }
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }

  function drawIcons() {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    iconNodes.forEach((node) => {
      // Fade icons based on depth (back icons dimmer)
      const depthFactor =
        (node.z + CONFIG.BASE_RADIUS * zoomLevel) /
        (CONFIG.BASE_RADIUS * zoomLevel * 2);
      const opacity = Math.max(0.3, Math.min(1, depthFactor));

      // Subtle pulse effect
      const scale = 1 + Math.sin(node.pulse) * 0.06;
      const currentSize = CONFIG.ICON_SIZE * scale * zoomLevel;

      ctx.save();
      ctx.translate(node.x, node.y);

      // Minimal glow for crisp white icons
      ctx.shadowBlur = 2;
      ctx.shadowColor = `rgba(255, 255, 255, ${opacity * 0.3})`;

      // Draw icon with proper family (solid vs brands)
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.92})`;
      const isBrand = (node.icon.family || "").toLowerCase().includes("brands");
      const fam = isBrand ? faBrandFamily : faSolidFamily;
      const wt = isBrand ? faBrandWeight : faSolidWeight;
      ctx.font = `${wt} ${currentSize}px \"${fam}\"`;
      ctx.fillText(node.icon.code, 0, 0);

      ctx.restore();
    });
  }

  function animate() {
    // Clear canvas completely for crisp rendering
    ctx.clearRect(0, 0, width, height);

    // Update and draw
    updatePositions();
    drawGlobeMesh();
    drawIcons();

    // Continue animation loop
    animationId = requestAnimationFrame(animate);
  }

  // Mouse interaction handlers
  function handleMouseDown(e) {
    isDragging = true;
    autoRotate = false;
    const rect = techCanvas.getBoundingClientRect();
    lastMouseX = e.clientX - rect.left;
    lastMouseY = e.clientY - rect.top;
    dragVelocityX = 0;
    dragVelocityY = 0;
    techCanvas.style.cursor = "grabbing";
  }

  function handleMouseMove(e) {
    if (!isDragging) return;

    const rect = techCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const deltaX = mouseX - lastMouseX;
    const deltaY = mouseY - lastMouseY;

    dragVelocityX = -deltaX;
    dragVelocityY = -deltaY;

    rotationY -= deltaX * 0.01;
    rotationX -= deltaY * 0.01;

    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }

  function handleMouseUp() {
    isDragging = false;
    techCanvas.style.cursor = "grab";
    // Resume auto-rotation after a delay if velocity is low
    setTimeout(() => {
      if (Math.abs(dragVelocityX) < 0.5 && Math.abs(dragVelocityY) < 0.5) {
        autoRotate = true;
      }
    }, 2000);
  }

  function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    zoomLevel = Math.max(0.5, Math.min(2.5, zoomLevel * delta));
  }

  // Add event listeners for interaction
  techCanvas.addEventListener("mousedown", handleMouseDown);
  techCanvas.addEventListener("mousemove", handleMouseMove);
  techCanvas.addEventListener("mouseup", handleMouseUp);
  techCanvas.addEventListener("mouseleave", handleMouseUp);
  techCanvas.addEventListener("wheel", handleWheel, { passive: false });
  techCanvas.style.cursor = "grab";

  // Handle window resize
  let resizeTimeout;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      initNetwork();
      animate();
    }, 250);
  });

  // Ensure Font Awesome fonts are loaded before drawing
  async function loadFonts() {
    async function detect(families, weights) {
      for (const fam of families) {
        for (const wt of weights) {
          try {
            await document.fonts.load(`${wt} 24px "${fam}"`);
            await document.fonts.ready;
            return { fam, wt };
          } catch (e) {
            // try next
          }
        }
      }
      return null;
    }

    const solidRes = await detect(
      [
        "Font Awesome 7 Free",
        "Font Awesome 6 Free",
        "Font Awesome 6 Free Solid",
        "Font Awesome 5 Free",
      ],
      ["900", "700"]
    );
    if (solidRes) {
      faSolidFamily = solidRes.fam;
      faSolidWeight = solidRes.wt;
    }

    const brandRes = await detect(
      [
        "Font Awesome 7 Brands",
        "Font Awesome 6 Brands",
        "Font Awesome 5 Brands",
      ],
      ["400"]
    );
    if (brandRes) {
      faBrandFamily = brandRes.fam;
      faBrandWeight = brandRes.wt;
    }
  }

  // Initialize after fonts are ready
  loadFonts()
    .then(() => {
      initNetwork();
      animate();
    })
    .catch(() => {
      // Fallback: still try to run if fonts API not supported
      initNetwork();
      animate();
    });
})();
