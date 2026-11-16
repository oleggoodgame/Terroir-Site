const facade = document.querySelector('[data-youtube-facade]');

if (facade) {
    facade.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/MQudXFxBpPw?autoplay=1';
        iframe.title = 'Відео про виробництво вина та сиру на YouTube';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.allowFullscreen = true;
        iframe.tabIndex = 0;
        iframe.className = 'absolute inset-0 h-full w-full';

        facade.replaceWith(iframe);
        iframe.focus();
    });
}
