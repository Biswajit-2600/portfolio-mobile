const video1 = document.getElementById("projectVideo1");
const video2 = document.getElementById("projectVideo2");
const video3 = document.getElementById("projectVideo3");

// Sidebar elements //
const sideBar = document.querySelector(".sidebar");
const menu = document.querySelector(".menu-icon");
const closeIcon = document.querySelector(".close-icon");

const hoverSign = document.querySelector(".hover-sign");

const videoList = [video1, video2, video3];

videoList.forEach(function (video) {
  video.addEventListener("mouseover", function () {
    video.play();
    hoverSign.classList.add("active");
  });
  video.addEventListener("mouseout", function () {
    video.pause();
    hoverSign.classList.remove("active");
  });
});

// Sidebar elements //
menu.addEventListener("click", function () {
  sideBar.classList.remove("close-sidebar");
  sideBar.classList.add("open-sidebar");
});

closeIcon.addEventListener("click", function () {
  sideBar.classList.remove("open-sidebar");
  sideBar.classList.add("close-sidebar");
});

// Initialize AOS (Animate On Scroll)
if (typeof AOS !== "undefined") {
  AOS.init();
}

// Manual blur control for hero-skills-animation to match hero-info behavior
const heroSkillsAnimation = document.querySelector(".hero-skills-animation");
const heroSection = document.querySelector(".hero-section");

if (heroSkillsAnimation && heroSection) {
  let currentBlur = 0;
  let targetBlur = 0;
  let isAnimating = false;
  let lastTime = performance.now();

  // Smooth interpolation with variable speed
  function lerp(start, end, factor) {
    return start + (end - start) * factor;
  }

  // Animate blur smoothly with frame-rate independence
  function animateBlur(currentTime) {
    const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60fps
    lastTime = currentTime;

    // Faster interpolation for more responsive feel (0.2 instead of 0.1)
    const lerpFactor = Math.min(1 * deltaTime, 1);
    currentBlur = lerp(currentBlur, targetBlur, lerpFactor);

    // Smaller threshold for smoother animation
    if (Math.abs(currentBlur - targetBlur) > 0.05) {
      heroSkillsAnimation.style.filter = `blur(${currentBlur.toFixed(2)}px)`;
      requestAnimationFrame(animateBlur);
    } else {
      heroSkillsAnimation.style.filter = `blur(${targetBlur}px)`;
      currentBlur = targetBlur; // Snap to target
      isAnimating = false;
    }
  }

  // Create intersection observer for the hero section
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const scrollProgress = entry.intersectionRatio;

        // Calculate blur based on how much of hero is visible (smoother curve with more breakpoints)
        if (scrollProgress > 0.75) {
          // Fully in view - crystal clear
          targetBlur = 0;
        } else if (scrollProgress > 0.65) {
          // Slight blur as it starts to exit
          targetBlur = ((0.75 - scrollProgress) / 0.1) * 5;
        } else if (scrollProgress > 0.5) {
          // Moderate blur
          targetBlur = 5 + ((0.65 - scrollProgress) / 0.15) * 10;
        } else if (scrollProgress > 0.35) {
          // Increasing blur
          targetBlur = 13 + ((0.5 - scrollProgress) / 0.15) * 15;
        } else if (scrollProgress > 0.25) {
          // Heavy blur
          targetBlur = 23 + ((0.35 - scrollProgress) / 0.1) * 20;
        } else {
          // Maximum blur when mostly out of view
          targetBlur = 40;
        }

        heroSkillsAnimation.style.opacity = scrollProgress < 0.1 ? 0 : 1;

        // Start animation if not already running
        if (!isAnimating) {
          isAnimating = true;
          lastTime = performance.now();
          requestAnimationFrame(animateBlur);
        }
      });
    },
    {
      threshold: Array.from({ length: 41 }, (_, i) => i / 40), // More granular updates (every 2.5%)
      rootMargin: "0px",
    }
  );

  observer.observe(heroSection);
}

// Scroll-triggered card animation for about section
const aboutCards = document.getElementById("about-cards");
const aboutSection = document.getElementById("about-section");

if (aboutCards && aboutSection) {
  const aboutObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !aboutCards.classList.contains("animate-cards")) {
          aboutCards.classList.add("animate-cards");
          aboutObserver.unobserve(aboutSection); // Only trigger once
        }
      });
    },
    {
      threshold: 0.3, // Trigger when 30% of section is visible
      rootMargin: "0px",
    }
  );

  aboutObserver.observe(aboutSection);
}
