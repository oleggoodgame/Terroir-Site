document.addEventListener('DOMContentLoaded', () => {
    const typedEl = document.getElementById('typed-text');

    if (!typedEl) {
        return;
    }

    const phrases = [
        'Ідеальна пара для твого сиру.',
        'Вина з усіх регіонів України.',
        'Крафт, який має характер.'
    ];

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        typedEl.textContent = phrases[0];
        return;
    }

    new Typed(typedEl, {
        strings: phrases,
        typeSpeed: 50,
        backSpeed: 30,
        backDelay: 1500,
        loop: true
    });
});
