/**
 * FRANCESCA GRANDI — BRAND JAVASCRIPT
 * Performance, Mobile UX, Cookie Consent & Tracking Hooks
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Drawer
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileNav = document.querySelector('.mobile-nav');

    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', () => {
            const isOpen = mobileNav.classList.contains('open');
            if (isOpen) {
                mobileNav.classList.remove('open');
                mobileToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            } else {
                mobileNav.classList.add('open');
                mobileToggle.setAttribute('aria-expanded', 'true');
                document.body.style.overflow = 'hidden';
            }
        });

        // Close drawer on link click
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                document.body.style.overflow = '';
            });
        });
    }

    // 2. Cookie Consent Manager (GDPR Compliance)
    const cookieBanner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('acceptCookies');
    const rejectBtn = document.getElementById('rejectCookies');

    const CONSENT_KEY = 'fg_cookie_consent_v1';

    if (cookieBanner) {
        const savedConsent = localStorage.getItem(CONSENT_KEY);
        if (!savedConsent) {
            setTimeout(() => {
                cookieBanner.classList.add('show');
            }, 1000);
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                localStorage.setItem(CONSENT_KEY, 'accepted');
                cookieBanner.classList.remove('show');
                initTrackingAnalytics();
            });
        }

        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                localStorage.setItem(CONSENT_KEY, 'essential_only');
                cookieBanner.classList.remove('show');
            });
        }

        if (savedConsent === 'accepted') {
            initTrackingAnalytics();
        }
    }

    // 3. Analytics & Meta Pixel Hooks
    function initTrackingAnalytics() {
        /**
         * GOOGLE ANALYTICS (GA4) PREDISPOSIZIONE:
         * Sostituisci 'G-XXXXXXXXXX' con il tuo Measurement ID di Google Analytics 4.
         */
        const GA_MEASUREMENT_ID = ''; // Inserisci es: 'G-1234567890'
        if (GA_MEASUREMENT_ID) {
            const gaScript = document.createElement('script');
            gaScript.async = true;
            gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
            document.head.appendChild(gaScript);

            window.dataLayer = window.dataLayer || [];
            function gtag() { dataLayer.push(arguments); }
            gtag('js', new Date());
            gtag('config', GA_MEASUREMENT_ID, { 'anonymize_ip': true });
        }

        /**
         * META PIXEL (FACEBOOK) PREDISPOSIZIONE:
         * Sostituisci 'PIXEL_ID' con il tuo Pixel ID di Meta Business Manager.
         */
        const META_PIXEL_ID = ''; // Inserisci es: '9876543210'
        if (META_PIXEL_ID) {
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', META_PIXEL_ID);
            fbq('track', 'PageView');
        }
    }

    // 4. Highlight Active Navigation Item based on current URL
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link, .mobile-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href === currentPath || (currentPath === '' && href === 'index.html'))) {
            link.classList.add('active');
        }
    });

    // 5. Contact / Info Request Form Handler (info.francescagrandi@gmail.com)
    const contactForm = document.getElementById('contactForm');
    const successBox = document.getElementById('formSuccessMessage');

    // Mostra messaggio se reindirizzato con ?inviato=true
    if (window.location.search.includes('inviato=true') && successBox) {
        successBox.style.display = 'block';
        if (contactForm) contactForm.style.display = 'none';
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            const submitBtn = document.getElementById('submitBtn') || contactForm.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn ? submitBtn.innerHTML : 'Invia';

            // Invio AJAX moderno con FormSubmit
            e.preventDefault();

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>INVIO IN CORSO...</span>';
            }

            try {
                const formData = new FormData(contactForm);
                const response = await fetch('https://formsubmit.co/ajax/info.francescagrandi@gmail.com', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json'
                    },
                    body: formData
                });

                if (response.ok) {
                    if (successBox) {
                        successBox.style.display = 'block';
                        successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                    contactForm.reset();
                    contactForm.style.display = 'none';
                } else {
                    // Fallback nativo
                    contactForm.submit();
                }
            } catch (err) {
                // In caso di errore di rete, fallback a submit standard
                contactForm.submit();
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnHtml;
                }
            }
        });
    }
});
