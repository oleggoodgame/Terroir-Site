document.addEventListener('DOMContentLoaded', () => {
    // Ініціалізація слайдера відгуків.
    new Swiper('.reviews-swiper', {
        loop: true,
        slidesPerView: 1,
        spaceBetween: 24,
        autoplay: {
            delay: 3500,
            disableOnInteraction: false,
            pauseOnMouseEnter: true
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev'
        },
        breakpoints: {
            768: { slidesPerView: 2, spaceBetween: 24 },
            1024: { slidesPerView: 3, spaceBetween: 24 }
        }
    });

    // Ініціалізація галереї фотографій.
    Fancybox.bind('[data-fancybox="terroir-gallery"]', {
        Carousel: { transition: 'fade' },
        Images: { Panzoom: { maxScale: 3 } }
    });
});
