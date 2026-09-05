(function () {
    "use strict";

    document.addEventListener('DOMContentLoaded', function () {
        var posts = (window.RT_POSTS || []).slice();
        if (!posts.length) return;

        var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function escapeHtml(str) {
            return String(str).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
            });
        }

        function monthDay(dateStr) {
            var comma = dateStr.indexOf(',');
            return comma === -1 ? dateStr : dateStr.substring(0, comma);
        }

        function epochOf(dateStr) { return new Date(dateStr).getTime() || 0; }

        function countUp(el, target, duration) {
            if (reduced) { el.textContent = target; return; }
            var start = performance.now();
            var dur = duration || 700;
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

        var topicCount = {};
        posts.forEach(function (p) {
            (p.tags || []).forEach(function (t) { topicCount[t] = true; });
        });

        /* ---- Hero sentence: "— 8 essays, across 5 topics." ---- */
        var countEl = document.getElementById('arc-count');
        if (countEl) {
            var nEssays = posts.length;
            var nTopics = Object.keys(topicCount).length;
            var suffix = nEssays === 1 ? ' essay' : ' essays';
            var wrapped = '<em class="arc-em">' + nEssays + '</em>' + suffix + ', across ' +
                          '<em class="arc-em">' + nTopics + '</em> ' + (nTopics === 1 ? 'topic' : 'topics') + '.';
            if (reduced) { countEl.innerHTML = ' &mdash; ' + wrapped; }
            else {
                countEl.innerHTML = ' &mdash; <em class="arc-em" data-count="' + nEssays + '">0</em>' + suffix +
                                    ', across <em class="arc-em" data-count="' + nTopics + '">0</em> ' +
                                    (nTopics === 1 ? 'topic' : 'topics') + '.';
                observeOnce(countEl, function () {
                    Array.prototype.forEach.call(countEl.querySelectorAll('[data-count]'), function (el) {
                        countUp(el, parseInt(el.getAttribute('data-count'), 10));
                    });
                });
            }
        }

        /* ---- Index: a single quiet list, newest first ---- */
        var indexEl = document.getElementById('arc-index');
        if (!indexEl) return;

        function tagsLine(post) {
            var tags = (post.tags || []).slice().map(function (t) { return t.toLowerCase(); });
            var line = tags.join(' &middot; ');
            return post.featured
                ? '<span class="arc-featured">Featured</span> &middot; ' + line
                : line;
        }

        function item(post) {
            return '<article class="arc-item rt-focus">' +
                        '<a class="arc-link" href="' + escapeHtml(post.url) + '">' +
                            '<time class="arc-date">' + escapeHtml(monthDay(post.date)) + '</time>' +
                            '<div class="arc-body">' +
                                '<h3 class="arc-item-title">' + escapeHtml(post.title) + '</h3>' +
                                '<p class="arc-item-desc">' + escapeHtml(post.description) + '</p>' +
                                '<p class="arc-tags">' + tagsLine(post) + '</p>' +
                            '</div>' +
                        '</a>' +
                    '</article>';
        }

        var sorted = posts.slice().sort(function (a, b) { return epochOf(b.date) - epochOf(a.date); });
        indexEl.innerHTML = sorted.map(item).join('');
    });
})();