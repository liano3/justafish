/* PAGE:bookmarks:START */
let closeBookmarkChat = function() {};
/* PAGE:bookmarks:END */
const validPageIds = window.ENABLED_PAGE_IDS;
const defaultPageId = validPageIds[0];
let currentPageId = null;
let backToTopButton = null;
let backToTopProgress = null;
let backToTopTicking = false;
const pageScrollPositions = {};

function updateBackToTopVisibility() {
    if (!backToTopButton) return;
    const scrollableDistance = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const progress = scrollableDistance > 0
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
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    const page = $(pageId);
    if (!page) return;
    document.documentElement.dataset.page = pageId;
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(function(link) {
        const isActive = link.dataset.page === pageId;
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
    const pageId = window.location.hash.slice(1);
    return validPageIds.indexOf(pageId) === -1 ? null : pageId;
}

function getPageUrl(pageId) {
    const baseUrl = window.location.pathname + window.location.search;
    return pageId === 'home' ? baseUrl : baseUrl + '#' + pageId;
}

function syncPageFromLocation() {
    let pageId = getPageFromHash();
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

function switchPage(pageId) {
    if (validPageIds.indexOf(pageId) === -1) return;
    const nextUrl = getPageUrl(pageId);
    const currentUrl = window.location.pathname + window.location.search + window.location.hash;
    if (nextUrl !== currentUrl) {
        window.history.pushState({ page: pageId }, '', nextUrl);
    }
    renderPage(pageId);
};

function initPageRouting() {
    document.querySelectorAll('a[data-page]').forEach(function(link) {
        link.addEventListener('click', function(event) {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            switchPage(link.dataset.page);
        });
    });
    /* FEATURE:language:START */
    const languageLink = document.querySelector('.language-switch');
    if (languageLink) languageLink.addEventListener('click', function(event) {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        window.location.href = languageLink.href + window.location.hash;
    });
    /* FEATURE:language:END */
    syncPageFromLocation();
    window.addEventListener('popstate', syncPageFromLocation);
    window.addEventListener('hashchange', syncPageFromLocation);
}

/* PAGE:resume:START */
function initResumeAge() {
    const ageDisplay = $('resumeAge');
    if (!ageDisplay) return;
    const parts = (ageDisplay.dataset.birthday || '').split('-').map(Number);
    if (parts.length !== 3 || parts.some(function(value) { return !Number.isFinite(value); })) return;
    const today = new Date();
    let age = today.getFullYear() - parts[0];
    if (today.getMonth() < parts[1] - 1 || (today.getMonth() === parts[1] - 1 && today.getDate() < parts[2])) age--;
    if (age >= 0) ageDisplay.textContent = t('ageYears', { age: age });
}

function initResumeActions() {
    const copyButton = document.querySelector('[data-copy-email]');
    const status = $('resumeActionStatus');
    let copyResetTimer = null;

    if (copyButton) {
        copyButton.addEventListener('click', async function() {
            const email = copyButton.dataset.copyEmail || '';
            try {
                await navigator.clipboard.writeText(email);
                clearTimeout(copyResetTimer);
                copyButton.classList.add('is-copied');
                copyButton.setAttribute('aria-label', t('emailCopied'));
                copyButton.title = t('copied');
                status.textContent = t('emailCopiedStatus', { email: email });
                copyResetTimer = setTimeout(function() {
                    copyButton.classList.remove('is-copied');
                    copyButton.setAttribute('aria-label', t('copyEmail'));
                    copyButton.title = t('copyEmail');
                }, 1800);
            } catch {
                status.textContent = t('copyEmailFailed');
                copyButton.setAttribute('aria-label', t('copyEmailFailed'));
                copyButton.title = t('copyFailed');
            }
        });
    }

}

/* PAGE:resume:END */

/* PAGE:home:START */
function initAnnouncements() {
    const banner = $('announcementBanner');
    if (!banner) return;
    let slides = Array.from(banner.querySelectorAll('[data-announcement-slide]'));
    const originalDots = Array.from(banner.querySelectorAll('[data-announcement-index]'));

    slides = slides.filter(function(slide, index) {
        const expiresAt = slide.dataset.expiresAt;
        if (!expiresAt) return true;
        const expired = new Date(expiresAt + 'T23:59:59').getTime() < Date.now();
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

    const dots = Array.from(banner.querySelectorAll('[data-announcement-index]'));
    dots.forEach(function(dot, index) {
        dot.dataset.announcementIndex = index;
        dot.setAttribute('aria-label', t('announcementIndex', { index: index + 1 }));
    });

    let currentIndex = -1;
    let rotationTimer = null;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function showAnnouncement(nextIndex, immediate) {
        const normalizedIndex = (nextIndex + slides.length) % slides.length;
        if (normalizedIndex === currentIndex) return;
        const previousSlide = currentIndex >= 0 ? slides[currentIndex] : null;
        if (previousSlide) {
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
        slides[currentIndex].setAttribute('aria-hidden', 'false');
        dots.forEach(function(dot, index) {
            const isActive = index === currentIndex;
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
        slide.classList.remove('is-leaving');
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

/* PAGE:home:END */

/* PAGE:bookmarks:START */
function initBookmarkSearch() {
    const input = $('bookmarkSearch');
    const clearButton = $('bookmarkSearchClear');
    const status = $('bookmarkSearchStatus');
    const emptyState = $('bookmarkSearchEmpty');
    const categories = Array.from(document.querySelectorAll('[data-bookmark-category]'));
    const tagButtons = Array.from(document.querySelectorAll('[data-bookmark-tag]'));
    let activeTag = '';
    categories.forEach(category => {
        const header = category.querySelector('.category-header');
        header.addEventListener('click', () => header.setAttribute('aria-expanded', String(header.getAttribute('aria-expanded') !== 'true')));
    });
    if (!input || !clearButton || !status || !emptyState || !categories.length) return;

    const index = new Map(categories.map(category => [category, Array.from(category.querySelectorAll('.bookmark-link')).map(node => ({
        node, text: (node.textContent + ' ' + node.dataset.bookmarkUrl).toLowerCase(),
        tags: new Set(Array.from(node.querySelectorAll('[data-bookmark-tag-value]'), tag => tag.dataset.bookmarkTagValue))
    }))]));
    const totalCount = categories.reduce(function(total, category) {
        return total + category.querySelectorAll('.bookmark-link').length;
    }, 0);

    function restoreCategory(category) {
        const originalExpanded = category.dataset.searchExpanded;
        if (originalExpanded === undefined) return;
        category.querySelector('.category-header').setAttribute('aria-expanded', originalExpanded);
        delete category.dataset.searchExpanded;
    }

    function expandForSearch(category) {
        const header = category.querySelector('.category-header');
        if (category.dataset.searchExpanded === undefined) {
            category.dataset.searchExpanded = header.getAttribute('aria-expanded') || 'false';
        }
        header.setAttribute('aria-expanded', 'true');
    }

    function filterBookmarks() {
        const query = input.value.trim().toLowerCase();
        const filterActive = Boolean(query || activeTag);
        let visibleCount = 0;

        categories.forEach(function(category) {
            const categoryName = (category.dataset.bookmarkCategory || '').toLowerCase();
            const categoryMatches = Boolean(query) && categoryName.indexOf(query) !== -1;
            const links = index.get(category);
            let categoryCount = 0;

            links.forEach(function(link) {
                const matches = (!query || categoryMatches || link.text.includes(query)) && (!activeTag || link.tags.has(activeTag));
                link.node.hidden = !matches;
                if (matches) categoryCount++;
            });

            category.hidden = filterActive && categoryCount === 0;
            const count = category.querySelector('.category-count');
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
                const selected = item === button;
                item.setAttribute('aria-pressed', selected.toString());
            });
            filterBookmarks();
        });
    });
}

function initBookmarkChat() {
    const searchInput = $('bookmarkSearch');
    const chat = $('aiChat');
    const title = $('aiChatTitle');
    const closeButton = $('aiChatClose');
    const form = $('aiChatForm');
    const input = $('aiChatInput');
    const sendButton = $('aiChatSend');
    const messages = $('aiChatMessages');
    if (!searchInput || !chat || !title || !closeButton || !form || !input || !sendButton || !messages) return;

    let history = [];
    let password = '';
    let isSending = false;
    let unlockRequestId = 0;
    let chatSession = 0;

    function addMessage(role, text) {
        const message = document.createElement('div');
        message.className = 'ai-chat-message ai-chat-message-' + role;
        message.textContent = text;
        messages.appendChild(message);
        messages.scrollTop = messages.scrollHeight;
        return message;
    }

    function openChat(settings, submittedPassword) {
        chatSession++;
        password = submittedPassword;
        isSending = false;
        sendButton.disabled = false;
        input.value = '';
        history = [];
        messages.textContent = '';
        title.textContent = settings.title || t('AI_CHAT_TITLE');
        if (!chat.open) chat.showModal();
        addMessage('assistant', settings.greeting || t('AI_CHAT_GREETING'));
        input.focus();
    }

    function closeChat(restoreFocus) {
        unlockRequestId++;
        chatSession++;
        if (chat.open) chat.close();
        if (restoreFocus !== false) searchInput.focus();
    }

    searchInput.addEventListener('keydown', function(event) {
        if (event.isComposing || event.key !== 'Enter' || !searchInput.value.trim()) return;
        event.preventDefault();
        const submittedPassword = searchInput.value;
        const requestId = ++unlockRequestId;
        fetch('/api/chat', {
            method: 'POST',
            signal: AbortSignal.timeout(30000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: submittedPassword })
        }).then(function(response) {
            if (!response.ok) return null;
            return response.json();
        }).then(function(settings) {
            if (!settings?.unlocked || requestId !== unlockRequestId) return;
            openChat(settings, submittedPassword);
            if (searchInput.value === submittedPassword) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
            }
        }).catch(function() {});
    });
    closeButton.addEventListener('click', () => closeChat());
    chat.addEventListener('click', function(event) {
        if (event.target !== chat) return;
        const bounds = chat.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeChat();
    });
    chat.addEventListener('cancel', event => { event.preventDefault(); closeChat(); });
    closeBookmarkChat = closeChat;

    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        const text = input.value.trim();
        if (!text || isSending) return;
        const session = chatSession;
        input.value = '';
        addMessage('user', text);
        const reply = addMessage('assistant', t('AI_CHAT_WAIT'));
        isSending = true;
        sendButton.disabled = true;
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                signal: AbortSignal.timeout(30000),
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password, messages: [...history, { role: 'user', content: text }].slice(-40) })
            });
            if (!response.ok) throw new Error('Chat request failed');
            const data = await response.json();
            if (!data.reply) throw new Error('Empty reply');
            if (session !== chatSession) return;
            reply.textContent = data.reply;
            history = [...history, { role: 'user', content: text }, { role: 'assistant', content: data.reply }].slice(-40);
        } catch {
            if (session !== chatSession) return;
            reply.textContent = t('AI_CHAT_ERROR');
            if (!input.value) input.value = text;
        } finally {
            if (session === chatSession) {
                isSending = false;
                sendButton.disabled = false;
                messages.scrollTop = messages.scrollHeight;
                if (chat.open) input.focus();
            }
        }
    });
}
/* PAGE:bookmarks:END */

initTheme();
/* PAGE:resume:START */
initResumeAge();
initResumeActions();
/* PAGE:resume:END */
/* PAGE:home:START */
initAnnouncements();
/* PAGE:home:END */
/* PAGE:bookmarks:START */
initBookmarkSearch();
initBookmarkChat();
/* PAGE:bookmarks:END */
initBackToTop();
initPageRouting();
