/* PAGE:bookmarks:START */
var closeBookmarkChat = function() {};
/* PAGE:bookmarks:END */
var validPageIds = Array.isArray(window.ENABLED_PAGE_IDS) && window.ENABLED_PAGE_IDS.length
    ? window.ENABLED_PAGE_IDS.slice()
    : ['home', 'resume', 'bookmarks', 'apps'];
var defaultPageId = validPageIds[0];
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
    backToTopButton.setAttribute('aria-label', t('backToTopProgress', { progress: progress }));
    backToTopButton.title = t('backToTopTitle', { progress: progress });
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

function renderPage(pageId) {
    if (validPageIds.indexOf(pageId) === -1 || currentPageId === pageId) return;
    if (currentPageId) pageScrollPositions[currentPageId] = window.scrollY;
    /* PAGE:bookmarks:START */
    if (pageId !== 'bookmarks') closeBookmarkChat(false);
    /* PAGE:bookmarks:END */
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
}

function getPageFromHash() {
    if (!window.location.hash) return defaultPageId;
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
        pageId = defaultPageId;
        window.history.replaceState({ page: pageId }, '', getPageUrl(pageId));
    } else if (!window.location.hash && pageId !== 'home') {
        window.history.replaceState({ page: pageId }, '', getPageUrl(pageId));
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

/* FEATURE:language:START */
window.switchLanguage = function(link) {
    var target = link.getAttribute('href') || '/';
    window.location.href = target + (window.location.hash || '');
};
/* FEATURE:language:END */

function initPageRouting() {
    syncPageFromLocation();
    window.addEventListener('popstate', syncPageFromLocation);
    window.addEventListener('hashchange', syncPageFromLocation);
}

function updateThemeToggle(isDark) {
    var toggle = document.querySelector('.theme-toggle');
    var label = isDark ? t('themeToLight') : t('themeToDark');
    if (toggle) {
        toggle.setAttribute('aria-label', label);
        toggle.setAttribute('aria-pressed', isDark.toString());
        toggle.title = label;
    }
    var sunIcon = document.querySelector('.sun-icon');
    var moonIcon = document.querySelector('.moon-icon');
    if (sunIcon) sunIcon.style.display = isDark ? 'block' : 'none';
    if (moonIcon) moonIcon.style.display = isDark ? 'none' : 'block';
}

function applyTheme(isDark) {
    if (isDark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    updateThemeToggle(isDark);
}

window.toggleTheme = function() {
    var isDark = document.documentElement.getAttribute('data-theme') !== 'dark';
    applyTheme(isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

function initTheme() {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved === 'dark' || (!saved && prefersDark));
}

function initResumeAge() {
    var ageDisplay = $('resumeAge');
    if (!ageDisplay) return;
    var parts = (ageDisplay.dataset.birthday || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(function(value) { return !Number.isFinite(value); })) return;
    var today = new Date();
    var age = today.getFullYear() - parts[0];
    if (today.getMonth() < parts[1] - 1 || (today.getMonth() === parts[1] - 1 && today.getDate() < parts[2])) age--;
    if (age >= 0) ageDisplay.textContent = t('ageYears', { age: age });
}

function setResumeActionStatus(message) {
    var status = $('resumeActionStatus');
    if (status) status.textContent = message;
}

function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }

    return new Promise(function(resolve, reject) {
        var textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        var copied = false;
        try {
            copied = document.execCommand('copy');
        } catch (error) {
            copied = false;
        }
        textarea.remove();
        if (copied) resolve();
        else reject(new Error(t('copyNotAllowed')));
    });
}

function downloadPreparedResume(button) {
    var label = button.querySelector('[data-resume-pdf-label]');
    var url = button.dataset.pdfUrl || '/resume.pdf';
    var filename = button.dataset.pdfFilename || 'resume.pdf';
    button.disabled = true;
    button.classList.remove('is-unavailable');
    if (label) label.textContent = t('pdfChecking');
    setResumeActionStatus(t('pdfCheckingStatus'));

    return fetch(url, { method: 'HEAD', cache: 'no-store' }).then(function(response) {
        var contentType = response.headers.get('content-type') || '';
        if (!response.ok || contentType.toLowerCase().indexOf('application/pdf') === -1) {
            throw new Error(t('pdfMissing'));
        }
        var link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.hidden = true;
        document.body.appendChild(link);
        link.click();
        link.remove();
        if (label) label.textContent = t('pdfDownloading');
        setResumeActionStatus(t('pdfDownloadingStatus'));
    }).catch(function() {
        button.classList.add('is-unavailable');
        if (label) label.textContent = t('comingSoon');
        setResumeActionStatus(t('comingSoon'));
    }).finally(function() {
        button.disabled = false;
        setTimeout(function() {
            button.classList.remove('is-unavailable');
            if (label) label.textContent = t('downloadPdf');
        }, 2200);
    });
}

function initResumeActions() {
    var copyButton = document.querySelector('[data-copy-email]');
    var pdfButton = $('resumePdfDownload');
    var copyResetTimer = null;

    if (copyButton) {
        copyButton.addEventListener('click', function() {
            var email = copyButton.dataset.copyEmail || '';
            copyText(email).then(function() {
                clearTimeout(copyResetTimer);
                copyButton.classList.add('is-copied');
                copyButton.setAttribute('aria-label', t('emailCopied'));
                copyButton.title = t('copied');
                setResumeActionStatus(t('emailCopiedStatus', { email: email }));
                copyResetTimer = setTimeout(function() {
                    copyButton.classList.remove('is-copied');
                    copyButton.setAttribute('aria-label', t('copyEmail'));
                    copyButton.title = t('copyEmail');
                }, 1800);
            }).catch(function() {
                setResumeActionStatus(t('copyEmailFailed'));
                copyButton.setAttribute('aria-label', t('copyEmailFailed'));
                copyButton.title = t('copyFailed');
            });
        });
    }

    if (pdfButton) {
        pdfButton.addEventListener('click', function() {
            if (!pdfButton.disabled) downloadPreparedResume(pdfButton);
        });
    }
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
        dot.setAttribute('aria-label', t('announcementIndex', { index: index + 1 }));
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
    var tagButtons = Array.from(document.querySelectorAll('[data-bookmark-tag]'));
    var activeTag = '';
    if (!input || !clearButton || !status || !emptyState || !categories.length) return;

    var totalCount = categories.reduce(function(total, category) {
        return total + category.querySelectorAll('.bookmark-link').length;
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
        var query = input.value.trim().toLowerCase();
        var filterActive = Boolean(query || activeTag);
        var visibleCount = 0;

        categories.forEach(function(category) {
            var categoryName = (category.dataset.bookmarkCategory || '').toLowerCase();
            var categoryMatches = Boolean(query) && categoryName.indexOf(query) !== -1;
            var links = Array.from(category.querySelectorAll('.bookmark-link'));
            var categoryCount = 0;

            links.forEach(function(link) {
                var searchText = link.textContent.toLowerCase();
                var url = (link.dataset.bookmarkUrl || '').toLowerCase();
                var queryMatches = !query || categoryMatches || searchText.indexOf(query) !== -1
                    || url.indexOf(query) !== -1;
                var tagMatches = !activeTag || Array.from(link.querySelectorAll('[data-bookmark-tag-value]')).some(function(tag) {
                    return tag.dataset.bookmarkTagValue === activeTag;
                });
                var matches = queryMatches && tagMatches;
                link.hidden = !matches;
                if (matches) categoryCount++;
            });

            category.hidden = filterActive && categoryCount === 0;
            var count = category.querySelector('.category-count');
            if (count) count.textContent = String(categoryCount);
            if (filterActive && categoryCount) expandForSearch(category);
            else if (!filterActive) restoreCategory(category);
            visibleCount += categoryCount;
        });

        clearButton.hidden = !query;
        status.textContent = filterActive
            ? t('bookmarksFound', { count: visibleCount })
            : t('bookmarksTotal', { count: totalCount });
        emptyState.hidden = !filterActive || visibleCount > 0;
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

    tagButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            activeTag = (button.dataset.bookmarkTag || '').toLowerCase();
            tagButtons.forEach(function(item) {
                var selected = item === button;
                item.classList.toggle('is-active', selected);
                item.setAttribute('aria-pressed', selected.toString());
            });
            filterBookmarks();
        });
    });
}

/* PAGE:bookmarks:START */
function initBookmarkChat() {
    var searchInput = $('bookmarkSearch');
    var chat = $('aiChat');
    var closeButton = $('aiChatClose');
    var form = $('aiChatForm');
    var input = $('aiChatInput');
    var sendButton = $('aiChatSend');
    var messages = $('aiChatMessages');
    if (!searchInput || !chat || !closeButton || !form || !input || !sendButton || !messages) return;

    var history = [];
    var isSending = false;

    function addMessage(role, text) {
        var message = document.createElement('div');
        message.className = 'ai-chat-message ai-chat-message-' + role;
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
    }

    function openChat() {
        chat.hidden = false;
        if (!messages.children.length) addMessage('assistant', t('AI_CHAT_GREETING'));
        input.focus();
    }

    function closeChat(restoreFocus) {
        chat.hidden = true;
        if (restoreFocus !== false) searchInput.focus();
    }

    searchInput.addEventListener('keydown', function(event) {
        if (event.key !== 'Enter' || !searchInput.value.trim()) return;
        event.preventDefault();
        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: searchInput.value })
        }).then(function(response) {
            if (!response.ok) return;
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            openChat();
        }).catch(function() {});
    });
    closeButton.addEventListener('click', closeChat);
    chat.addEventListener('click', function(event) {
        if (event.target === chat) closeChat();
    });
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && !chat.hidden) closeChat();
    });
    closeBookmarkChat = closeChat;

    form.addEventListener('submit', function(event) {
        event.preventDefault();
        var text = input.value.trim();
        if (!text || isSending) return;
        isSending = true;
        sendButton.disabled = true;
        input.value = '';
        history.push({ role: 'user', content: text });
        addMessage('user', text);
        var reply = addMessage('assistant', t('AI_CHAT_WAIT'));
        fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history })
        }).then(function(response) {
            return response.json().catch(function() { return {}; }).then(function(data) {
                if (!response.ok) throw new Error(data.error || t('AI_CHAT_ERROR'));
                return data;
            });
        }).then(function(data) {
            reply.textContent = data.reply || t('AI_CHAT_ERROR');
            messages.scrollTop = messages.scrollHeight;
            if (data.reply) history.push({ role: 'assistant', content: data.reply });
        }).catch(function() {
            reply.textContent = t('AI_CHAT_ERROR');
            messages.scrollTop = messages.scrollHeight;
        }).finally(function() {
            isSending = false;
            sendButton.disabled = false;
            input.focus();
        });
    });
}
/* PAGE:bookmarks:END */

initTheme();
initResumeAge();
initResumeActions();
initAnnouncements();
initBookmarkSearch();
/* PAGE:bookmarks:START */
initBookmarkChat();
/* PAGE:bookmarks:END */
initBackToTop();
initPageRouting();
