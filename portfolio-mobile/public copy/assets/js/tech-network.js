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
  ].map((code) => ({ code, family: "Font Awesome 6 Free", weight: "900" }));

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
    "\uf17a", // windows
    "\uf42d", // php
    "\uf1a9", // droplet
    "\uf1bc", // spotify
    "\uf167", // youtube
    "\uf16d", // instagram
    "\uf3d0", // slack
    "\uf1d1", // gitlab
    "\uf3d2", // trello
    "\uf1e7", // dropbox
    "\uf1a0", // google
    "\uf412", // digital-ocean
    "\uf3d7", // wordpress
    "\uf16a", // reddit
    "\uf415", // bootstrap
    "\uf41e", // sass
    "\uf799", // figma
    "\uf7c6", // sketch
    "\uf1f0", // stripe
    "\uf1ed", // paypal
    "\uf3ca", // microsoft
    "\uf7bc", // redhat
    "\uf3b6", // jenkins
    "\uf2c6", // telegram
    "\uf3b7", // php-alt
    "\uf3af", // dev
    "\uf0d5", // stack-overflow-alt
    "\uf1b4", // behance
    "\uf1b5", // dribbble
    "\uf3d3", // medium
    "\uf1cb", // codepen
    "\uf171", // bitbucket
    "\uf841", // flutter
    "\uf3b9", // unity
    "\uf392", // discord
    "\uf268", // discord
  ].map((code) => ({ code, family: "Font Awesome 6 Brands", weight: "400" }));

  const CONFIG = {
    NUM_ICONS: 150, // Number of moving icons on the globe
    ICON_SIZE: 20,
    MOVE_SPEED: 0.008, // Auto-rotation speed
    ICON_MOVE_SPEED: 0.000, // Speed of icons moving on surface
    LINE_WIDTH: 1.0,
    LINE_OPACITY: 2,
    BASE_RADIUS: 180, // Base globe radius (will be recalculated on init)
    EARTH_RADIUS_RATIO: 0.85, // Earth size relative to satellite orbit (55% of BASE_RADIUS)
    CONNECTION_DISTANCE: 50, // Base max distance for lines (will be scaled with zoom)
    MAX_CONNECTIONS: 3, // Max connections per icon
    MIN_ICON_DISTANCE: 2, // Minimum angular distance between icons (in radians) - smaller for more icons
  };
  // Multiplier to tweak the default 'natural' size of the globe.
  // Increase slightly to make globe look larger by default.
  const NATURAL_SIZE_MULTIPLIER = 1;
  // Keep a local default icon size so we can recompute on resize.
  const DEFAULT_ICON_SIZE = CONFIG.ICON_SIZE;

  // Selected Font Awesome families/weights (detected at runtime)
  let faSolidFamily = "Font Awesome 6 Free";
  let faSolidWeight = "900";
  let faBrandFamily = "Font Awesome 6 Brands";
  let faBrandWeight = "400";

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

    // Recalculate sensible BASE_RADIUS and ICON_SIZE based on current canvas size
    // so the globe naturally fills the canvas better while keeping zoom/drag.
    const minDim = Math.min(width, height);
    // Roughly 42-46% of the smaller dimension feels natural; multiply for a little larger look.
    CONFIG.BASE_RADIUS = Math.round(minDim * 0.44 * NATURAL_SIZE_MULTIPLIER);
    CONFIG.ICON_SIZE = Math.round(DEFAULT_ICON_SIZE * NATURAL_SIZE_MULTIPLIER);
    CONFIG.CONNECTION_DISTANCE = Math.round(minDim * 0.25); // Scale connection distance with canvas size

    // Create randomly positioned icons that will move on the globe surface
    // Use minimum distance check to prevent clustering
    iconNodes = [];
    const iconPool = solidIcons.concat(brandIcons);

    // Helper function to calculate angular distance between two points on sphere
    function angularDistance(theta1, phi1, theta2, phi2) {
      // Using haversine formula for great circle distance
      const dPhi = phi2 - phi1;
      const dTheta = theta2 - theta1;
      const a = Math.sin(dPhi / 2) ** 2 + 
                Math.sin(phi1) * Math.sin(phi2) * Math.sin(dTheta / 2) ** 2;
      return 2 * Math.asin(Math.sqrt(a));
    }

    let attempts = 0;
    const maxAttempts = CONFIG.NUM_ICONS * 50; // Increased attempts for large icon counts
    let minDistanceThreshold = CONFIG.MIN_ICON_DISTANCE;

    for (let i = 0; i < CONFIG.NUM_ICONS && attempts < maxAttempts; i++) {
      let theta, phi, tooClose;
      let attemptCount = 0;
      
      do {
        tooClose = false;
        attempts++;
        attemptCount++;
        
        // Random starting position on sphere (spherical coordinates)
        theta = Math.random() * Math.PI * 2; // longitude: 0 to 2π
        phi = Math.acos(2 * Math.random() - 1); // latitude: uniform distribution on sphere
        
        // Check distance to all existing nodes
        for (let j = 0; j < iconNodes.length; j++) {
          const dist = angularDistance(theta, phi, iconNodes[j].theta, iconNodes[j].phi);
          if (dist < minDistanceThreshold) {
            tooClose = true;
            break;
          }
        }
        
        // Gradually reduce min distance if having trouble placing icons
        if (attemptCount > 100 && minDistanceThreshold > 0.05) {
          minDistanceThreshold *= 0.95;
          attemptCount = 0;
        }
      } while (tooClose && attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        console.warn(`Placed ${iconNodes.length} icons (requested ${CONFIG.NUM_ICONS})`);
        break;
      }

      const icon = iconPool[i % iconPool.length];
      
      // Random movement direction (velocity in spherical coords)
      const thetaVel = (Math.random() - 0.5) * CONFIG.ICON_MOVE_SPEED;
      const phiVel = (Math.random() - 0.5) * CONFIG.ICON_MOVE_SPEED * 0.5;

      const node = {
        theta,
        phi,
        thetaVel, // movement velocity in theta direction
        phiVel,   // movement velocity in phi direction
        x: 0,
        y: 0,
        z: 0,
        icon,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.015,
        connections: [], // will store active connections
      };
      iconNodes.push(node);
    }

    console.log(`Created ${iconNodes.length} moving nodes on globe`);
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
      // Update icon position on sphere surface (continuous movement)
      node.theta += node.thetaVel;
      node.phi += node.phiVel;

      // Keep phi in valid range [0, PI] with bounce effect
      if (node.phi <= 0 || node.phi >= Math.PI) {
        node.phiVel = -node.phiVel;
        node.phi = Math.max(0, Math.min(Math.PI, node.phi));
      }

      // Theta wraps around naturally at 2π
      if (node.theta > Math.PI * 2) node.theta -= Math.PI * 2;
      if (node.theta < 0) node.theta += Math.PI * 2;

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

  function drawDynamicConnections() {
    ctx.lineWidth = CONFIG.LINE_WIDTH;
    ctx.lineCap = "round";

    // Clear all connections first
    iconNodes.forEach(node => node.connections = []);

    // Scale connection distance with zoom level to maintain visual consistency
    // Add time-based oscillation for frequent connect/disconnect without moving icons
    const timeOscillation = Math.sin(Date.now() * 0.005) * 0.2 + 1; // Oscillates between 0.8 and 1.2 (faster)
    const scaledConnectionDistance = CONFIG.CONNECTION_DISTANCE * zoomLevel * timeOscillation;

    // Calculate connections based on 2D screen distance
    for (let i = 0; i < iconNodes.length; i++) {
      const nodeA = iconNodes[i];
      
      // Only process nodes on front side of globe (visible)
      if (nodeA.z < -CONFIG.BASE_RADIUS * zoomLevel * 0.3) continue;

      const distances = [];

      for (let j = i + 1; j < iconNodes.length; j++) {
        const nodeB = iconNodes[j];
        
        // Skip nodes on back side
        if (nodeB.z < -CONFIG.BASE_RADIUS * zoomLevel * 0.3) continue;

        // Calculate 2D screen distance
        const dx = nodeA.x - nodeB.x;
        const dy = nodeA.y - nodeB.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < scaledConnectionDistance) {
          distances.push({ node: nodeB, distance: dist });
        }
      }

      // Sort by distance and keep only MAX_CONNECTIONS closest
      distances.sort((a, b) => a.distance - b.distance);
      const connections = distances.slice(0, CONFIG.MAX_CONNECTIONS);

      // Draw connections
      connections.forEach(({ node: nodeB, distance }) => {
        // Calculate opacity based on distance (closer = more opaque)
        const distanceFactor = 1 - (distance / scaledConnectionDistance);
        
        // Calculate depth factor (average z position)
        const avgZ = (nodeA.z + nodeB.z) / 2;
        const depthFactor = (avgZ + CONFIG.BASE_RADIUS * zoomLevel) / 
                            (CONFIG.BASE_RADIUS * zoomLevel * 2);
        
        const opacity = CONFIG.LINE_OPACITY * distanceFactor * 
                        Math.max(0.2, Math.min(0.9, depthFactor));

        // Draw line with gradient effect
        const gradient = ctx.createLinearGradient(nodeA.x, nodeA.y, nodeB.x, nodeB.y);
        gradient.addColorStop(0, `rgba(114, 161, 222, ${opacity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity})`);
        gradient.addColorStop(1, `rgba(114, 161, 222, ${opacity * 0.8})`);

        ctx.strokeStyle = gradient;
        ctx.shadowBlur = 3;
        ctx.shadowColor = `rgba(114, 161, 222, ${opacity * 0.4})`;
        
        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.stroke();
      });
    }

    ctx.shadowBlur = 0;
  }

  // Combined effects animation state
  let haloRotation = 0;
  let pulsePhase = 0;
  let earthGridRotation = 0;
  let binaryDigits = [];
  let fractalRings = [];

  function initBinaryDigits() {
    binaryDigits = [];
    const numDigits = 400;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    
    for (let i = 0; i < numDigits; i++) {
      // Fibonacci sphere algorithm for perfect uniform distribution
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / numDigits);
      
      binaryDigits.push({
        value: Math.random() > 0.5 ? '1' : '0',
        angle: theta,
        elevation: phi - Math.PI / 2,
        distance: 0.3 + (i % 12) * 0.055, // 12 radial layers from 0.3 to 0.905 (throughout entire orb)
        speed: 0.003 + (i % 7) * 0.0006,
        elevationSpeed: ((i % 5) - 2.5) * 0.0008,
        opacity: 0.4 + (i % 6) * 0.1,
        size: 8 + (i % 4),
      });
    }
  }

  function drawEarth() {
    const cx = width / 2;
    const cy = height / 2;
    const coreRadius = CONFIG.BASE_RADIUS * CONFIG.EARTH_RADIUS_RATIO * zoomLevel;

    ctx.save();

    // Update animation states
    earthGridRotation += 0.003;
    pulsePhase += 0.03;
    const pulsatingScale = 1 + Math.sin(pulsePhase * 0.5) * 0.15;
    const innerPulse = 1 + Math.sin(pulsePhase * 0.8) * 0.08; // Subtle inner pulse

    // ==== EFFECT 1: DARK BLUE GRADIENT BASE ====
    // Dark sphere background with deep blue gradient container (more transparent for starfield visibility)
    const sphereGradient = ctx.createRadialGradient(
      cx - coreRadius * 0.3,
      cy - coreRadius * 0.3,
      coreRadius * 0.1,
      cx, cy, coreRadius
    );
    sphereGradient.addColorStop(0, 'rgba(30, 50, 90, 0.3)');  // Reduced from 0.5
    sphereGradient.addColorStop(0.4, 'rgba(20, 40, 75, 0.27)'); // Reduced from 0.45
    sphereGradient.addColorStop(0.7, 'rgba(15, 30, 60, 0.24)'); // Reduced from 0.4
    sphereGradient.addColorStop(1, 'rgba(10, 20, 45, 0.18)');  // Reduced from 0.3

    ctx.fillStyle = sphereGradient;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Glowing inner core with subtle pulsating effect
    ctx.globalCompositeOperation = 'lighter';
    const innerCoreRadius = coreRadius * 0.35 * pulsatingScale * innerPulse;
    const innerGlow = ctx.createRadialGradient(
      cx, cy, 0,
      cx, cy, innerCoreRadius
    );
    const pulseOpacity = 0.6 + Math.sin(pulsePhase * 0.8) * 0.1; // Subtle opacity pulse
    innerGlow.addColorStop(0, `rgba(255, 255, 255, ${pulseOpacity})`);
    innerGlow.addColorStop(0.3, `rgba(180, 220, 255, ${pulseOpacity * 0.85})`);
    innerGlow.addColorStop(0.6, `rgba(100, 180, 255, ${pulseOpacity * 0.65})`);
    innerGlow.addColorStop(1, 'rgba(50, 130, 255, 0)');
    
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, innerCoreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Expanding pulse ring circles (subtle weight but prominent visibility)
    const pulse1 = (pulsePhase * 0.6) % (Math.PI * 2);
    const pulse2 = (pulsePhase * 0.6 + Math.PI) % (Math.PI * 2);
    
    // First pulse ring - starting from exact center point (radius 0), growing outward
    const pulseProgress1 = pulse1 / (Math.PI * 2); // 0 to 1
    const ringRadius1 = coreRadius * (pulseProgress1 * 0.5); // Grow from 0 to 50% of coreRadius
    const ringOpacity1 = (1 - pulseProgress1) * 0.8;
    
    if (ringRadius1 > 2) { // Only draw when radius is visible (> 2px)
      ctx.strokeStyle = `rgba(100, 200, 255, ${ringOpacity1})`;
      ctx.lineWidth = 1; // Very subtle weight
      ctx.shadowBlur = 15;
      ctx.shadowColor = `rgba(100, 200, 255, ${ringOpacity1 * 0.8})`;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius1, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Second pulse ring - starting from exact center point, growing outward
    const pulseProgress2 = pulse2 / (Math.PI * 2); // 0 to 1
    const ringRadius2 = coreRadius * (pulseProgress2 * 0.5); // Grow from 0 to 50% of coreRadius
    const ringOpacity2 = (1 - pulseProgress2) * 0.8;
    
    if (ringRadius2 > 2) { // Only draw when radius is visible (> 2px)
      ctx.strokeStyle = `rgba(150, 220, 255, ${ringOpacity2})`;
      ctx.lineWidth = 1; // Very subtle weight
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(150, 220, 255, ${ringOpacity2 * 0.8})`;
      ctx.beginPath();
      ctx.arc(cx, cy, ringRadius2, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';

    // ==== EFFECT 2: REALISTIC EARTH GRID AROUND INNERMOST ORB ====
    // Exact replication of Earth's latitude/longitude system
    ctx.lineWidth = 1.5; // Increased for prominence
    const gridRadius = coreRadius * 0.85; // Around innermost orb
    
    // Draw latitude circles (parallels) - every 10° from -80° to 80°
    const latitudes = [];
    for (let lat = -80; lat <= 80; lat += 10) {
      latitudes.push(lat);
    }
    
    ctx.save();
    ctx.translate(cx, cy);
    
    // Draw all latitude lines as 3D curves respecting spherical surface
    latitudes.forEach(lat => {
      const latRad = (lat * Math.PI) / 180;
      const latRadius = Math.cos(latRad) * gridRadius;
      const yPos = Math.sin(latRad) * gridRadius;
      
      // Highlight special latitudes
      const isEquator = lat === 0;
      
      let opacity = 0.08;
      if (isEquator) opacity = 0.16;
      else if (Math.abs(lat) % 30 === 0) opacity = 0.12;
      
      ctx.strokeStyle = `rgba(180, 220, 255, ${opacity})`;
      
      // Draw latitude circle as 3D arc segments
      const latSegments = 60;
      ctx.beginPath();
      
      for (let i = 0; i <= latSegments; i++) {
        const angle = (i / latSegments) * Math.PI * 2;
        
        // 3D coordinates on the latitude circle
        let x = latRadius * Math.cos(angle);
        let y = yPos;
        let z = latRadius * Math.sin(angle);
        
        // Apply rotationY for drag
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        
        // Apply rotationX for vertical drag
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        
        // Only draw front-facing segments
        if (z2 > -gridRadius * 0.2) {
          if (i === 0 || z2 <= -gridRadius * 0.2) {
            ctx.moveTo(x1, y1);
          } else {
            ctx.lineTo(x1, y1);
          }
        }
      }
      
      ctx.stroke();
    });
    
    // Draw longitude meridians (great circles) - every 15° for 24 meridians
    const numMeridians = 24; // Every 15 degrees
    const segments = 60; // Number of segments to draw each meridian smoothly
    
    for (let m = 0; m < numMeridians; m++) {
      const longitude = (m * 15) * Math.PI / 180; // Convert to radians
      const totalAngle = longitude + earthGridRotation + rotationY;
      
      ctx.beginPath();
      
      // Draw meridian from south pole to north pole
      for (let s = 0; s <= segments; s++) {
        const lat = -Math.PI / 2 + (s / segments) * Math.PI; // -90° to +90°
        
        // 3D coordinates on sphere
        let x = gridRadius * Math.cos(lat) * Math.cos(longitude + earthGridRotation);
        let y = gridRadius * Math.sin(lat);
        let z = gridRadius * Math.cos(lat) * Math.sin(longitude + earthGridRotation);
        
        // Apply rotationY for drag
        const cosY = Math.cos(rotationY);
        const sinY = Math.sin(rotationY);
        const x1 = x * cosY - z * sinY;
        const z1 = x * sinY + z * cosY;
        
        // Apply rotationX for vertical drag
        const cosX = Math.cos(rotationX);
        const sinX = Math.sin(rotationX);
        const y1 = y * cosX - z1 * sinX;
        const z2 = y * sinX + z1 * cosX;
        
        // Only draw front-facing segments
        if (z2 > -gridRadius * 0.3) {
          if (s === 0) {
            ctx.moveTo(x1, y1);
          } else {
            ctx.lineTo(x1, y1);
          }
        } else {
          // Skip back-facing segments, restart path when coming back to front
          if (s < segments && s > 0) {
            const nextLat = -Math.PI / 2 + ((s + 1) / segments) * Math.PI;
            let nextX = gridRadius * Math.cos(nextLat) * Math.cos(longitude + earthGridRotation);
            let nextY = gridRadius * Math.sin(nextLat);
            let nextZ = gridRadius * Math.cos(nextLat) * Math.sin(longitude + earthGridRotation);
            
            const nextX1 = nextX * cosY - nextZ * sinY;
            const nextZ1 = nextX * sinY + nextZ * cosY;
            const nextY1 = nextY * cosX - nextZ1 * sinX;
            const nextZ2 = nextY * sinX + nextZ1 * cosX;
            
            if (nextZ2 > -gridRadius * 0.3) {
              ctx.moveTo(nextX1, nextY1);
            }
          }
        }
      }
      
      // Calculate opacity based on meridian orientation
      const meridianNormal = Math.sin(totalAngle);
      const visibility = Math.max(0, (meridianNormal + 1) / 2); // 0 to 1
      
      // Major meridians every 30° (uniform, no special prime meridian)
      const isMajor = m % 2 === 0; // Every 30°
      
      // Uniform opacity for all meridians
      let opacity = 0.18; // Minor meridians
      if (isMajor) opacity = 0.35; // Major meridians (uniform)
      
      opacity *= (0.3 + visibility * 0.7);
      
      ctx.strokeStyle = `rgba(180, 220, 255, ${opacity})`;
      ctx.stroke();
    }
    
    ctx.restore();

    // ==== EFFECT 3: BINARY DIGITS FLOATING THROUGHOUT ENTIRE ORB ====
    if (binaryDigits.length === 0) initBinaryDigits();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    binaryDigits.forEach(digit => {
      digit.angle += digit.speed;
      digit.elevation += digit.elevationSpeed;
      
      if (digit.elevation > Math.PI / 2) digit.elevationSpeed = -Math.abs(digit.elevationSpeed);
      if (digit.elevation < -Math.PI / 2) digit.elevationSpeed = Math.abs(digit.elevationSpeed);
      
      const radius = coreRadius * digit.distance;
      
      // Calculate 3D position
      let x = Math.cos(digit.angle) * Math.cos(digit.elevation) * radius;
      let y = Math.sin(digit.elevation) * radius;
      let z = Math.sin(digit.angle) * Math.cos(digit.elevation) * radius;
      
      // Apply rotationY transform (horizontal mouse drag)
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;
      
      // Apply rotationX transform (vertical mouse drag)
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      
      // Translate to screen coordinates
      x = cx + x1;
      y = cy + y1;
      z = z2;
      
      const depthFactor = (z + coreRadius * 0.75) / (coreRadius * 1.5);
      const finalOpacity = digit.opacity * Math.max(0.2, depthFactor);
      
      const color = digit.value === '1' ? '100, 200, 255' : '150, 255, 200';
      
      ctx.shadowBlur = 8;
      ctx.shadowColor = `rgba(${color}, ${finalOpacity * 0.7})`;
      ctx.fillStyle = `rgba(${color}, ${finalOpacity})`;
      ctx.font = `bold ${digit.size * zoomLevel}px monospace`;
      ctx.fillText(digit.value, x, y);
    });
    
    ctx.shadowBlur = 0;

    // Outer atmospheric glow with neon blue/purple aura (prominent colors, no outline, more transparent)
    ctx.globalCompositeOperation = 'lighter';
    const atmosphereGlow = ctx.createRadialGradient(
      cx, cy, coreRadius * 0.85,
      cx, cy, coreRadius * 1.3
    );
    atmosphereGlow.addColorStop(0, 'rgba(100, 180, 255, 0.45)'); // Reduced from 0.65 for transparency
    atmosphereGlow.addColorStop(0.5, 'rgba(120, 100, 255, 0.28)'); // Reduced from 0.4 for transparency
    atmosphereGlow.addColorStop(1, 'rgba(150, 50, 200, 0)');
    
    ctx.fillStyle = atmosphereGlow;
    ctx.beginPath();
    ctx.arc(cx, cy, coreRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalCompositeOperation = 'source-over';

    ctx.restore();
  }

  function drawOldEffects() {
    // LAYER 2: Middle pulse ring (expanding and fading)
    const pulse1 = Math.sin(pulsePhase) * 0.5 + 0.5; // 0 to 1
    const pulse2 = Math.sin(pulsePhase + Math.PI) * 0.5 + 0.5; // Offset pulse
    
    // First pulse wave
    const pulseRadius1 = coreRadius * (0.4 + pulse1 * 0.25);
    const pulseOpacity1 = (1 - pulse1) * 0.6;
    
    ctx.strokeStyle = `rgba(100, 200, 255, ${pulseOpacity1})`;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = `rgba(100, 200, 255, ${pulseOpacity1})`;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius1, 0, Math.PI * 2);
    ctx.stroke();
    
    // Second pulse wave
    const pulseRadius2 = coreRadius * (0.4 + pulse2 * 0.25);
    const pulseOpacity2 = (1 - pulse2) * 0.6;
    
    ctx.strokeStyle = `rgba(50, 150, 255, ${pulseOpacity2})`;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = `rgba(50, 150, 255, ${pulseOpacity2})`;
    ctx.beginPath();
    ctx.arc(cx, cy, pulseRadius2, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.shadowBlur = 0;

    // LAYER 3: Outer dashed rotating rings
    ctx.globalCompositeOperation = 'lighter';
    
    // Outer ring 1 - clockwise rotation
    const dashPattern1 = 15;
    const gapPattern1 = 25;
    const numDashes1 = Math.floor((Math.PI * 2 * coreRadius * 0.75) / (dashPattern1 + gapPattern1));
    
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    for (let i = 0; i < numDashes1; i++) {
      const dashAngle = (i / numDashes1) * Math.PI * 2 + haloRotation;
      const dashLength = (dashPattern1 / (coreRadius * 0.75));
      
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 0.75, dashAngle, dashAngle + dashLength);
      ctx.stroke();
    }
    
    // Outer ring 2 - counter-clockwise rotation
    const dashPattern2 = 12;
    const gapPattern2 = 20;
    const numDashes2 = Math.floor((Math.PI * 2 * coreRadius * 0.85) / (dashPattern2 + gapPattern2));
    
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < numDashes2; i++) {
      const dashAngle = (i / numDashes2) * Math.PI * 2 - haloRotation * 1.5;
      const dashLength = (dashPattern2 / (coreRadius * 0.85));
      
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 0.85, dashAngle, dashAngle + dashLength);
      ctx.stroke();
    }
    
    // Outer ring 3 - slower clockwise with glow
    const dashPattern3 = 20;
    const gapPattern3 = 30;
    const numDashes3 = Math.floor((Math.PI * 2 * coreRadius * 0.95) / (dashPattern3 + gapPattern3));
    
    ctx.strokeStyle = 'rgba(80, 160, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(80, 160, 255, 0.6)';
    
    for (let i = 0; i < numDashes3; i++) {
      const dashAngle = (i / numDashes3) * Math.PI * 2 + haloRotation * 0.5;
      const dashLength = (dashPattern3 / (coreRadius * 0.95));
      
      ctx.beginPath();
      ctx.arc(cx, cy, coreRadius * 0.95, dashAngle, dashAngle + dashLength);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;

    // LAYER 4: Subtle connecting signal lines (random radial lines)
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + haloRotation * 0.3;
      const innerR = coreRadius * 0.4;
      const outerR = coreRadius * 0.7;
      
      const x1 = cx + Math.cos(angle) * innerR;
      const y1 = cy + Math.sin(angle) * innerR;
      const x2 = cx + Math.cos(angle) * outerR;
      const y2 = cy + Math.sin(angle) * outerR;
      
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
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
    drawDynamicConnections(); // Draw connecting lines based on proximity
    drawEarth(); // Draw Earth in the center
    drawIcons(); // Draw satellite icons orbiting Earth

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
