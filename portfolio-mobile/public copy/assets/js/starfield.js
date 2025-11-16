/**
 * 3D Starfield Animation
 * Stars move toward viewer with even distribution
 * Grid-based spawning ensures uniform coverage
 */

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

let stars = [];
let w, h, centerX, centerY;
let gridCells = [];
let lastTime = 0;

// Configuration
const STAR_COUNT = Math.floor(window.innerWidth / 4);
const SPEED = 3;
const MAX_DEPTH = 2000;
const MIN_DEPTH = 1;
const GRID_SIZE = 40; // Size of each grid cell for even distribution

function init() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  centerX = w / 2;
  centerY = h / 2;

  // Create grid system for even distribution
  const cols = Math.ceil(w / GRID_SIZE) + 4; // Extra padding
  const rows = Math.ceil(h / GRID_SIZE) + 4;
  gridCells = [];
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      gridCells.push({ x, y });
    }
  }
  
  // Shuffle grid cells for random selection
  gridCells.sort(() => Math.random() - 0.5);

  // Create stars distributed evenly using grid
  stars = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push(createStar(i));
  }
}

function createStar(index) {
  // Use grid-based distribution for perfectly even spread
  const cellIndex = index % gridCells.length;
  const cell = gridCells[cellIndex];
  
  // Calculate screen position where we want the star to appear
  const targetScreenX = (cell.x - 2) * GRID_SIZE;
  const targetScreenY = (cell.y - 2) * GRID_SIZE;
  
  // Add random offset within cell for natural look
  const offsetX = Math.random() * GRID_SIZE;
  const offsetY = Math.random() * GRID_SIZE;
  
  const finalScreenX = targetScreenX + offsetX;
  const finalScreenY = targetScreenY + offsetY;
  
  // Random depth for this star
  const z = Math.random() * MAX_DEPTH + MIN_DEPTH;
  
  // Reverse the perspective projection to find 3D position
  // that will project to our desired screen position
  const k = 128 / z;
  const x = (finalScreenX - centerX) / k + centerX;
  const y = (finalScreenY - centerY) / k + centerY;
  
  return {
    x: x,
    y: y,
    z: z,
    baseSize: Math.random() * 0.4 + 0.15,
    speed: 1, // Consistent speed for all stars
    cellIndex: cellIndex,
  };
}

function animate(currentTime = 0) {
  // Calculate delta time for consistent animation speed
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  const normalizedDelta = Math.min(deltaTime / 16.67, 2); // Cap at 2x speed to prevent jumps

  // Clear with slight trail for motion blur effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.fillRect(0, 0, w, h);

  // Update and draw each star
  for (let i = 0; i < stars.length; i++) {
    const star = stars[i];

    // Move star toward viewer with time-based movement
    star.z -= SPEED * star.speed * normalizedDelta;

    // Reset star if it passes the viewer, maintaining grid distribution
    if (star.z <= MIN_DEPTH) {
      stars[i] = createStar(i);
      stars[i].z = MAX_DEPTH;
      continue;
    }

    // Calculate 3D perspective projection
    const k = 128 / star.z;
    const px = (star.x - centerX) * k + centerX;
    const py = (star.y - centerY) * k + centerY;

    // Calculate size - stars grow as they approach
    const depthRatio = 1 - star.z / MAX_DEPTH;
    const size = star.baseSize * (0.5 + depthRatio * 4);

    // Calculate subtle opacity
    const opacity = Math.min(0.4 + depthRatio * 0.5, 0.85);

    // Only draw if star is visible on screen
    if (px >= -50 && px <= w + 50 && py >= -50 && py <= h + 50) {
      // Draw star core
      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();

      // Add very subtle glow for closer stars
      if (star.z < MAX_DEPTH * 0.3) {
        const glowSize = size * 1.8;
        const gradient = ctx.createRadialGradient(
          px,
          py,
          size,
          px,
          py,
          glowSize
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.3})`);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw subtle motion trail for very close stars
      if (star.z < MAX_DEPTH * 0.2) {
        const prevZ = star.z + SPEED * star.speed;
        const prevK = 128 / prevZ;
        const prevPx = (star.x - centerX) * prevK + centerX;
        const prevPy = (star.y - centerY) * prevK + centerY;

        const trailGradient = ctx.createLinearGradient(prevPx, prevPy, px, py);
        trailGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
        trailGradient.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.4})`);

        ctx.strokeStyle = trailGradient;
        ctx.lineWidth = Math.max(size * 0.6, 0.5);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(prevPx, prevPy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(animate);
}

// Handle window resize
window.addEventListener("resize", () => {
  init();
});

// Start animation
init();
animate();
