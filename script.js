document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close menu when a link is clicked
    links.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // 2. Sticky Navbar Background on Scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 3. FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            // Toggle current item
            item.classList.toggle('active');
        });
    });

    // 4. Scroll Reveal Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: stop observing once it's visible
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach(el => observer.observe(el));

    // 5. Admin Panel Logic
    const urlParams = new URLSearchParams(window.location.search);
    const adminModal = document.getElementById('admin-modal');
    
    // Check if there are saved video IDs in LocalStorage
    const savedVid1 = localStorage.getItem('yt_vid_1');
    const savedVid2 = localStorage.getItem('yt_vid_2');
    const savedVid3 = localStorage.getItem('yt_vid_3');
    
    // Helper to extract video ID from a youtube URL or return the string if it's already an ID
    function extractVideoID(urlOrId) {
        if (!urlOrId) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = urlOrId.match(regExp);
        return (match && match[2].length === 11) ? match[2] : urlOrId;
    }

    if (savedVid1) document.getElementById('yt-iframe-1').src = `https://www.youtube.com/embed/${savedVid1}`;
    if (savedVid2) document.getElementById('yt-iframe-2').src = `https://www.youtube.com/embed/${savedVid2}`;
    if (savedVid3) document.getElementById('yt-iframe-3').src = `https://www.youtube.com/embed/${savedVid3}`;

    // Show modal if ?admin=true
    if (urlParams.get('admin') === 'true' && adminModal) {
        adminModal.classList.add('active');
        
        // Pre-fill inputs with current saved IDs if they exist
        if (savedVid1) document.getElementById('admin-vid-1').value = savedVid1;
        if (savedVid2) document.getElementById('admin-vid-2').value = savedVid2;
        if (savedVid3) document.getElementById('admin-vid-3').value = savedVid3;
        
        // Handle Save
        document.getElementById('admin-save-btn').addEventListener('click', () => {
            const v1 = extractVideoID(document.getElementById('admin-vid-1').value.trim());
            const v2 = extractVideoID(document.getElementById('admin-vid-2').value.trim());
            const v3 = extractVideoID(document.getElementById('admin-vid-3').value.trim());
            
            if (v1) localStorage.setItem('yt_vid_1', v1);
            if (v2) localStorage.setItem('yt_vid_2', v2);
            if (v3) localStorage.setItem('yt_vid_3', v3);
            
            alert('Video salvati con successo! La pagina si ricaricherà.');
            window.location.href = window.location.pathname; // Reload without ?admin=true
        });

        // Handle Close
        document.getElementById('admin-close-btn').addEventListener('click', () => {
            adminModal.classList.remove('active');
        });
    }
});
