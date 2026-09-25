// Place in src/js/feedback.js; import './js/feedback.js' from src/main.js.
import Swiper from 'swiper';
import { A11y, Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/a11y';
import 'swiper/css/pagination';
import '/css/layout/feedbacks.css';

const ENDPOINT = 'https://wedding-photographer.b.goit.study/api/feedbacks';
const PAGE_SIZE = 10;

async function fetchFeedbacks() {
  const feedbacks = [];
  let page = 1;
  let total;

  do {
    const url = new URL(ENDPOINT);
    url.searchParams.set('page', page);
    url.searchParams.set('limit', PAGE_SIZE);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let payload;
    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      payload = await response.json();
    } finally {
      clearTimeout(timeout);
    }

    if (
      !Array.isArray(payload.feedbacks) ||
      !Number.isInteger(payload.total) ||
      payload.total < 0 ||
      payload.feedbacks.some(
        item => typeof item.name !== 'string' || typeof item.descr !== 'string'
      )
    ) {
      throw new Error('Invalid feedback response');
    }
    total = payload.total;
    if (!payload.feedbacks.length && feedbacks.length < total) {
      throw new Error('Incomplete feedback response');
    }
    feedbacks.push(...payload.feedbacks);
    page += 1;
  } while (feedbacks.length < total);

  return feedbacks;
}

function initFeedback() {
  const section = document.querySelector('#feedbacks');
  if (!section) return;
  // Keep the existing HTML class and enable the supplied section styles.
  section.classList.add('feedback-section');

  const slider = section.querySelector('.feedback-slider');
  const list = section.querySelector('.feedback-list');
  const status = section.querySelector('[data-feedback-status]');
  const retry = section.querySelector('[data-feedback-retry]');
  const controls = section.querySelector('.feedback-controls');
  const previous = section.querySelector('[data-feedback-prev]');
  const next = section.querySelector('[data-feedback-next]');
  let swiper;

  function syncButtons(instance) {
    previous.disabled = instance.isBeginning || instance.isLocked;
    next.disabled = instance.isEnd || instance.isLocked;
    previous.setAttribute('aria-disabled', String(previous.disabled));
    next.setAttribute('aria-disabled', String(next.disabled));
  }

  async function load() {
    const restoreFocus = document.activeElement === retry;
    retry.hidden = true;
    status.hidden = false;
    status.textContent = 'Loading reviews…';
    slider.setAttribute('aria-busy', 'true');

    try {
      const feedbacks = await fetchFeedbacks();
      // Feature the couple shown in the supplied design; keep all API reviews.
      const featured = feedbacks.findIndex(
        item => item.name === 'Olena & David'
      );
      if (featured > 0) feedbacks.unshift(...feedbacks.splice(featured, 1));
      const fragment = document.createDocumentFragment();
      for (const feedback of feedbacks) {
        const item = document.createElement('li');
        item.className = 'swiper-slide feedback-card';
        const text = document.createElement('p');
        text.className = 'feedback-quote';
        text.textContent = `"${feedback.descr}"`;
        // quote.append(text);
        const author = document.createElement('p');
        author.className = 'feedback-author';
        author.textContent = feedback.name;
        item.append(text, author);
        fragment.append(item);
      }
      list.replaceChildren(fragment);
      status.textContent = feedbacks.length ? '' : 'No reviews yet.';
      status.hidden = feedbacks.length > 0;
      slider.hidden = !feedbacks.length;
      controls.hidden = !feedbacks.length;
      if (!feedbacks.length) return;

      swiper = new Swiper(slider, {
        modules: [A11y, Navigation, Pagination],
        slidesPerView: 1,
        spaceBetween: 24,
        loop: false,
        watchOverflow: true,
        grabCursor: true,
        speed: matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 300,
        navigation: { prevEl: previous, nextEl: next },
        pagination: {
          el: section.querySelector('.feedback-pagination'),
          clickable: true,
          dynamicBullets: true,
          dynamicMainBullets: 3,
          renderBullet(index, className) {
            return `<button type="button" class="${className}" aria-label="Go to review ${index + 1}"></button>`;
          },
        },
        a11y: {
          enabled: true,
          slideRole: 'listitem',
          itemRoleDescriptionMessage: 'slide',
          prevSlideMessage: 'Previous reviews',
          nextSlideMessage: 'Next reviews',
        },
        breakpoints: {
          768: { slidesPerView: 2 },
          1440: { slidesPerView: 3 },
        },
        on: {
          init: syncButtons,
          slideChange: syncButtons,
          toEdge: syncButtons,
          fromEdge: syncButtons,
          resize: syncButtons,
          lock: syncButtons,
          unlock: syncButtons,
        },
      });
      if (restoreFocus) slider.focus();
    } catch (error) {
      swiper?.destroy(true, true);
      swiper = undefined;
      slider.hidden = true;
      controls.hidden = true;
      status.hidden = false;
      status.textContent = 'Could not load reviews. Please try again.';
      retry.hidden = false;
      if (restoreFocus) retry.focus();
      console.error('Feedback loading failed:', error);
    } finally {
      slider.setAttribute('aria-busy', 'false');
    }
  }

  // Handle arrow keys only while focus is within this section.
  section.addEventListener('keydown', event => {
    if (!swiper || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target.closest('button:disabled')) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (!next.disabled) swiper.slideNext();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (!previous.disabled) swiper.slidePrev();
    }
  });

  retry.addEventListener('click', load);
  void load();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFeedback, { once: true });
} else {
  initFeedback();
}
