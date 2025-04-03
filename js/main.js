document.addEventListener('DOMContentLoaded', function() {

    // Initialize AOS (Animate on Scroll)
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000, // Animation duration
            once: true, // Animate elements only once
            offset: 50, // Trigger animation slightly before element is in view
        });
    }

    // Initialize Vanta.js Animated Background
    if (typeof VANTA !== 'undefined') {
        VANTA.NET({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0xff69b4, // Pink color
            backgroundColor: 0xececec, // Light grey background
            points: 12.00,
            maxDistance: 25.00,
            spacing: 18.00
        });
    }

    // GSAP Animations
    if (typeof gsap !== 'undefined') {
        // Example: Animate navbar items on load
        gsap.from(".navbar .logo", { duration: 0.8, x: -50, opacity: 0, ease: "power2.out" });
        gsap.from(".nav-links li", { duration: 0.5, y: -30, opacity: 0, stagger: 0.1, ease: "power2.out", delay: 0.3 });

        // Example: Animate stat numbers when they scroll into view
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(num => {
            gsap.fromTo(num, {
                textContent: 0
            }, {
                textContent: num.dataset.target,
                duration: 2,
                ease: "power1.inOut",
                snap: { textContent: 1 }, // Animate integer values
                scrollTrigger: {
                    trigger: num,
                    start: "top 90%", // Start animation when 90% of the element is visible
                    toggleActions: "play none none none" // Play animation once on enter
                }
            });
        });

        // Add more GSAP animations as needed
        // Example: Parallax effect for images in info sections
        gsap.utils.toArray(".info-image").forEach(image => {
            gsap.to(image, {
                yPercent: -15, // Move image up slightly on scroll
                ease: "none",
                scrollTrigger: {
                    trigger: image.closest(".info-content, .info-content-right"),
                    start: "top bottom", // Start when the top of the section hits the bottom of the viewport
                    end: "bottom top", // End when the bottom of the section hits the top of the viewport
                    scrub: true // Smooth scrubbing effect
                }
            });
        });
    }

    // Hamburger Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close menu when a link is clicked (for single-page navigation)
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                // Check if it's an internal link
                if (link.getAttribute('href').startsWith('#')) {
                     // Smooth scroll for internal links
                    e.preventDefault();
                    const targetId = link.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    if(targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 70, // Adjust for fixed navbar height
                            behavior: 'smooth'
                        });
                    }

                    // Close mobile menu after click
                    if (navLinks.classList.contains('active')) {
                        hamburger.classList.remove('active');
                        navLinks.classList.remove('active');
                    }
                }
            });
        });
    }

    // Smooth scroll for hero button
    const learnMoreBtn = document.querySelector('.hero-content .btn');
    if (learnMoreBtn && learnMoreBtn.getAttribute('href').startsWith('#')) {
        learnMoreBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = learnMoreBtn.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if(targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    }

    // Chat Toggle Functionality (assuming chat.js doesn't handle this)
    const chatToggle = document.getElementById('chat-toggle');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');

    if (chatToggle && chatContainer && closeChat) {
        chatToggle.addEventListener('click', () => {
            chatContainer.style.display = (chatContainer.style.display === 'flex') ? 'none' : 'flex';
        });
        closeChat.addEventListener('click', () => {
            chatContainer.style.display = 'none';
        });
    }

}); 