import unique from 'unique-selector';

export function saveState() {
    const elements = document.querySelectorAll('*');
    const scrolls = {};

    for (const el of elements) {
        if (el.scrollTop) {
            scrolls[unique(el)] = el.scrollTop;
        }
    }
    sessionStorage.setItem(location.pathname, JSON.stringify(scrolls));
}

export function restoreState() {
    const scrolls = JSON.parse(sessionStorage.getItem(location.pathname) ?? '{}');
    sessionStorage.removeItem(location.pathname);

    for (const scroll in scrolls) {
        const el = document.querySelector(scroll);
        el?.scrollTo(0, scrolls[scroll]);
    }
}