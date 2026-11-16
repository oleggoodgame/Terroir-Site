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

    typedEl.textContent = phrases[0];
});
