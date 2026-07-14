var modernClock = null;
var appsLoadPromise = null;
var appsInitialized = false;
var validPageIds = ['home', 'resume', 'bookmarks', 'apps'];
var currentPageId = null;
var backToTopButton = null;
var backToTopProgress = null;
var backToTopTicking = false;
var pageScrollPositions = {};

function updateBackToTopVisibility() {
    if (!backToTopButton) return;
    var scrollableDistance = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    var progress = scrollableDistance > 0
        ? Math.min(100, Math.max(0, Math.round(window.scrollY / scrollableDistance * 100)))
        : 0;
    backToTopButton.hidden = window.scrollY <= 320;
    backToTopButton.setAttribute('aria-label', '返回顶部，已阅读 ' + progress + '%');
    backToTopButton.title = '返回顶部 · ' + progress + '%';
    if (backToTopProgress) backToTopProgress.style.strokeDashoffset = String(100 - progress);
    backToTopTicking = false;
}

function initBackToTop() {
    backToTopButton = $('backToTop');
    if (!backToTopButton) return;
    backToTopProgress = backToTopButton.querySelector('[data-back-to-top-progress]');
    window.addEventListener('scroll', function() {
        if (backToTopTicking) return;
        backToTopTicking = true;
        requestAnimationFrame(updateBackToTopVisibility);
    }, { passive: true });
    backToTopButton.addEventListener('click', function() {
        var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    updateBackToTopVisibility();
}

function setAppsLoadState(state) {
    var status = $('appsLoadStatus');
    var grid = $('appsGrid');
    if (!status || !grid) return;
    var isLoading = state === 'loading';
    var hasError = state === 'error';
    var message = status.querySelector('[data-apps-load-message]');
    status.hidden = !isLoading && !hasError;
    status.classList.toggle('is-error', hasError);
    if (message) message.textContent = hasError ? '应用加载失败，请刷新后重试' : '正在加载应用';
    grid.classList.toggle('is-loading', isLoading);
    grid.classList.toggle('has-load-error', hasError);
    grid.setAttribute('aria-busy', isLoading.toString());
}

function loadAppsBundle() {
    if (window.JustAFishAppModules) return Promise.resolve(window.JustAFishAppModules);
    if (appsLoadPromise) return appsLoadPromise;

    setAppsLoadState('loading');
    appsLoadPromise = new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.src = './assets/apps.js';
        script.async = true;
        script.onload = function() {
            if (window.JustAFishAppModules) resolve(window.JustAFishAppModules);
            else reject(new Error('应用模块没有正确注册'));
        };
        script.onerror = function() { reject(new Error('应用代码加载失败')); };
        document.head.appendChild(script);
    });
    return appsLoadPromise;
}

function ensureAppsInitialized() {
    return loadAppsBundle().then(function() {
        if (!appsInitialized) {
            modernClock = initModernClock();
            initModernPomodoro();
            initModernSchulte();
            window.JustAFishAppModules.initGame2048();
            initToolFullscreen();
            appsInitialized = true;
        }
        setAppsLoadState('ready');
        return modernClock;
    }).catch(function(error) {
        appsLoadPromise = null;
        setAppsLoadState('error');
        throw error;
    });
}

function renderPage(pageId) {
    if (validPageIds.indexOf(pageId) === -1 || currentPageId === pageId) return;
    if (currentPageId) pageScrollPositions[currentPageId] = window.scrollY;
    document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
    var page = $(pageId);
    if (!page) return;
    page.classList.add('active');
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(function(link) {
        var isActive = link.dataset.page === pageId;
        link.classList.toggle('active', isActive);
        if (isActive) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });
    currentPageId = pageId;
    requestAnimationFrame(function() {
        window.scrollTo(0, pageScrollPositions[pageId] || 0);
        updateBackToTopVisibility();
    });
    if (pageId === 'apps') {
        ensureAppsInitialized().then(function(clock) {
            if (currentPageId === 'apps') clock.start();
        }).catch(function() {});
    } else if (modernClock) {
        modernClock.stop();
    }
}

function getPageFromHash() {
    if (!window.location.hash) return 'home';
    var pageId = window.location.hash.slice(1);
    return validPageIds.indexOf(pageId) === -1 ? null : pageId;
}

function getPageUrl(pageId) {
    var baseUrl = window.location.pathname + window.location.search;
    return pageId === 'home' ? baseUrl : baseUrl + '#' + pageId;
}

function syncPageFromLocation() {
    var pageId = getPageFromHash();
    if (!pageId) {
        window.history.replaceState({ page: 'home' }, '', getPageUrl('home'));
        pageId = 'home';
    } else if (pageId === 'home' && window.location.hash) {
        window.history.replaceState({ page: 'home' }, '', getPageUrl('home'));
    }
    renderPage(pageId);
}

window.switchPage = function(pageId) {
    if (validPageIds.indexOf(pageId) === -1) return;
    var nextUrl = getPageUrl(pageId);
    var currentUrl = window.location.pathname + window.location.search + window.location.hash;
    if (nextUrl !== currentUrl) {
        window.history.pushState({ page: pageId }, '', nextUrl);
    }
    renderPage(pageId);
};

function initPageRouting() {
    syncPageFromLocation();
    window.addEventListener('popstate', syncPageFromLocation);
    window.addEventListener('hashchange', syncPageFromLocation);
}

window.toggleTheme = function() {
    var html = document.documentElement;
    var isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? '' : 'dark');
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    document.querySelector('.sun-icon').style.display = isDark ? 'block' : 'none';
    document.querySelector('.moon-icon').style.display = isDark ? 'none' : 'block';
};

function initTheme() {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.querySelector('.sun-icon').style.display = 'none';
        document.querySelector('.moon-icon').style.display = 'block';
    }
}

function initResumeAge() {
    var ageDisplay = $('resumeAge');
    if (!ageDisplay) return;
    var parts = (ageDisplay.dataset.birthday || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(function(value) { return !Number.isFinite(value); })) return;
    var today = new Date();
    var age = today.getFullYear() - parts[0];
    if (today.getMonth() < parts[1] - 1 || (today.getMonth() === parts[1] - 1 && today.getDate() < parts[2])) age--;
    if (age >= 0) ageDisplay.textContent = age + ' 岁';
}

function initAnnouncements() {
    var banner = $('announcementBanner');
    if (!banner) return;
    var slides = Array.from(banner.querySelectorAll('[data-announcement-slide]'));
    var originalDots = Array.from(banner.querySelectorAll('[data-announcement-index]'));

    slides = slides.filter(function(slide, index) {
        var expiresAt = slide.dataset.expiresAt;
        if (!expiresAt) return true;
        var expiresTimestamp = /^\d{4}-\d{2}-\d{2}$/.test(expiresAt)
            ? new Date(expiresAt + 'T23:59:59').getTime()
            : Date.parse(expiresAt);
        var expired = Number.isFinite(expiresTimestamp) && expiresTimestamp < Date.now();
        if (expired) {
            slide.remove();
            if (originalDots[index]) originalDots[index].remove();
        }
        return !expired;
    });

    if (!slides.length) {
        banner.remove();
        return;
    }

    var dots = Array.from(banner.querySelectorAll('[data-announcement-index]'));
    dots.forEach(function(dot, index) {
        dot.dataset.announcementIndex = index;
        dot.setAttribute('aria-label', '查看第 ' + (index + 1) + ' 条公告');
    });

    var currentIndex = -1;
    var rotationTimer = null;
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function showAnnouncement(nextIndex, immediate) {
        var normalizedIndex = (nextIndex + slides.length) % slides.length;
        if (normalizedIndex === currentIndex) return;
        var previousSlide = currentIndex >= 0 ? slides[currentIndex] : null;
        if (previousSlide) {
            previousSlide.classList.remove('is-active');
            previousSlide.setAttribute('aria-hidden', 'true');
            if (!immediate) {
                previousSlide.classList.add('is-leaving');
                setTimeout(function() {
                    previousSlide.classList.remove('is-leaving');
                }, 260);
            }
        }

        currentIndex = normalizedIndex;
        slides[currentIndex].classList.remove('is-leaving');
        slides[currentIndex].classList.add('is-active');
        slides[currentIndex].setAttribute('aria-hidden', 'false');
        dots.forEach(function(dot, index) {
            var isActive = index === currentIndex;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-pressed', isActive.toString());
        });
    }

    function stopRotation() {
        if (rotationTimer) clearInterval(rotationTimer);
        rotationTimer = null;
    }

    function startRotation() {
        stopRotation();
        if (slides.length < 2 || reduceMotion.matches) return;
        rotationTimer = setInterval(function() {
            showAnnouncement(currentIndex + 1, false);
        }, 5000);
    }

    slides.forEach(function(slide) {
        slide.classList.remove('is-active', 'is-leaving');
        slide.setAttribute('aria-hidden', 'true');
    });
    showAnnouncement(0, true);
    startRotation();

    dots.forEach(function(dot) {
        dot.addEventListener('click', function() {
            showAnnouncement(parseInt(dot.dataset.announcementIndex), false);
            startRotation();
        });
    });
    banner.addEventListener('mouseenter', stopRotation);
    banner.addEventListener('mouseleave', startRotation);
    banner.addEventListener('focusin', stopRotation);
    banner.addEventListener('focusout', function(event) {
        if (!banner.contains(event.relatedTarget)) startRotation();
    });
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) stopRotation();
        else startRotation();
    });
}

function initToolFullscreen() {
    var cards = Array.from(document.querySelectorAll('.tool-card'));
    var activeCard = null;
    var inertedElements = [];

    function setBackgroundInert(card) {
        var current = card;
        while (current && current.parentElement) {
            var parent = current.parentElement;
            Array.from(parent.children).forEach(function(sibling) {
                if (sibling !== current && !sibling.inert) {
                    sibling.inert = true;
                    inertedElements.push(sibling);
                }
            });
            if (parent === document.body) break;
            current = parent;
        }
    }

    function restoreBackground() {
        inertedElements.forEach(function(element) { element.inert = false; });
        inertedElements = [];
    }

    function getFocusableElements(card) {
        return Array.from(card.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
            .filter(function(element) { return !element.hidden && element.getClientRects().length > 0; });
    }

    function closeFullscreen() {
        if (!activeCard) return;
        var card = activeCard;
        var button = card.querySelector('.tool-fullscreen-toggle');
        var title = card.querySelector('.tool-title').textContent.trim();
        card.classList.remove('is-fullscreen');
        card.removeAttribute('role');
        card.removeAttribute('aria-modal');
        card.removeAttribute('aria-labelledby');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', '全屏查看' + title);
        button.title = '全屏查看';
        document.body.classList.remove('tool-fullscreen-open');
        restoreBackground();
        activeCard = null;
        button.focus();
    }

    function openFullscreen(card) {
        if (activeCard && activeCard !== card) closeFullscreen();
        var button = card.querySelector('.tool-fullscreen-toggle');
        var titleElement = card.querySelector('.tool-title');
        var title = titleElement.textContent.trim();
        card.classList.add('is-fullscreen');
        card.setAttribute('role', 'dialog');
        card.setAttribute('aria-modal', 'true');
        card.setAttribute('aria-labelledby', titleElement.id);
        button.setAttribute('aria-expanded', 'true');
        button.setAttribute('aria-label', '退出' + title + '全屏');
        button.title = '恢复';
        document.body.classList.add('tool-fullscreen-open');
        setBackgroundInert(card);
        activeCard = card;
        button.focus();
    }

    cards.forEach(function(card, index) {
        var header = card.querySelector('.tool-header');
        var titleElement = card.querySelector('.tool-title');
        var title = titleElement.textContent.trim();
        if (!titleElement.id) titleElement.id = 'toolTitle' + (index + 1);
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'tool-fullscreen-toggle';
        button.setAttribute('aria-label', '全屏查看' + title);
        button.setAttribute('aria-expanded', 'false');
        button.title = '全屏查看';
        button.innerHTML = '<svg class="tool-maximize-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg><svg class="tool-minimize-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>';
        button.addEventListener('click', function() {
            if (activeCard === card) closeFullscreen();
            else openFullscreen(card);
        });
        header.appendChild(button);
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && activeCard) {
            event.preventDefault();
            closeFullscreen();
            return;
        }
        if (event.key === 'Tab' && activeCard) {
            var focusable = getFocusableElements(activeCard);
            if (!focusable.length) {
                event.preventDefault();
                return;
            }
            var first = focusable[0];
            var last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            } else if (!activeCard.contains(document.activeElement)) {
                event.preventDefault();
                first.focus();
            }
        }
    });
}

window.toggleCategory = function(header) {
    var expanded = header.querySelector('.category-toggle').classList.toggle('expanded');
    header.nextElementSibling.classList.toggle('show', expanded);
    header.setAttribute('aria-expanded', expanded.toString());
};

function initBookmarkSearch() {
    var input = $('bookmarkSearch');
    var clearButton = $('bookmarkSearchClear');
    var status = $('bookmarkSearchStatus');
    var emptyState = $('bookmarkSearchEmpty');
    var categories = Array.from(document.querySelectorAll('[data-bookmark-category]'));
    if (!input || !clearButton || !status || !emptyState || !categories.length) return;

    var totalCount = categories.reduce(function(total, category) {
        return total + category.querySelectorAll('[data-bookmark-label]').length;
    }, 0);

    function restoreCategory(category) {
        var originalExpanded = category.dataset.searchExpanded;
        if (originalExpanded === undefined) return;
        var expanded = originalExpanded === 'true';
        var header = category.querySelector('.category-header');
        var linksContainer = category.querySelector('.bookmark-links');
        var toggle = category.querySelector('.category-toggle');
        header.setAttribute('aria-expanded', expanded.toString());
        linksContainer.classList.toggle('show', expanded);
        toggle.classList.toggle('expanded', expanded);
        delete category.dataset.searchExpanded;
    }

    function expandForSearch(category) {
        var header = category.querySelector('.category-header');
        var linksContainer = category.querySelector('.bookmark-links');
        var toggle = category.querySelector('.category-toggle');
        if (category.dataset.searchExpanded === undefined) {
            category.dataset.searchExpanded = header.getAttribute('aria-expanded') || 'false';
        }
        header.setAttribute('aria-expanded', 'true');
        linksContainer.classList.add('show');
        toggle.classList.add('expanded');
    }

    function filterBookmarks() {
        var query = input.value.trim().toLocaleLowerCase();
        var visibleCount = 0;

        categories.forEach(function(category) {
            var categoryName = (category.dataset.bookmarkCategory || '').toLocaleLowerCase();
            var categoryMatches = Boolean(query) && categoryName.indexOf(query) !== -1;
            var links = Array.from(category.querySelectorAll('[data-bookmark-label]'));
            var categoryCount = 0;

            links.forEach(function(link) {
                var label = (link.dataset.bookmarkLabel || '').toLocaleLowerCase();
                var url = (link.dataset.bookmarkUrl || '').toLocaleLowerCase();
                var matches = !query || categoryMatches || label.indexOf(query) !== -1 || url.indexOf(query) !== -1;
                link.hidden = !matches;
                if (matches) categoryCount++;
            });

            category.hidden = Boolean(query) && categoryCount === 0;
            var count = category.querySelector('.category-count');
            if (count) count.textContent = String(categoryCount);
            if (query && categoryCount) expandForSearch(category);
            else if (!query) restoreCategory(category);
            visibleCount += categoryCount;
        });

        clearButton.hidden = !query;
        status.textContent = query ? '找到 ' + visibleCount + ' 个书签' : '共 ' + totalCount + ' 个书签';
        emptyState.hidden = !query || visibleCount > 0;
    }

    input.addEventListener('input', filterBookmarks);
    input.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && input.value) {
            input.value = '';
            filterBookmarks();
        }
    });
    clearButton.addEventListener('click', function() {
        input.value = '';
        filterBookmarks();
        input.focus();
    });
}

function initModernClock() {
    return window.JustAFishAppModules.initClock({
        faceId: 'analogFace',
        hourId: 'analogHour',
        minuteId: 'analogMinute',
        secondId: 'analogSecond',
        digitalClockId: 'digitalClock',
        digitalDateId: 'digitalDate',
        faceSize: 200,
        showNumbers: true,
        numberRadius: 73,
        startImmediately: false
    });
}

function initModernPomodoro() {
    window.JustAFishAppModules.initPomodoro({
        timerId: 'pomodoroTimer',
        statusId: 'pomodoroStatus',
        progressId: 'pomodoroProgress',
        startBtnId: 'pomodoroStart',
        resetBtnId: 'pomodoroReset',
        countId: 'pomodoroCount',
        totalId: 'pomodoroTotal',
        workInputId: 'pomodoroWork',
        breakInputId: 'pomodoroBreak',
        soundToggleId: 'pomodoroSound',
        previewBtnId: 'pomodoroPreview',
        toastId: 'pomodoroToast',
        toastMessageId: 'pomodoroToastMessage',
        toastDetailId: 'pomodoroToastDetail',
        toastCloseId: 'pomodoroToastClose',
        circleRadius: 85,
        exposeAs: 'pomodoro'
    });
}

function initModernSchulte() {
    window.JustAFishAppModules.initSchulte({
        gridId: 'schulteGrid',
        timeId: 'schulteTime',
        bestId: 'schulteBest',
        overlayId: 'schulteOverlay',
        restartBtnId: 'schulteRestart',
        usePerformanceNow: true,
        bestPlaceholder: '-',
        exposeAs: 'initSchulte'
    });
}

initTheme();
initResumeAge();
initAnnouncements();
initBookmarkSearch();
initBackToTop();
initPageRouting();
