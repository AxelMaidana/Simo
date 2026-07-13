import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const WSP = '5493624971816';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Nav con sombra al hacer scroll =====
const nav = document.getElementById('nav');
window.addEventListener(
  'scroll',
  () => {
    nav?.classList.toggle('scrolled', window.scrollY > 10);
  },
  { passive: true }
);

// ===== Lenis smooth scroll, sincronizado con GSAP ScrollTrigger =====
if (!reducedMotion) {
  const lenis = new Lenis({
    autoRaf: false,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);
}

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

// ===== Números que cuentan solos (métricas de confianza) =====
function countUp(el: HTMLElement) {
  const target = parseFloat(el.dataset.count || '0');
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix || '';
  const format = (v: number) =>
    v.toLocaleString('es-AR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;

  if (reducedMotion) {
    el.textContent = format(target);
    return;
  }
  const obj = { val: 0 };
  gsap.to(obj, {
    val: target,
    duration: 1.6,
    ease: 'power4.out',
    onUpdate: () => {
      el.textContent = format(obj.val);
    },
  });
}

const statsEl = document.getElementById('stats');
if (statsEl) {
  ScrollTrigger.create({
    trigger: statsEl,
    start: 'top 80%',
    once: true,
    onEnter: () => {
      statsEl.querySelectorAll<HTMLElement>('[data-count]').forEach(countUp);
    },
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

// ===== Marquee infinito (GSAP) =====
const marqueeTrack = document.getElementById('marqueeTrack');
if (marqueeTrack && !reducedMotion) {
  const marqueeTween = gsap.to(marqueeTrack, {
    xPercent: -50,
    repeat: -1,
    duration: 30,
    ease: 'linear',
  });
  const marqueeSection = marqueeTrack.closest('.marquee');
  marqueeTrack.addEventListener('mouseenter', () => marqueeTween.pause());
  marqueeTrack.addEventListener('mouseleave', () => marqueeTween.play());
  if (marqueeSection) {
    ScrollTrigger.create({
      trigger: marqueeSection,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        if (self.isActive) marqueeTween.play();
        else marqueeTween.pause();
      },
    });
  }
}

// ===== Pausar animaciones CSS del hero cuando no se ven =====
const heroVisual = document.querySelector<HTMLElement>('.hero-visual');
if (heroVisual) {
  const loopObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        heroVisual.classList.toggle('anim-paused', !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );
  loopObserver.observe(heroVisual);
}

// ===== Aplica el número de WhatsApp a todos los links =====
document.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me/"]').forEach((a) => {
  const url = new URL(a.href);
  const text = url.searchParams.get('text') || '';
  a.href = `https://wa.me/${WSP}` + (text ? `?text=${encodeURIComponent(text)}` : '');
});

// ===== Calculadora de ganancia (lead magnet) =====
const visitas = document.getElementById('visitasHoy') as HTMLInputElement | null;
const ganancia = document.getElementById('gananciaUnit') as HTMLInputElement | null;
const visitasOut = document.getElementById('visitasHoyOut');
const gananciaOut = document.getElementById('gananciaUnitOut');
const resHoy = document.getElementById('resHoy') as HTMLElement | null;
const resSimo = document.getElementById('resSimo') as HTMLElement | null;
const resExtra = document.getElementById('resExtra') as HTMLElement | null;

const DIAS_MES = 24;
const MULTIPLICADOR = 2.5;

const pesos = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

let ultimoExtra = 0;
let ultimasVisitas = 4;

const tweenState = new WeakMap<HTMLElement, number>();
function tweenNumber(el: HTMLElement, to: number, prefix = '') {
  if (reducedMotion) {
    el.textContent = prefix + pesos(to);
    tweenState.set(el, to);
    return;
  }
  const from = tweenState.get(el) ?? to;
  tweenState.set(el, to);
  const obj = { val: from };
  gsap.to(obj, {
    val: to,
    duration: 0.35,
    ease: 'power4.out',
    onUpdate: () => {
      el.textContent = prefix + pesos(obj.val);
    },
  });
}

const pintarSlider = (el: HTMLInputElement) => {
  const pct = ((Number(el.value) - Number(el.min)) / (Number(el.max) - Number(el.min))) * 100;
  el.style.background = `linear-gradient(90deg, var(--color-teal) 0%, var(--color-teal) ${pct}%, #25405c ${pct}%)`;
};

const calcular = () => {
  if (!visitas || !ganancia || !resHoy || !resSimo || !resExtra) return;
  const v = parseInt(visitas.value, 10);
  const g = parseInt(ganancia.value, 10);
  const hoy = v * g * DIAS_MES;
  const conSimo = v * MULTIPLICADOR * g * DIAS_MES;
  const extra = conSimo - hoy;

  if (visitasOut) visitasOut.textContent = String(v);
  if (gananciaOut) gananciaOut.textContent = pesos(g);
  tweenNumber(resHoy, hoy);
  tweenNumber(resSimo, conSimo);
  tweenNumber(resExtra, extra, '+');

  ultimoExtra = extra;
  ultimasVisitas = v;

  pintarSlider(visitas);
  pintarSlider(ganancia);
};

if (visitas && ganancia) {
  visitas.addEventListener('input', calcular);
  ganancia.addEventListener('input', calcular);
  calcular();
}

// ===== Formulario de captura de la calculadora =====
const calcForm = document.getElementById('calcForm') as HTMLFormElement | null;
const calcSuccess = document.getElementById('calcSuccess') as HTMLElement | null;
if (calcForm) {
  calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombreInput = document.getElementById('leadNombre') as HTMLInputElement;
    const emailInput = document.getElementById('leadEmail') as HTMLInputElement;
    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nombre || !emailOk) {
      alert('Completá tu nombre y un email válido.');
      return;
    }

    const lead = { nombre, email, visitas: ultimasVisitas, extra: ultimoExtra, fecha: new Date().toISOString() };
    try {
      const leads = JSON.parse(localStorage.getItem('simo_leads') || '[]');
      leads.push(lead);
      localStorage.setItem('simo_leads', JSON.stringify(leads));
    } catch (_) {
      /* no-op */
    }

    calcForm.hidden = true;
    if (calcSuccess) {
      calcSuccess.hidden = false;
      calcSuccess.textContent = `¡Gracias, ${nombre}! Te escribimos a ${email} con un plan a tu medida.`;
    }
  });
}

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
