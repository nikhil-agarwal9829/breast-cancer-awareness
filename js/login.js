document.addEventListener('DOMContentLoaded', function() {
    // Initialize AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 1000,
            once: true,
            mirror: false
        });
    }

    // Initialize Particles.js
    particlesJS('particles-background', {
        particles: {
            number: {
                value: 80,
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: '#ff69b4'
            },
            shape: {
                type: 'circle'
            },
            opacity: {
                value: 0.5,
                random: false
            },
            size: {
                value: 3,
                random: true
            },
            line_linked: {
                enable: true,
                distance: 150,
                color: '#ff69b4',
                opacity: 0.4,
                width: 1
            },
            move: {
                enable: true,
                speed: 2,
                direction: 'none',
                random: false,
                straight: false,
                out_mode: 'out',
                bounce: false
            }
        },
        interactivity: {
            detect_on: 'canvas',
            events: {
                onhover: {
                    enable: true,
                    mode: 'grab'
                },
                onclick: {
                    enable: true,
                    mode: 'push'
                },
                resize: true
            }
        },
        retina_detect: true
    });

    // Initialize VANTA.NET
    VANTA.NET({
        el: '#particles-background',
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color: 0xff69b4,
        backgroundColor: 0x0,
        points: 8.00,
        maxDistance: 20.00,
        spacing: 17.00,
        showDots: false
    });

    const sign_in_btn = document.querySelector("#sign-in-btn");
    const sign_up_btn = document.querySelector("#sign-up-btn");
    const container = document.querySelector(".container");

    // Sample user data (replace with your backend integration)
    const users = [
        { username: "user1", password: "password1", type: "user" },
        { username: "admin", password: "admin123", type: "admin" }
    ];

    if (sign_up_btn) {
        sign_up_btn.addEventListener("click", () => {
            container.classList.add("sign-up-mode");
            resetForms();
        });
    }

    if (sign_in_btn) {
        sign_in_btn.addEventListener("click", () => {
            container.classList.remove("sign-up-mode");
            resetForms();
        });
    }

    // Reset forms when switching
    function resetForms() {
        document.querySelectorAll('form').forEach(form => {
            form.reset();
        });
    }

    // Handle form submissions
    const signInForm = document.querySelector(".sign-in-form");
    if (signInForm) {
        signInForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const form = e.target;
            const username = form.querySelector('input[type="text"]').value;
            const password = form.querySelector('input[type="password"]').value;
            const userType = form.querySelector('input[name="user-type"]:checked').value;

            // Check credentials
            const user = users.find(u => u.username === username && u.password === password && u.type === userType);

            if (user) {
                // Store user info in session
                sessionStorage.setItem('currentUser', JSON.stringify(user));
                alert('Login successful! Redirecting...');

                // Redirect based on user type
                setTimeout(() => {
                    window.location.href = user.type === 'admin' ? 'admin-dashboard.html' : 'index.html';
                }, 1500);
            } else {
                alert('Invalid credentials. Please try again.');
            }
        });
    }

    const signUpForm = document.querySelector(".sign-up-form");
    if (signUpForm) {
        signUpForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const form = e.target;
            const name = form.querySelector('input[placeholder="Full Name"]').value;
            const email = form.querySelector('input[type="email"]').value;
            const phone = form.querySelector('input[type="tel"]').value;
            const password = form.querySelector('input[type="password"]').value;
            const confirmPassword = form.querySelectorAll('input[type="password"]')[1].value;

            try {
                if (password !== confirmPassword) {
                    throw new Error("Passwords don't match!");
                }

                // Add validation for email and phone
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                const phoneRegex = /^\d{10}$/;

                if (!emailRegex.test(email)) {
                    throw new Error("Please enter a valid email address");
                }

                if (!phoneRegex.test(phone)) {
                    throw new Error("Please enter a valid 10-digit phone number");
                }

                alert('Registration successful! Please sign in.');
                
                // Switch to sign in form after successful registration
                setTimeout(() => {
                    container.classList.remove("sign-up-mode");
                    resetForms();
                }, 1500);
            } catch (error) {
                alert(error.message);
            }
        });
    }

    // Add animation to input fields
    document.querySelectorAll('.input-field input').forEach(input => {
        input.addEventListener('focus', () => {
            input.parentElement.classList.add('active');
        });
        input.addEventListener('blur', () => {
            if (input.value === '') {
                input.parentElement.classList.remove('active');
            }
        });
    });

    // Notification system
    function showNotification(type, message) {
        // Remove existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type} animate__animated animate__fadeInDown`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
        `;

        // Add to document
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('animate__fadeInDown');
            notification.classList.add('animate__fadeOutUp');
            setTimeout(() => notification.remove(), 1000);
        }, 3000);
    }

    // Add video background switcher
    const videos = [
        'https://assets.mixkit.co/videos/preview/mixkit-pink-flowers-in-the-wind-1164-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-pink-roses-close-up-1189-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-pink-and-blue-flowers-1186-large.mp4'
    ];
    let currentVideoIndex = 0;

    function switchVideo() {
        const video = document.querySelector('#myVideo');
        currentVideoIndex = (currentVideoIndex + 1) % videos.length;
        video.src = videos[currentVideoIndex];
        video.play();
    }

    // Switch video every 10 seconds
    setInterval(switchVideo, 10000);
}); 