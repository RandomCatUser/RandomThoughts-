

(function () {
    "use strict";

    var pagePath = window.location.pathname;
    var inPostsDir = pagePath.indexOf('/posts/') !== -1;
    var base = inPostsDir ? '../' : '';
    var homeLink = base + 'index.html';

    var fileName = (pagePath.split('/').pop() || '').toLowerCase();
    var isArchive = fileName.indexOf('archive') === 0;
    var isAbout = fileName.indexOf('about') === 0;
    var clsHome = (!isArchive && !isAbout) ? ' active' : '';
    var clsArchive = isArchive ? ' active' : '';
    var clsAbout = isAbout ? ' active' : '';

    /* ---- Post index (single source of truth, powers the Spotlight search) ---- */
    window.RT_POSTS = [
        {
            id: "wheniflytowardsyou",
            title: "When I Fly Towards You",
            description: "A heartfelt reflection on the warmth, chemistry, and emotional comfort of one of the best youth romances I've ever watched.",
            cover: "https://occ-0-2794-2218.1.nflxso.net/dnm/api/v6/6AYY37jfdO6hpXcMjf9Yu5cnmO0/AAAABT4ETtLZRm8s_WTQF-oNsrvG95fSBE1zqruP5pXje3BwtRh46HYAa5qs8EVrPiZ7UaQGrfWCptD_LNNVOwLb8nhePUFAHpOfUQuM.jpg?r=64c",
            coverAlt: "Television in a cozy living room",
            tags: ["Drama"],
            date: "Aug 31, 2026",
            url: "posts/wheniflytowardsyou.html",
            featured: true,
            contributors: [
                { name: "Dihan Ramanayaka", photo: "https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true" }
            ]
        },
        {
            id: "tryingchinese",
            title: "Chinese apps are better kinda,",
            description: "Exploring a different digital world which people who live in china uses every day, by having a moment.",
            cover: "./posts/assets/china.jpg",
            coverAlt: "Chinese apps are better kinda",
            tags: ["Tech"],
            date: "Jun 19, 2026",
            url: "posts/tryingchinese.html",
            featured: false,
            contributors: [
                { name: "Dihan Ramanayaka", photo: "https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true" }
            ]
        },
        {
            id: "myuniversegotsmaler",
            title: "Friends Come and Go",
            description: "Reflecting on the quiet heartbreaks and the lessons learned from friendships that didn't last.",
            cover: "https://images.pexels.com/photos/29239853/pexels-photo-29239853.jpeg?cs=srgb&dl=pexels-christina99999-29239853.jpg&fm=jpg",
            coverAlt: "Friends Come and Go",
            tags: ["Life"],
            date: "Jul 19, 2026",
            url: "posts/Myuniversegotsmaler.html",
            featured: false,
            contributors: [
                { name: "Dihan Ramanayaka", photo: "https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true" }
            ]
        },
        {
            id: "itsjustcode",
            title: "It's Just Code: The Rapid Growth of Linux",
            description: "From niche hobbyist playground to the engine of the modern internet, here is why Linux is having a moment.",
            cover: "https://i.redd.it/my-arch-linux-hyprland-v0-ajth8fjmorfc1.png?width=1920&format=png&auto=webp&s=8239e0a95e448a693a240f6929c1d2aa936ee1d9",
            coverAlt: "It's Just Code: The Rapid Growth of Linux",
            tags: ["Tech"],
            date: "Jun 18, 2026",
            url: "posts/Itsjustcode.html",
            featured: false,
            contributors: [
                { name: "Dihan Ramanayaka", photo: "https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true" }
            ]
        },
        {
            id: "yoeshi",
            title: "Yoeshi OS — Reimagining the Web as an OS",
            description: "Turning browser tabs into an advanture.",
            cover: "posts/assets/yoeshi.png",
            coverAlt: "Yoeshi OS",
            tags: ["Projects"],
            date: "Jun 18, 2026",
            url: "posts/yoeshi.html",
            featured: false,
            contributors: [
                { name: "Dihan Ramanayaka", photo: "https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true" }
            ]
        },
        {
            id: "meowkitties",
            title: "I might be a cat",
            description: "Why cats feel deeply relatable to me and make me feel warmer and my perspective about cats and how they are deeply related to me.",
            cover: "posts/assets/post1.jpg",
            coverAlt: "I might be a cat",
            tags: ["Life"],
            date: "May 25, 2026",
            url: "posts/MeowKitties.html",
            featured: false,
            contributors: [
                { name: "Dihan Ramanayaka", photo: "https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true" }
            ]
        },
        {
            id: "whysrilankaneducationsystemsucks",
            title: "Why Sri Lankan education system feels broken",
            description: "Exploring the challenges and shortcomings of the Sri Lankan education system and its impact on students.",
            cover: "posts/assets/post2.avif",
            coverAlt: "Why Sri Lankan education system feels broken",
            tags: ["Education"],
            date: "May 25, 2026",
            url: "posts/WhySrilankanEducationSystemSucks.html",
            featured: false,
            contributors: [
                { name: "Dihan Ramanayaka", photo: "https://github.com/RandomCatUser/RandomCatUser/blob/main/workflows/MyProfile.webp?raw=true" }
            ]
        }
    ];

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    var themeSwitchHtml =
        '<label class="switch ml-1 scale-90 origin-center" title="Toggle dark / light">' +
            '<input id="input" type="checkbox" checked="checked" />' +
            '<div class="slider round">' +
                '<div class="sun-moon">' +
                    '<svg id="moon-dot-1" class="moon-dot" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="moon-dot-2" class="moon-dot" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="moon-dot-3" class="moon-dot" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="light-ray-1" class="light-ray" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="light-ray-2" class="light-ray" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="light-ray-3" class="light-ray" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="cloud-1" class="cloud-dark" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="cloud-2" class="cloud-dark" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="cloud-3" class="cloud-dark" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="cloud-4" class="cloud-light" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="cloud-5" class="cloud-light" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                    '<svg id="cloud-6" class="cloud-light" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50"></circle></svg>' +
                '</div>' +
                '<div class="stars">' +
                    '<svg id="star-1" class="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10,10 10 ,0 10 Z"></path></svg>' +
                    '<svg id="star-2" class="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10,10 10 ,0 10 Z"></path></svg>' +
                    '<svg id="star-3" class="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10,10 10 ,0 10 Z"></path></svg>' +
                    '<svg id="star-4" class="star" viewBox="0 0 20 20"><path d="M 0 10 C 10 10,10 10 ,0 10 C 10 10 , 10 10 , 10 20 C 10 10 , 10 10 , 20 10 C 10 10,10 10 ,0 10 Z"></path></svg>' +
                '</div>' +
            '</div>' +
        '</label>';

    var settingsHtml =
        '<div class="rt-settings">' +
            '<button type="button" id="sc-settings-toggle" class="rt-settings-toggle rt-focus" title="Settings" aria-label="Settings"><i class="fa-solid fa-sliders"></i></button>' +
            '<div class="rt-settings-dropdown">' +
                '<div class="rt-settings-head"><i class="fa-solid fa-sliders"></i> Settings</div>' +
                '<div class="rt-setting-row">' +
                    '<span class="rt-setting-label"><i class="fa-solid fa-microphone"></i> Voice Tracks</span>' +
                    '<label class="rt-toggle"><input id="voice-toggle-input" type="checkbox" /><span class="rt-toggle-slider"></span></label>' +
                '</div>' +
                '<div class="rt-setting-row">' +
                    '<span class="rt-setting-label"><i class="fa-solid fa-music"></i> Show Player</span>' +
                    '<label class="rt-toggle"><input id="player-toggle-input" type="checkbox" checked /><span class="rt-toggle-slider"></span></label>' +
                '</div>' +
            '</div>' +
        '</div>';

    var searchBtnHtml =
        '<button type="button" id="rt-search-toggle" class="lt-icon-btn" title="Search (Ctrl+K)" aria-label="Search"><i class="fa-solid fa-magnifying-glass"></i></button>';

    var spotlightHtml =
        '<div id="rt-spotlight" class="rt-spotlight">' +
            '<div class="rt-spotlight-backdrop" data-spotlight-close></div>' +
            '<div class="rt-spotlight-panel" role="search" aria-modal="true" aria-label="Search posts">' +
                '<div class="rt-spotlight-input-row">' +
                    '<i class="fa-solid fa-magnifying-glass rt-spotlight-icon"></i>' +
                    '<input id="rt-spotlight-input" class="rt-spotlight-input" type="text" autocomplete="off" spellcheck="false" placeholder="Search essays\u2026" aria-label="Search essays">' +
                    '<kbd class="rt-spotlight-esc">esc</kbd>' +
                '</div>' +
                '<div class="rt-spotlight-hint">Start typing to search essays\u2026</div>' +
                '<div id="rt-spotlight-results" class="rt-spotlight-results"></div>' +
            '</div>' +
        '</div>';

    var navHtml =
        '<nav class="lt-nav">' +
            '<div class="mx-auto max-w-[1180px] px-5 md:px-8">' +
                '<div class="h-16 flex items-center justify-between gap-4">' +
                    '<a href="' + homeLink + '" class="lt-logo shrink-0">' +
                        '<span class="lt-logo-word">Random Thoughts</span>' +
                    '</a>' +
                    '<div class="lt-nav-links">' +
                        '<a href="' + homeLink + '" class="lt-nav-link' + clsHome + '">Home</a>' +
                        '<a href="' + base + 'archive.html" class="lt-nav-link' + clsArchive + '">Archive</a>' +
                        '<a href="' + base + 'about.html" class="lt-nav-link' + clsAbout + '">About</a>' +
                    '</div>' +
                    '<div class="lt-ctrls">' +
                        searchBtnHtml +
                        themeSwitchHtml +
                        settingsHtml +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</nav>';

    var topbarHtml =
        '<div class="lt-topbar">' +
            '<button type="button" id="rt-back-btn" class="lt-icon-btn lt-back-btn" title="Go back" aria-label="Go back"><i class="fa-solid fa-arrow-left"></i></button>' +
            '<div class="lt-ctrls">' +
                searchBtnHtml +
                themeSwitchHtml +
                settingsHtml +
            '</div>' +
        '</div>';

    var headerHtml = inPostsDir ? topbarHtml : navHtml;

    var footerHtml =
        '<div class="mx-auto max-w-[1180px] px-5 md:px-8 py-10 flex items-center justify-center">' +
            '<p class="lt-footer-kr">끝에 도달하셨습니다.</p>' +
        '</div>';

    var playerHtml =
        '<div id="sc-dynamic-island" class="sc-dynamic-island collapsed">' +
            '<div class="sc-view-wrapper">' +
                '<div class="sc-compact-layout">' +
                    '<div id="sc-compact-art" class="sc-compact-art">&#9834;</div>' +
                    '<div id="sc-compact-eq" class="sc-compact-eq"><span></span><span></span><span></span></div>' +
                '</div>' +
                '<div class="sc-expanded-layout">' +
                    '<div class="sc-meta-header">' +
                        '<div id="sc-expanded-art" class="sc-expanded-art">&#9834;</div>' +
                        '<div class="sc-track-details">' +
                            '<div class="sc-title-group">' +
                                '<h4 id="sc-expanded-title" class="sc-track-title">Loading...</h4>' +
                                '<canvas id="sc-wave-canvas" class="sc-wave-canvas" width="120" height="36"></canvas>' +
                            '</div>' +
                            '<p id="sc-expanded-artist" class="sc-track-artist">Parsing Tags...</p>' +
                        '</div>' +
                    '</div>' +
                    '<div class="sc-timeline-group">' +
                        '<div id="sc-timeline-bar" class="sc-timeline-bar-bg">' +
                            '<div id="sc-timeline-fill" class="sc-timeline-fill"></div>' +
                            '<div id="sc-timeline-handle" class="sc-timeline-handle"></div>' +
                        '</div>' +
                        '<div class="sc-time-labels">' +
                            '<span id="sc-time-curr">0:00</span>' +
                            '<span id="sc-time-rem">-0:00</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="sc-controls-row">' +
                        '<div class="sc-branding"><i class="fa-solid fa-compact-disc"></i><span>MUSIC LIBRARY</span></div>' +
                        '<div class="sc-playback-group">' +
                            '<button id="sc-btn-prev" class="sc-btn" title="Previous Track"><i class="fa-solid fa-backward-step"></i></button>' +
                            '<button id="sc-btn-play" class="sc-btn sc-btn-play" title="Play/Pause"><i id="sc-play-icon" class="fa-solid fa-play" style="margin-left: 2px;"></i></button>' +
                            '<button id="sc-btn-next" class="sc-btn" title="Next Track"><i class="fa-solid fa-forward-step"></i></button>' +
                            '<button id="sc-btn-repeat" class="sc-btn sc-btn-repeat" title="Toggle Repeat"><i class="fa-solid fa-repeat"></i></button>' +
                        '</div>' +
                        '<button id="sc-btn-lock" class="sc-btn sc-btn-lock" title="Keep Panel Expanded"><i class="fa-solid fa-thumbtack"></i></button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    function renderShell() {
        var headerSlot = document.getElementById('site-header');
        var footerSlot = document.getElementById('site-footer');
        var playerSlot = document.getElementById('sc-player');

        if (headerSlot) headerSlot.innerHTML = headerHtml;
        if (footerSlot) footerSlot.innerHTML = footerHtml;
        if (playerSlot) playerSlot.innerHTML = playerHtml;

        var spotlightHost = document.getElementById('rt-spotlight-host');
        if (spotlightHost) { spotlightHost.innerHTML = spotlightHtml; }
        else if (footerSlot) {
            footerSlot.insertAdjacentHTML('beforebegin', spotlightHtml);
        }

        /* Slim top bar back button */
        var backBtn = document.getElementById('rt-back-btn');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = homeLink;
                }
            });
        }

        initSpotlight();
    }

    function initSpotlight() {
        var toggleBtn = document.getElementById('rt-search-toggle');
        var spotlight = document.getElementById('rt-spotlight');
        if (!toggleBtn || !spotlight) return;

        var input = document.getElementById('rt-spotlight-input');
        var results = document.getElementById('rt-spotlight-results');
        var hint = spotlight.querySelector('.rt-spotlight-hint');
        var postList = (window.RT_POSTS || []).slice();
        var highlighted = -1;

        function contributorNames(contributors) {
            if (!contributors || !contributors.length) return '';
            return contributors.map(function (c) { return c.name; }).join(', ');
        }

        function openSpotlight() {
            spotlight.classList.add('is-open');
            document.body.classList.add('rt-spotlight-open');
            if (input) setTimeout(function () { input.focus(); }, 60);
        }
        function closeSpotlight() {
            spotlight.classList.remove('is-open');
            document.body.classList.remove('rt-spotlight-open');
        }

        /* Backdrop click-to-close via data attribute */
        var backdrop = spotlight.querySelector('[data-spotlight-close]');
        if (backdrop) backdrop.addEventListener('click', closeSpotlight);

        toggleBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            if (spotlight.classList.contains('is-open')) closeSpotlight();
            else openSpotlight();
        });

        function renderResults(query) {
            var q = (query || '').trim().toLowerCase();
            if (!q) {
                highlight(-1);
                if (hint) hint.style.display = '';
                results.innerHTML = '';
                return;
            }
            if (hint) hint.style.display = 'none';

            var matched = postList.filter(function (p) {
                var hay = (p.title + ' ' + p.description + ' ' + (p.tags || []).join(' ') + ' ' + p.date).toLowerCase();
                return hay.indexOf(q) !== -1;
            });

            if (!matched.length) {
                results.innerHTML = '<div class="rt-spotlight-empty">No essays found for &ldquo;<b>' + escapeHtml(query) + '</b>&rdquo;</div>';
                highlight(-1);
                return;
            }

            var out = matched.map(function (p, i) {
                var tags = (p.tags || []).map(function (t) {
                    return '<span class="lt-tag">' + escapeHtml(t) + '</span>';
                }).join('&nbsp;&middot;&nbsp;');
                var name = contributorNames(p.contributors) || 'Dihan Ramanayaka';
                var dst = base + p.url;
                var thumb = p.cover.indexOf('posts/') === 0 ? base + p.cover : p.cover;
                return '<a class="rt-spotlight-item" href="' + escapeHtml(dst) + '" data-idx="' + i + '">' +
                        '<div class="rt-spotlight-item-thumb" style="background-image:url(\'' + escapeHtml(thumb) + '\')"></div>' +
                        '<div class="rt-spotlight-item-main">' +
                            '<div class="rt-spotlight-item-title">' + escapeHtml(p.title) + '</div>' +
                            '<div class="rt-spotlight-item-desc">' + escapeHtml(p.description) + '</div>' +
                            '<div class="rt-spotlight-item-meta">' +
                                '<span>' + escapeHtml(p.date) + '</span>' +
                                '<span>' + escapeHtml(name) + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<span class="rt-spotlight-item-tags">' + tags + '</span>' +
                    '</a>';
            }).join('');

            results.innerHTML = out;
            highlight(0);

            Array.prototype.forEach.call(results.querySelectorAll('.rt-spotlight-item'), function (el) {
                el.addEventListener('mousemove', function () {
                    highlight(parseInt(el.getAttribute('data-idx'), 10));
                });
            });
        }

        function highlight(idx) {
            highlighted = idx;
            Array.prototype.forEach.call(results.querySelectorAll('.rt-spotlight-item'), function (el) {
                var i = parseInt(el.getAttribute('data-idx'), 10);
                el.classList.toggle('active', i === idx);
            });
        }

        if (input) {
            input.addEventListener('input', function () { renderResults(input.value); });
            input.addEventListener('keydown', function (e) {
                var items = results.querySelectorAll('.rt-spotlight-item');
                if (e.key === 'ArrowDown') { e.preventDefault(); highlight(Math.min(highlighted + 1, items.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(Math.max(highlighted - 1, 0)); }
                else if (e.key === 'Enter') {
                    var active = results.querySelector('.rt-spotlight-item.active');
                    if (active) window.location.href = active.getAttribute('href');
                } else if (e.key === 'Escape') {
                    closeSpotlight();
                }
            });

            /* Keydown just handled Escape for the input; a global handler covers it
               when focus is elsewhere (e.g. after clicking a result area). */
        }

        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                openSpotlight();
            } else if (e.key === 'Escape') {
                if (spotlight.classList.contains('is-open')) closeSpotlight();
            }
        });
    }

    renderShell();

    var THEME_KEY = "rt-theme";

    function applyTheme(theme) {
        if (theme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        } else {
            document.documentElement.setAttribute("data-theme", "light");
        }
        var toggle = document.getElementById("input");
        if (toggle) {
            toggle.checked = theme === "dark";
        }
    }

    function initTheme() {
        var saved = null;
        try {
            saved = localStorage.getItem(THEME_KEY);
        } catch (e) { saved = null; }
        var theme = saved === "dark"
            ? "dark"
            : (saved === "light" ? "light" : "dark");
        applyTheme(theme);

        var toggle = document.getElementById("input");
        if (toggle) {
            toggle.addEventListener("change", function () {
                var next = toggle.checked ? "dark" : "light";
                applyTheme(next);
                try {
                    localStorage.setItem(THEME_KEY, next);
                } catch (e) { /* ignore */ }
            });
        }
    }

 
    var assetBase = "";
    var allScripts = document.getElementsByTagName('script');
    for (var si = 0; si < allScripts.length; si++) {
        var srcText = allScripts[si].src || "";
        var marker = srcText.indexOf("assets/js/common.js");
        if (marker !== -1) {
            assetBase = srcText.substring(0, marker);
            break;
        }
    }
    var musicDir = assetBase + "assets/music/";
    var artDir = assetBase + "assets/album-arts/";

    function musicPath(name) { return musicDir + name; }
    function artPath(name) { return artDir + name; }

    var localTracks = [
        {
            src: musicPath('Music1.mp3'),
            title: '3:03 PM',
            artist: 'しゃろう Sharou',
            artwork: artPath('music1.jpg'),
            voice: false
        },
        {
            src: musicPath('Fly a letter to the Wind.mp3'),
            title: 'Fly a letter to the Wind',
            artist: 'JayM',
            artwork: artPath('Fly a letter to the Wind.webp'),
            voice: false
        },
        {
            src: musicPath('心动节奏.mp3'),
            title: '心动节奏',
            artist: 'ayi',
            artwork: artPath('心动节奏.jpg'),
            voice: true
        },
        {
            src: musicPath('[음악팀] 꽃이 피면, When the flowers (AcousticHappy) [BGM무료음악브금].mp3'),
            title: 'When the Flowers',
            artist: 'TeamMusicCreative, 당신의 드라마 O.S.T',
            artwork: artPath('[음악팀] 꽃이 피면, When the flowers (AcousticHappy) [BGM무료음악브금].webp'),
            voice: false
        },
        {
            src: musicPath('楽音 (Sasane) - Mosi Mosi.mp3'),
            title: 'Mosi Mosi?',
            artist: '楽音 (Sasane)',
            artwork: artPath('楽音 (Sasane) - Mosi Mosi.webp'),
            voice: true
        }
    ];

    /* Persistence keys */
    var P_TRACK = "rt-player-track";      // current index
    var P_TIME = "rt-player-time";        // current time (ms)
    var P_PLAYING = "rt-player-playing";  // "1" / "0"
    var P_REPEAT = "rt-player-repeat";    // "1" / "0"
    var P_LOCK = "rt-player-lock";        // "1" / "0"
    var P_SHOW = "rt-player-show";        // "1" (visible) / "0" (hidden)
    var VOICE_KEY = "voice-enabled";

    function store(key, value) {
        try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }
    function load(key, fallback) {
        try {
            var v = localStorage.getItem(key);
            return v === null ? fallback : v;
        } catch (e) { return fallback; }
    }

    var currentIdx = parseInt(load(P_TRACK, "-1"), 10) || 0;
    var savedTime = parseFloat(load(P_TIME, "0")) || 0;
    var savedPlaying = load(P_PLAYING, "0") === "1";
    var repeatEnabled = load(P_REPEAT, "1") === "1";
    var stickyLock = load(P_LOCK, "0") === "1";

    var islandExpanded = false;
    var playingState = false;
    var startedRestore = false;
    var playerShown = load(P_SHOW, "1") === "1";

    var voiceEnabled = load(VOICE_KEY, "false") === "true";

    var audioPlayer = new Audio();
    try { audioPlayer.preload = "auto"; } catch (e) { /* ignore */ }

    var island = document.getElementById('sc-dynamic-island');
    var compactArt = document.getElementById('sc-compact-art');
    var compactEq = document.getElementById('sc-compact-eq');
    var expArt = document.getElementById('sc-expanded-art');
    var expTitle = document.getElementById('sc-expanded-title');
    var expArtist = document.getElementById('sc-expanded-artist');
    var waveCanvas = document.getElementById('sc-wave-canvas');

    var canvasCtx = null;
    if (waveCanvas) {
        canvasCtx = waveCanvas.getContext('2d');
    }

    var timelineBar = document.getElementById('sc-timeline-bar');
    var timelineFill = document.getElementById('sc-timeline-fill');
    var timelineHandle = document.getElementById('sc-timeline-handle');
    var labelCurr = document.getElementById('sc-time-curr');
    var labelRem = document.getElementById('sc-time-rem');

    var btnPrev = document.getElementById('sc-btn-prev');
    var btnPlay = document.getElementById('sc-btn-play');
    var btnPlayIcon = document.getElementById('sc-play-icon');
    var btnNext = document.getElementById('sc-btn-next');
    var btnRepeat = document.getElementById('sc-btn-repeat');
    var btnLock = document.getElementById('sc-btn-lock');
    var settingsToggle = document.getElementById('sc-settings-toggle');
    var settingsWrap = document.querySelector('.rt-settings');
    var playerToggle = document.getElementById('player-toggle-input');

    initTheme();
    initSettingsControls();

    if (island) {
        initPlayerEvents();
    }

    applyPlayerVisibility();

    function initPlayerEvents() {
        audioPlayer.addEventListener('play', function () {
            syncPlaybackUI(true);
            store(P_PLAYING, "1");
        });
        audioPlayer.addEventListener('pause', function () {
            syncPlaybackUI(false);
            store(P_PLAYING, "0");
        });

        audioPlayer.addEventListener('timeupdate', function () {
            if (!audioPlayer.duration) return;
            var currentPos = audioPlayer.currentTime * 1000;
            var relativePos = audioPlayer.currentTime / audioPlayer.duration;
            store(P_TIME, String(audioPlayer.currentTime * 1000));
            syncScrubberTimeline(currentPos, relativePos);
        });

        audioPlayer.addEventListener('ended', function () {
            if (repeatEnabled) {
                audioPlayer.currentTime = 0;
                audioPlayer.play()["catch"](function (err) {
                    console.warn("Browser blocked autoplay gesture:", err);
                });
            } else {
                transitionToTrack(currentIdx + 1);
            }
        });

        registerInteractionEvents();

        loadSavedState();
    }

    /* Restore which track / position / play state from previous page */
    function loadSavedState() {
        if (startedRestore) return;
        startedRestore = true;

        if (currentIdx < 0 || currentIdx >= localTracks.length) {
            currentIdx = 0;
            if (!voiceEnabled) {
                while (localTracks[currentIdx] && localTracks[currentIdx].voice && currentIdx < localTracks.length) currentIdx++;
                if (currentIdx >= localTracks.length) currentIdx = 0;
            }
        }

        /* If voice just became disabled, make sure we're not on a vocal track */
        if (!voiceEnabled) {
            while (localTracks[currentIdx] && localTracks[currentIdx].voice) {
                currentIdx++;
                if (currentIdx >= localTracks.length) currentIdx = 0;
            }
        }

        loadTrack(currentIdx, false);

        /* Restore time */
        if (savedTime > 0 && audioPlayer.duration) {
            audioPlayer.currentTime = savedTime / 1000;
        } else {
            try {
                var onLoaded = function () {
                    if (savedTime > 0 && audioPlayer.duration) {
                        audioPlayer.currentTime = savedTime / 1000;
                    }
                    audioPlayer.removeEventListener('loadedmetadata', onLoaded);
                };
                audioPlayer.addEventListener('loadedmetadata', onLoaded);
            } catch (e) { /* ignore */ }
        }

        /* Restore repeat + lock UI */
        btnRepeat.classList.toggle('active', repeatEnabled);
        btnLock.classList.toggle('locked', stickyLock);

        /* Restore playing state (music keeps playing across pages) */
        if (savedPlaying) {
            var attemptPlay = function () {
                var p = audioPlayer.play();
                if (p && p["catch"]) {
                    p["catch"](function () { /* blocked until gesture */ });
                }
            };
            if (audioPlayer.readyState >= 3) {
                attemptPlay();
            } else {
                audioPlayer.addEventListener('canplay', function once() {
                    audioPlayer.removeEventListener('canplay', once);
                    attemptPlay();
                });
            }
        }
    }

    function initSettingsControls() {
        var voiceToggle = document.getElementById('voice-toggle-input');
        if (voiceToggle) {
            voiceToggle.checked = voiceEnabled;
            voiceToggle.addEventListener('change', function () {
                voiceEnabled = voiceToggle.checked;
                store(VOICE_KEY, voiceEnabled ? "true" : "false");
                if (!voiceEnabled && localTracks[currentIdx] && localTracks[currentIdx].voice) {
                    transitionToTrack(currentIdx + 1);
                }
            });
        }
        if (settingsToggle && settingsWrap) {
            settingsToggle.addEventListener('click', function () {
                settingsWrap.classList.toggle('open');
            });
            document.addEventListener('click', function (e) {
                if (!settingsWrap.contains(e.target)) {
                    settingsWrap.classList.remove('open');
                }
            });
        }
        if (playerToggle) {
            playerToggle.addEventListener('change', function () {
                var show = playerToggle.checked;
                store(P_SHOW, show ? "1" : "0");
                setPlayerVisible(show);
            });
        }
    }

    function setPlayerVisible(show) {
        playerShown = show;
        if (!island) return;
        if (show) {
            island.classList.remove('sc-hidden');
        } else {
            island.classList.add('sc-hidden');
        }
    }

    function applyPlayerVisibility() {
        setPlayerVisible(playerShown);
        if (playerToggle) playerToggle.checked = playerShown;
    }

    function extractMetadata(filePath, callback) {
        if (typeof jsmediatags === 'undefined') { fallbackMetadata(filePath, callback); return; }
        var absoluteUrl = new URL(filePath, window.location.href).href;
        jsmediatags.read(absoluteUrl, {
            onSuccess: function (tag) {
                var tags = tag.tags;
                var title = tags.title || getFilenameWithoutExtension(filePath);
                var artist = tags.artist || "Local Artist";
                var artwork = null;
                if (tags.picture) {
                    var pic = tags.picture;
                    var base64String = "";
                    for (var i = 0; i < pic.data.length; i++) { base64String += String.fromCharCode(pic.data[i]); }
                    artwork = "data:" + pic.format + ";base64," + window.btoa(base64String);
                }
                callback({ title: title, artist: artist, artwork: artwork });
            },
            onError: function () { fallbackMetadata(filePath, callback); }
        });
    }

    function fallbackMetadata(filePath, callback) {
        var cleanName = getFilenameWithoutExtension(filePath);
        var parts = cleanName.split(' - ');
        var artist = "Local Library";
        var title = cleanName;
        if (parts.length > 1) { artist = parts[0].replace(/-/g, ' ').toUpperCase(); title = parts.slice(1).join(' - '); }
        callback({ title: title, artist: artist, artwork: null });
    }

    function getFilenameWithoutExtension(path) {
        var parts = path.split('/');
        var file = parts[parts.length - 1];
        return decodeURIComponent(file.substring(0, file.lastIndexOf('.')) || file);
    }

    function loadTrack(idx, triggerPlay) {
        var track = localTracks[idx] || localTracks[0];
        var trackPath = (track && track.src) || '';
        audioPlayer.src = trackPath;
        audioPlayer.load();

        store(P_TRACK, String(idx));

        expTitle.textContent = "Loading...";
        expArtist.textContent = "Parsing Tags...";
        compactArt.textContent = "♪";
        compactArt.style.backgroundImage = "";
        expArt.textContent = "♪";
        expArt.style.backgroundImage = "";

        var title = (track && track.title) || getFilenameWithoutExtension(trackPath) || 'Unknown Track';
        var artist = (track && track.artist) || 'Local Artist';
        var artwork = (track && track.artwork) || (musicDir + 'art1.jpg');

        expTitle.textContent = title;
        expArtist.textContent = artist;
        compactArt.style.backgroundImage = "url('" + artwork + "')";
        compactArt.textContent = '';
        expArt.style.backgroundImage = "url('" + artwork + "')";
        expArt.textContent = '';

        if (!track || !track.title || !track.artist || !track.artwork) {
            extractMetadata(trackPath, function (data) {
                var resolvedTitle = data.title || title;
                var resolvedArtist = data.artist || artist;
                var resolvedArtwork = data.artwork || artwork;
                expTitle.textContent = resolvedTitle;
                expArtist.textContent = resolvedArtist;
                compactArt.style.backgroundImage = "url('" + resolvedArtwork + "')";
                expArt.style.backgroundImage = "url('" + resolvedArtwork + "')";
            });
        }

        if (triggerPlay) {
            audioPlayer.play()["catch"](function (err) {
                console.warn("Browser blocked autoplay gesture:", err);
            });
        }
    }

    function registerInteractionEvents() {
        /* On touch devices hover events are synthesized from taps and would
           double-toggle the panel (expand on mouseenter, then collapse on the
           tap), making it feel "hard to open". Disable hover-based state
           changes when the pointer is primarily touch. */
        var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
        if (finePointer) {
            island.addEventListener('mouseenter', function () { expandIslandState(); });
            island.addEventListener('mouseleave', function () { if (!stickyLock) { collapseIslandState(); } });
        }

        btnLock.addEventListener('click', function (e) {
            e.stopPropagation();
            stickyLock = !stickyLock;
            btnLock.classList.toggle('locked', stickyLock);
            store(P_LOCK, stickyLock ? "1" : "0");
            if (!stickyLock) { collapseIslandState(); }
        });

        btnPlay.addEventListener('click', function (e) { e.stopPropagation(); toggleAudioPlayback(); });
        btnPrev.addEventListener('click', function (e) { e.stopPropagation(); transitionToTrack(currentIdx - 1); });
        btnNext.addEventListener('click', function (e) { e.stopPropagation(); transitionToTrack(currentIdx + 1); });
        btnRepeat.addEventListener('click', function (e) {
            e.stopPropagation();
            repeatEnabled = !repeatEnabled;
            btnRepeat.classList.toggle('active', repeatEnabled);
            store(P_REPEAT, repeatEnabled ? "1" : "0");
        });

        timelineBar.addEventListener('click', function (e) {
            e.stopPropagation();
            if (!audioPlayer.duration) return;
            var bounds = timelineBar.getBoundingClientRect();
            var touchX = e.clientX - bounds.left;
            var progressPercent = Math.max(0, Math.min(1, touchX / bounds.width));
            audioPlayer.currentTime = audioPlayer.duration * progressPercent;
            store(P_TIME, String(audioPlayer.currentTime * 1000));
        });

        /* On touch devices mouseenter/mouseleave don't apply — treat a tap on
           the island (outside its buttons) as the toggle. A short debounce
           prevents re-triggering while the size transition is still in-flight. */
        var lastToggle = 0;
        var TRANSITION_MS = 520;

        function toggleIsland() {
            var now = Date.now();
            if (now - lastToggle < TRANSITION_MS) return;
            lastToggle = now;
            if (islandExpanded) {
                stickyLock = false;
                btnLock.classList.remove('locked');
                store(P_LOCK, "0");
                collapseIslandState();
            } else {
                stickyLock = true;
                btnLock.classList.add('locked');
                store(P_LOCK, "1");
                expandIslandState();
            }
        }

        island.addEventListener('click', function (e) {
            var isInteractiveNode = e.target.closest('button') || e.target.closest('#sc-timeline-bar');
            if (!isInteractiveNode) {
                toggleIsland();
            }
        });

        /* Mobile reliability: a light tap toggles the panel even if the browser
           is slow to synthesize a `click` after the pointer is lifted. */
        island.addEventListener('pointerup', function (e) {
            var isInteractiveNode = e.target.closest('button') || e.target.closest('#sc-timeline-bar');
            if (isInteractiveNode) return;
            if (e.pointerType === 'mouse') return; /* desktop hover path */
            toggleIsland();
        });
    }

    function syncPlaybackUI(isPlaying) {
        playingState = isPlaying;
        if (isPlaying) {
            btnPlayIcon.className = "fa-solid fa-pause";
            compactEq.classList.add('active');
            if (!islandExpanded) { island.className = "sc-dynamic-island compact"; }
        } else {
            btnPlayIcon.className = "fa-solid fa-play";
            btnPlayIcon.style.marginLeft = "2px";
            compactEq.classList.remove('active');
            if (!islandExpanded) { island.className = "sc-dynamic-island collapsed"; }
        }
    }

    function toggleAudioPlayback() {
        if (audioPlayer.paused) {
            audioPlayer.play()["catch"](function (e) { console.log(e); });
        } else {
            audioPlayer.pause();
        }
    }

    function transitionToTrack(targetIdx) {
        if (targetIdx < 0) targetIdx = localTracks.length - 1;
        if (targetIdx >= localTracks.length) targetIdx = 0;

        if (!voiceEnabled) {
            var attempts = 0;
            while (localTracks[targetIdx] && localTracks[targetIdx].voice && attempts < localTracks.length) {
                targetIdx++;
                if (targetIdx >= localTracks.length) targetIdx = 0;
                attempts++;
            }
        }

        currentIdx = targetIdx;
        loadTrack(currentIdx, true);
        store(P_TIME, "0");
    }

    function processMsToLabel(ms) {
        if (isNaN(ms) || ms < 0) return "0:00";
        var totalSecs = Math.floor(ms / 1000);
        var minutes = Math.floor(totalSecs / 60);
        var seconds = totalSecs % 60;
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }

    function syncScrubberTimeline(currPosition, relPosition) {
        var percentValue = (relPosition * 100).toFixed(2);
        timelineFill.style.width = percentValue + "%";
        timelineHandle.style.left = percentValue + "%";
        labelCurr.textContent = processMsToLabel(currPosition);
        if (audioPlayer.duration) {
            var trackDur = audioPlayer.duration * 1000;
            var remMs = trackDur - currPosition;
            labelRem.textContent = "-" + processMsToLabel(remMs);
        } else {
            labelRem.textContent = "-0:00";
        }
    }

    function expandIslandState() {
        islandExpanded = true;
        island.className = "sc-dynamic-island expanded";
    }

    function collapseIslandState() {
        islandExpanded = false;
        if (playingState) { island.className = "sc-dynamic-island compact"; }
        else { island.className = "sc-dynamic-island collapsed"; }
    }

    /* Save precise playback position right before leaving the page,
       so switching pages resumes from exactly where we stopped. */
    window.addEventListener('beforeunload', function () {
        if (audioPlayer && !audioPlayer.paused) {
            store(P_TIME, String(audioPlayer.currentTime * 1000));
            store(P_PLAYING, "1");
        }
    });

    function drawRealTimeAudioWaves() {
        if (!canvasCtx) return;
        canvasCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
        var columnBars = 14;
        var barWidth = 4;
        var barGap = 3;
        var horizontalOffset = (waveCanvas.width - (columnBars * (barWidth + barGap))) / 2;
        canvasCtx.fillStyle = '#ff9f43';
        for (var i = 0; i < columnBars; i++) {
            var blockHeight;
            if (playingState) {
                blockHeight = Math.abs(Math.sin(Date.now() * 0.006 + i * 0.4) * Math.cos(Date.now() * 0.003 + i * 0.15)) * (waveCanvas.height - 6) + 4;
            } else {
                blockHeight = 4 + Math.sin(Date.now() * 0.0015 + i * 0.8) * 1.5;
            }
            var positionX = horizontalOffset + i * (barWidth + barGap);
            var positionY = (waveCanvas.height - blockHeight) / 2;
            canvasCtx.beginPath();
            if (canvasCtx.roundRect) {
                canvasCtx.roundRect(positionX, positionY, barWidth, blockHeight, 1.5);
            } else {
                canvasCtx.rect(positionX, positionY, barWidth, blockHeight);
            }
            canvasCtx.fill();
        }
        requestAnimationFrame(drawRealTimeAudioWaves);
    }

    if (island) {
        drawRealTimeAudioWaves();
    }
})();
