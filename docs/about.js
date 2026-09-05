(function () {
    "use strict";

    document.addEventListener('DOMContentLoaded', function () {
        var posts = (window.RT_POSTS || []).slice();
        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function countUp(el, target, duration) {
            if (reduced) { el.textContent = target; return; }
            var start = performance.now();
            var dur = duration || 900;
            function tick(now) {
                var p = Math.min(1, (now - start) / dur);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(target * eased);
                if (p < 1) { requestAnimationFrame(tick); }
            }
            requestAnimationFrame(tick);
        }

        function observeOnce(node, fn) {
            if (!('IntersectionObserver' in window)) { fn(); return; }
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        fn();
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.3 });
            io.observe(node);
        }

        /* ---- Hero stats ---- */
        var statsEl = document.getElementById('ab-stats');
        if (statsEl) {
            var topicSet = {};
            posts.forEach(function (p) {
                (p.tags || []).forEach(function (t) { topicSet[t] = true; });
            });

            var stats = [
                { target: posts.length, label: 'Essays' },
                { target: Object.keys(topicSet).length, label: 'Topics' },
                { target: 2026, label: 'Year Started' }
            ];
            statsEl.innerHTML = stats.map(function (s) {
                return '<div class="ab-stat"><div class="ab-stat-num" data-target="' + s.target + '">0</div><div class="ab-stat-label">' + s.label + '</div></div>';
            }).join('');

            observeOnce(statsEl, function () {
                Array.prototype.forEach.call(statsEl.querySelectorAll('.ab-stat-num'), function (el) {
                    countUp(el, parseInt(el.getAttribute('data-target'), 10));
                });
            });
        }

        });
})();