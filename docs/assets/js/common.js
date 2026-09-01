

(function () {
    "use strict";

    
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
            src: musicPath('스텔라장(Stella Jang) - Colors.mp3'),
            title: 'Colors',
            artist: '스텔라장(Stella Jang)',
            artwork: artPath('스텔라장(Stella Jang) - Colors.webp'),
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
        island.addEventListener('mouseenter', function () { expandIslandState(); });
        island.addEventListener('mouseleave', function () { if (!stickyLock) { collapseIslandState(); } });

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

        island.addEventListener('click', function (e) {
            var isInteractiveNode = e.target.closest('button') || e.target.closest('#sc-timeline-bar');
            if (!isInteractiveNode) {
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
