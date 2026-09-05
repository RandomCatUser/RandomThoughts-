(function () {
    "use strict";

    document.addEventListener('DOMContentLoaded', function () {

        var postList = (window.RT_POSTS || []).slice();

        /* ---- Render posts from data ---- */
        function escapeHtml(str) {
            return String(str).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        }

        function contributorPhotos(contributors, small) {
            if (!contributors || !contributors.length) return '';
            var size = small ? 'lt-avatar-sm' : '';
            return contributors.map(function (c) {
                return '<img class="lt-avatar ' + size + '" src="' + escapeHtml(c.photo) + '" alt="' + escapeHtml(c.name) + '" loading="lazy">';
            }).join('');
        }

        function contributorNames(contributors) {
            if (!contributors || !contributors.length) return 'Anonymous';
            return contributors.map(function (c) { return c.name; }).join(', ');
        }

        function featuredCard(post) {
            var tagsHtml = (post.tags || []).map(function (t) {
                return '<span class="lt-tag">' + escapeHtml(t) + '</span>';
            }).join(' ');
            return '' +
                '<a href="' + escapeHtml(post.url) + '" class="lt-featured lt-reveal group">' +
                    '<div class="lt-featured-media">' +
                        '<img src="' + escapeHtml(post.cover) + '" alt="' + escapeHtml(post.coverAlt || post.title) + '">' +
                    '</div>' +
                    '<div class="lt-featured-body">' +
                        '<div class="flex items-center gap-2.5 flex-wrap">' + tagsHtml +
                        '</div>' +
                        '<h2 class="lt-featured-title">' + escapeHtml(post.title) + '</h2>' +
                        '<p class="lt-featured-desc">' + escapeHtml(post.description) + '</p>' +
                        '<div class="lt-byline">' +
                            '<div class="lt-avatar-stack">' + contributorPhotos(post.contributors, false) + '</div>' +
                            '<div>' +
                                '<p class="lt-byline-name">' + escapeHtml(contributorNames(post.contributors)) + '</p>' +
                                '<p class="lt-byline-sub">' + escapeHtml(post.date) + '</p>' +
                            '</div>' +
                            '<span class="lt-arrow" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>' +
                        '</div>' +
                    '</div>' +
                '</a>';
        }

        function card(post) {
            var tagsHtml = (post.tags || []).map(function (t) {
                return '<span class="lt-tag">' + escapeHtml(t) + '</span>';
            }).join(' ');
            return '' +
                '<article class="lt-card lt-reveal group">' +
                    '<a href="' + escapeHtml(post.url) + '" class="lt-card-link">' +
                        '<div class="lt-card-media">' +
                            '<img src="' + escapeHtml(post.cover) + '" alt="' + escapeHtml(post.coverAlt || post.title) + '" loading="lazy">' +
                        '</div>' +
                        '<div class="lt-card-body">' +
                            '<div class="lt-card-top">' + tagsHtml +
                            '</div>' +
                            '<h3 class="lt-card-title">' + escapeHtml(post.title) + '</h3>' +
                            '<p class="lt-card-desc">' + escapeHtml(post.description) + '</p>' +
                            '<div class="lt-card-foot">' +
                                '<div class="lt-avatar-stack lt-avatar-stack-sm">' + contributorPhotos(post.contributors, true) + '</div>' +
                                '<div>' +
                                    '<p class="lt-byline-name">' + escapeHtml(contributorNames(post.contributors)) + '</p>' +
                                    '<p class="lt-byline-sub">' + escapeHtml(post.date) + '</p>' +
                                '</div>' +
                                '<span class="lt-arrow lt-arrow-sm" aria-hidden="true"><i class="fa-solid fa-arrow-right"></i></span>' +
                            '</div>' +
                        '</div>' +
                    '</a>' +
                '</article>';
        }

        function render(posts) {
            var featured = document.getElementById('lt-featured-slot');
            var grid = document.getElementById('lt-grid');

            var featuredPost = null;
            for (var i = 0; i < posts.length; i++) {
                if (posts[i].featured) { featuredPost = posts[i]; break; }
            }

            if (featured) {
                featured.innerHTML = featuredPost ? featuredCard(featuredPost) : '';
            }

            if (grid) {
                var rest = posts.filter(function (p) { return p !== featuredPost; });
                grid.innerHTML = rest.map(card).join('');
            }
        }

        render(postList);

        /* ---- Scroll reveal ---- */
        function revealAll() {
            var els = Array.prototype.slice.call(document.querySelectorAll('.lt-reveal, .lt-rise'));
            els.forEach(function (el) { el.classList.add('is-visible'); });
        }

        var revealEls = Array.prototype.slice.call(document.querySelectorAll('.lt-reveal, .lt-rise'));
        var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function initReveal() {
            revealEls = Array.prototype.slice.call(document.querySelectorAll('.lt-reveal, .lt-rise'));
            if ('IntersectionObserver' in window && revealEls.length && !reduced) {
                var io = new IntersectionObserver(function (entries) {
                    entries.forEach(function (entry) {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            io.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });

                var riseIdx = 0;
                var cardIdx = 0;
                revealEls.forEach(function (el) {
                    if (el.classList.contains('lt-rise') && el.closest('header')) {
                        el.style.transitionDelay = (riseIdx++ * 80) + 'ms';
                    } else if (el.classList.contains('lt-reveal')) {
                        el.style.transitionDelay = ((cardIdx++ % 3) * 60) + 'ms';
                    }
                    io.observe(el);
                });
            } else {
                revealAll();
            }
        }

        initReveal();
    });
})();
