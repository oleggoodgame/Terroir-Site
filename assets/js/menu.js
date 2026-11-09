document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('menu-toggle');
    const menu = document.getElementById('mobile-menu');
    const iconOpen = document.getElementById('icon-open');
    const iconClose = document.getElementById('icon-close');

    if (!toggle || !menu || !iconOpen || !iconClose) {
        return;
    }

    toggle.addEventListener('click', () => {
        const isOpen = menu.classList.toggle('hidden') === false;
        toggle.setAttribute('aria-expanded', String(isOpen));
        toggle.setAttribute('aria-label', isOpen ? 'Закрити меню' : 'Відкрити меню');
        iconOpen.classList.toggle('hidden', isOpen);
        iconClose.classList.toggle('hidden', !isOpen);
    });
});
