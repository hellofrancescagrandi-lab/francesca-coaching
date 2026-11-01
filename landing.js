(function () {
    // Comparsa morbida delle sezioni allo scroll (se JS disattivo, il contenuto resta visibile)
    var els = document.querySelectorAll('.hero-copy, .hero-photo, .pillar, .section-head, .step, .bio-grid > *, .title, .carousel, .faq details, .footer-cta, .footer-nav');
    if (!('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js');
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
    }, { threshold: 0.12 });
    els.forEach(function (el) { el.classList.add('reveal'); io.observe(el); });
})();
(function () {
    var root = document.getElementById('reviews');
    if (!root) return;
    var track = root.querySelector('.track');
    var slides = root.querySelectorAll('.slide');
    var dotsBox = document.getElementById('car-dots');
    var INTERVAL = 4500;
    var index = 0, timer = null;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    slides.forEach(function (_, i) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'dot';
        d.setAttribute('aria-label', 'Vai alla recensione ' + (i + 1));
        d.addEventListener('click', function () { go(i, true); });
        dotsBox.appendChild(d);
    });
    var dots = dotsBox.querySelectorAll('.dot');

    function mark() {
        dots.forEach(function (d, i) { d.setAttribute('aria-current', i === index ? 'true' : 'false'); });
    }
    function go(i, user) {
        index = (i + slides.length) % slides.length;
        track.scrollTo({ left: slides[index].offsetLeft - track.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
        mark();
        if (user) restart();
    }
    function start() { if (!reduce && !timer) timer = setInterval(function () { go(index + 1); }, INTERVAL); }
    function stop() { clearInterval(timer); timer = null; }
    function restart() { stop(); start(); }

    // aggiorna l'indice anche con lo swipe manuale
    var st;
    track.addEventListener('scroll', function () {
        clearTimeout(st);
        st = setTimeout(function () {
            var w = track.clientWidth || 1;
            index = Math.round(track.scrollLeft / w);
            mark();
        }, 80);
    });

    document.getElementById('car-prev').addEventListener('click', function () { go(index - 1, true); });
    document.getElementById('car-next').addEventListener('click', function () { go(index + 1, true); });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);
    root.addEventListener('focusout', start);
    root.addEventListener('touchstart', stop, { passive: true });
    root.addEventListener('touchend', restart, { passive: true });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });

    mark();
    start();
})();
