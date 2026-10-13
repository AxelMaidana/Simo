import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { WSP } from '../data/planes';

gsap.registerPlugin(ScrollTrigger);


const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Nav: efecto "pill" flotante al hacer scroll =====
const nav = document.getElementById('nav');
const navInner = nav?.querySelector<HTMLElement>('.nav-inner');
let navIsScrolled = false;

if (nav && navInner) {
  const isNarrow = () => window.innerWidth <= 640;
  const getScrolledPadX = () => (isNarrow() ? '1rem' : '1.4rem');
  const getScrolledGap = () => (isNarrow() ? '0.75rem' : '3.5rem');
  const getRestGap = () => (isNarrow() ? '0.75rem' : '2.75rem');

  // Mide el ancho que ocupa el contenido del nav con el padding y el gap "pill",
  // para que el ancho animado se ajuste al contenido en vez de dejar espacio de sobra.
  const measurePillWidth = () => {
    const prevNavStyle = nav.getAttribute('style');
    const prevInnerStyle = navInner.getAttribute('style');

    nav.style.width = 'fit-content';
    nav.style.maxWidth = 'none';
    navInner.style.paddingLeft = getScrolledPadX();
    navInner.style.paddingRight = getScrolledPadX();
    navInner.style.gap = getScrolledGap();

    const width = nav.getBoundingClientRect().width;

    prevNavStyle ? nav.setAttribute('style', prevNavStyle) : nav.removeAttribute('style');
    prevInnerStyle ? navInner.setAttribute('style', prevInnerStyle) : navInner.removeAttribute('style');

    return width;
  };

  const setNavScrolled = (scrolled: boolean) => {
    if (scrolled === navIsScrolled) return;
    navIsScrolled = scrolled;

    gsap.to(nav, {
      width: scrolled ? measurePillWidth() : '100%',
      top: scrolled ? 22 : 10,
      borderRadius: scrolled ? 999 : 0,
      boxShadow: scrolled ? '0 20px 45px -20px rgba(12, 27, 46, 0.35)' : '0 0 0 rgba(12, 27, 46, 0)',
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    });
    gsap.to(navInner, {
      paddingTop: scrolled ? '0.55rem' : '0.85rem',
      paddingBottom: scrolled ? '0.55rem' : '0.85rem',
      paddingLeft: scrolled ? getScrolledPadX() : '6vw',
      paddingRight: scrolled ? getScrolledPadX() : '6vw',
      gap: scrolled ? getScrolledGap() : getRestGap(),
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  };

  window.addEventListener('scroll', () => setNavScrolled(window.scrollY > 50), { passive: true });
  window.addEventListener(
    'resize',
    () => {
      if (navIsScrolled) gsap.set(nav, { width: measurePillWidth() });
    },
    { passive: true }
  );
  setNavScrolled(window.scrollY > 50);
}

// ===== Lenis smooth scroll, sincronizado con GSAP ScrollTrigger =====
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

// ===== Scroll animado al hacer click en enlaces internos (#ancla) =====
document.addEventListener('click', (e) => {
  const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link) return;
  const href = link.getAttribute('href');
  if (!href || href.length < 2) return;
  const target = document.querySelector<HTMLElement>(href);
  if (!target) return;

  const offsetAttr = link.dataset.scrollOffset;
  const offset = offsetAttr !== undefined ? Number(offsetAttr) : -84;

  e.preventDefault();
  lenis.scrollTo(target, { offset, duration: 1.2 });
  history.pushState(null, '', href);
});

// El formulario de pasos pide volver a mostrarse cuando cambia de paso en mobile.
document.addEventListener('simo:scrollto', (e) => {
  const target = (e as CustomEvent<HTMLElement>).detail;
  lenis.scrollTo(target, { offset: -100, duration: 0.6 });
});

// ===== Animación de entrada del hero (escalonada) =====
const introItems = gsap.utils.toArray<HTMLElement>('.intro-item');
if (reducedMotion) {
  introItems.forEach((el) => gsap.set(el, { opacity: 1, y: 0 }));
} else {
  introItems.forEach((el) => {
    const i = parseFloat(el.style.getPropertyValue('--i') || '0');
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: 'power3.out',
      delay: i * 0.12 + 0.1,
    });
  });
}

// ===== Aparición de elementos al hacer scroll =====
const revealItems = gsap.utils.toArray<HTMLElement>('.reveal');
if (reducedMotion) {
  revealItems.forEach((el) => gsap.set(el, { opacity: 1, y: 0 }));
} else {
  revealItems.forEach((el) => {
    const d = parseFloat(el.style.getPropertyValue('--d') || '0');
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      delay: d * 0.1,
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
      },
    });
  });
}

// ===== Línea de progreso en "Cómo funciona" =====
const stepsEl = document.getElementById('steps');
if (stepsEl) {
  const fill = stepsEl.querySelector<HTMLElement>('.steps-line-fill');
  ScrollTrigger.create({
    trigger: stepsEl,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      if (reducedMotion) {
        gsap.set(fill, { scaleX: 1 });
      } else {
        gsap.to(fill, { scaleX: 1, duration: 1.6, ease: 'power3.out', delay: 0.3 });
      }
    },
  });
}

// ===== Aplica el número de WhatsApp a todos los links =====
document.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me/"]').forEach((a) => {
  const url = new URL(a.href);
  const text = url.searchParams.get('text') || '';
  a.href = `https://wa.me/${WSP}` + (text ? `?text=${encodeURIComponent(text)}` : '');
});

// ===== FAQ: acordeón animado con GSAP =====
document.querySelectorAll<HTMLDetailsElement>('.faq-item').forEach((item) => {
  const summary = item.querySelector('summary');
  const body = item.querySelector<HTMLElement>('.faq-body');
  if (!summary || !body) return;

  if (reducedMotion) return;

  summary.addEventListener('click', (e) => {
    e.preventDefault();
    if (item.open) {
      const h = body.offsetHeight;
      gsap.set(body, { height: h, overflow: 'hidden' });
      gsap.to(body, {
        height: 0,
        duration: 0.3,
        ease: 'power2.inOut',
        onComplete: () => {
          item.open = false;
          gsap.set(body, { clearProps: 'height,overflow' });
        },
      });
    } else {
      item.open = true;
      const h = body.offsetHeight;
      gsap.fromTo(
        body,
        { height: 0, overflow: 'hidden' },
        {
          height: h,
          duration: 0.3,
          ease: 'power2.inOut',
          onComplete: () => gsap.set(body, { clearProps: 'height,overflow' }),
        }
      );
    }
  });
});
