var CONFIG = {{CONFIG}};
CONFIG.animation = {
    fishEmojis: ['🐠', '🐡', '🦈', '🐬', '🐳', '🐋', '🦑', '🐙', '🦐', '🦞', '🦀', '🐚'],
    lightRayCount: 8,
    bubbleInterval: 800,
    bubbleInitialCount: 10
};

var cursor = $('cursor'), cursorDot = $('cursorDot'), glowOrb = $('glowOrb'), fish = $('fish'), ocean = $('ocean');

function initLightRays() {
    for (var i = 0; i < CONFIG.animation.lightRayCount; i++) {
        var ray = document.createElement('div');
        ray.className = 'light-ray';
        ray.style.cssText = 'left:' + (10 + i * 12) + '%;animation-delay:' + (i * 0.5) + 's;opacity:' + (0.1 + Math.random() * 0.1);
        ocean.appendChild(ray);
    }
}

function createBubble() {
    var bubble = document.createElement('div');
    bubble.className = 'bubble';
    var size = 5 + Math.random() * 25;
    bubble.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (Math.random()*100) + '%;bottom:-30px;animation-duration:' + (5+Math.random()*10) + 's';
    document.body.appendChild(bubble);
    setTimeout(function() { bubble.remove(); }, 15000);
}

function initBubbles() {
    setInterval(createBubble, CONFIG.animation.bubbleInterval);
    for (var i = 0; i < CONFIG.animation.bubbleInitialCount; i++) setTimeout(createBubble, i * 200);
}

function initAnnouncements() {
    var list = $('announcementList');
    CONFIG.announcements.forEach(function(item) {
        list.innerHTML += '<div class="announcement-item"><div class="announcement-date">' + item.date + '</div><div class="announcement-content">' + item.content + '<span class="announcement-tag">' + item.tag + '</span></div></div>';
    });
}

function initCursor() {
    document.addEventListener('mousemove', function(e) {
        [cursor, cursorDot, glowOrb].forEach(function(el) { el.style.left = e.clientX + 'px'; el.style.top = e.clientY + 'px'; });
    });
    document.addEventListener('mousedown', function() { cursor.style.transform = 'translate(-50%, -50%) scale(0.8)'; });
    document.addEventListener('mouseup', function() { cursor.style.transform = 'translate(-50%, -50%) scale(1)'; });
}

function createRipple(x, y) {
    var ripple = document.createElement('div');
    ripple.className = 'ripple';
    ripple.style.cssText = 'left:' + (x - 75) + 'px;top:' + (y - 75) + 'px';
    document.body.appendChild(ripple);
    setTimeout(function() { ripple.remove(); }, 1000);
}

function createParticles(x, y, count) {
    count = count || 8;
    for (var i = 0; i < count; i++) {
        var particle = document.createElement('div');
        particle.className = 'particle';
        var angle = (i / count) * Math.PI * 2, distance = 30 + Math.random() * 30;
        particle.style.cssText = 'left:' + (x + Math.cos(angle) * distance) + 'px;top:' + (y + Math.sin(angle) * distance) + 'px';
        document.body.appendChild(particle);
        setTimeout(function() { particle.remove(); }, 1000);
    }
}

function initFishInteraction() {
    var fishY = 0;
    fish.addEventListener('click', function(e) {
        e.stopPropagation();
        var rect = fish.getBoundingClientRect();
        var cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
        createParticles(cx, cy, 12);
        var hiddenFish = document.createElement('div');
        hiddenFish.className = 'hidden-fish';
        hiddenFish.textContent = CONFIG.animation.fishEmojis[Math.floor(Math.random() * CONFIG.animation.fishEmojis.length)];
        hiddenFish.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;--tx:' + ((Math.random() - 0.5) * 400) + 'px;--ty:' + ((Math.random() - 0.5) * 400) + 'px;--tr:' + ((Math.random() - 0.5) * 360) + 'deg';
        document.body.appendChild(hiddenFish);
        requestAnimationFrame(function() { hiddenFish.classList.add('show'); });
        setTimeout(function() { hiddenFish.remove(); }, 3000);
        fish.textContent = CONFIG.animation.fishEmojis[Math.floor(Math.random() * CONFIG.animation.fishEmojis.length)];
    });
    document.addEventListener('wheel', function(e) {
        fishY = Math.max(-100, Math.min(100, fishY + e.deltaY * 0.5));
        fish.parentElement.style.transform = 'translate(-50%, calc(-50% + ' + fishY + 'px))';
    });
}

function closeAllPanels() {
    document.querySelectorAll('.panel.show').forEach(function(panel) { panel.classList.remove('show'); });
    document.querySelectorAll('.nav-btn.active').forEach(function(btn) { btn.classList.remove('active'); });
}

function togglePanel(toggleBtn, panel, onOpen, onClose) {
    var closePanel = function() {
        if (!panel.classList.contains('show')) return;
        panel.classList.remove('show');
        toggleBtn.classList.remove('active');
        if (onClose) onClose();
    };
    toggleBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (panel.classList.contains('show')) {
            closePanel();
        } else {
            closeAllPanels();
            panel.classList.add('show');
            toggleBtn.classList.add('active');
            if (onOpen) onOpen();
        }
    });
    panel.addEventListener('click', function(e) { e.stopPropagation(); });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && panel.classList.contains('show')) closePanel();
    });
    return closePanel;
}

function initClickOutsideToClose() {
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-btn') && !e.target.closest('.panel')) {
            closeAllPanels();
        }
    });
}

function initAnnouncementBadge() {
    var badge = $('announcementBadge');
    var lastViewedKey = 'announcementLastViewed';
    var latestDate = CONFIG.announcements.length > 0 ? CONFIG.announcements[0].date : null;
    var lastViewed = localStorage.getItem(lastViewedKey);
    if (latestDate && (!lastViewed || lastViewed < latestDate)) {
        badge.classList.add('show');
    }
    $('toggleAnnouncement').addEventListener('click', function() {
        if (latestDate) localStorage.setItem(lastViewedKey, latestDate);
        badge.classList.remove('show');
    });
}

function initProfile() {
    $('profileAvatar').innerHTML = '<img src="' + CONFIG.profile.avatar + '" alt="avatar">';
    $('profileName').textContent = CONFIG.profile.name;
    $('profileTitle').textContent = CONFIG.profile.title;
    var links = $('profileLinks');
    CONFIG.links.forEach(function(link) {
        links.innerHTML += '<a href="' + link.url + '" target="' + (link.url.startsWith('mailto:') ? '_self' : '_blank') + '" class="profile-link">' + link.icon + '<span>' + link.label + '</span></a>';
    });
}

function initOceanClock() {
    var panel = $('clockPanel'), toggleBtn = $('toggleClock');
    var clock = initClock({
        faceId: 'clockFace',
        hourId: 'hourHand',
        minuteId: 'minuteHand',
        secondId: 'secondHand',
        digitalClockId: 'digitalClock',
        digitalDateId: 'digitalDate',
        faceSize: 240,
        showNumbers: true,
        numberRadius: 88,
        markOrigin: 114,
        startImmediately: false
    });
    var closePanel = togglePanel(toggleBtn, panel, clock.start, clock.stop);
    panel.querySelector('.panel-close').addEventListener('click', function(e) { e.stopPropagation(); closePanel(); });

    var tabs = panel.querySelectorAll('.clock-tab');
    var contents = panel.querySelectorAll('.clock-content');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            tabs.forEach(function(t) { t.classList.remove('active'); });
            contents.forEach(function(c) { c.classList.remove('active'); });
            tab.classList.add('active');
            $(tab.dataset.tab + 'Content').classList.add('active');
        });
    });
}

function initOceanPomodoro() {
    initPomodoro({
        timerId: 'pomodoroTimer',
        statusId: 'pomodoroStatus',
        progressId: 'pomodoroProgress',
        startBtnId: 'pomodoroStart',
        resetBtnId: 'pomodoroReset',
        countId: 'pomodoroCount',
        totalId: 'pomodoroTotal',
        workInputId: 'pomodoroWork',
        breakInputId: 'pomodoroBreak',
        circleRadius: 90
    });
}

function initBookmarks() {
    var panel = $('bookmarkPanel'), toggleBtn = $('toggleBookmark'), content = $('bookmarkContent');
    var externalIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>';

    CONFIG.bookmarks.forEach(function(folder, idx) {
        var folderDiv = document.createElement('div');
        var linksHtml = folder.links.map(function(l) {
            return '<a href="' + l.url + '" target="_blank" class="bookmark-link">' + l.label + externalIcon + '</a>';
        }).join('');
        folderDiv.innerHTML = '<div class="bookmark-folder-header' + (idx === 0 ? ' expanded' : '') + '"><span class="bookmark-folder-icon">▶</span><span class="bookmark-folder-name">' + folder.name + '</span><span class="bookmark-folder-count">' + folder.links.length + '</span></div><div class="bookmark-links' + (idx === 0 ? ' show' : '') + '">' + linksHtml + '</div>';
        folderDiv.querySelector('.bookmark-folder-header').addEventListener('click', function(e) {
            e.stopPropagation();
            folderDiv.querySelector('.bookmark-folder-header').classList.toggle('expanded');
            folderDiv.querySelector('.bookmark-links').classList.toggle('show');
        });
        content.appendChild(folderDiv);
    });

    var closePanel = togglePanel(toggleBtn, panel);
    panel.querySelector('.panel-close').addEventListener('click', function(e) { e.stopPropagation(); closePanel(); });
}

function initOceanSchulte() {
    var panel = $('schultePanel'), toggleBtn = $('toggleSchulte');
    var schulte = initSchulte({
        gridId: 'schulteGrid',
        timeId: 'schulteTime',
        bestId: 'schulteBest',
        overlayId: 'schulteOverlay',
        restartBtnId: 'schulteRestart',
        usePerformanceNow: false,
        bestPlaceholder: '--'
    });

    var closePanel = togglePanel(toggleBtn, panel, function() {
        if (!$('schulteGrid').children.length) schulte.reset();
    });
    panel.querySelector('.panel-close').addEventListener('click', function(e) { e.stopPropagation(); closePanel(); });
}

function initOcean() {
    $('subtitle').textContent = CONFIG.profile.slogan;
    $('domain').textContent = CONFIG.profile.domain;
    initProfile();
    initLightRays();
    initBubbles();
    initAnnouncements();
    initAnnouncementBadge();
    initCursor();
    document.addEventListener('click', function(e) { createRipple(e.clientX, e.clientY); });
    initFishInteraction();
    initClickOutsideToClose();

    var profileClose = togglePanel($('toggleProfile'), $('profileCard'));
    $('profileCard').querySelector('.panel-close').addEventListener('click', function(e) { e.stopPropagation(); profileClose(); });

    var announcementClose = togglePanel($('toggleAnnouncement'), $('announcementPanel'));
    $('announcementPanel').querySelector('.panel-close').addEventListener('click', function(e) { e.stopPropagation(); announcementClose(); });

    initOceanClock();
    initOceanPomodoro();
    initBookmarks();
    initOceanSchulte();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.querySelectorAll('*').forEach(function(el) { el.style.animation = 'none'; });
    }
}

$('switchToModern').addEventListener('click', function(e) {
    e.preventDefault();
    localStorage.setItem('preferredMode', 'modern');
    window.location.href = 'modern.html';
});

initOcean();
