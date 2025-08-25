let observer = null;
let observedElements = new Set();

export function initialize() {
    if (observer) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -10px 0px'
    };

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const element = entry.target;
                const delay = parseInt(element.getAttribute('data-bs-delay')) || 0;

                setTimeout(() => {
                    element.classList.add('animate');
                }, delay);

                // Stop observing this element
                observer.unobserve(element);
                observedElements.delete(element);
            }
        });
    }, observerOptions);
}

export function observeElement(element) {
    if (!observer || !element || observedElements.has(element)) return;
    observer.observe(element);
    observedElements.add(element);
}

export function dispose() {
    if (observer) {
        observer.disconnect();
        observer = null;
    }
    observedElements.clear();
}
