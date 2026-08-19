import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import emailjs from '@emailjs/browser';

gsap.registerPlugin(ScrollTrigger);

const WSP = '5493624971816';

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
if (marqueeTrack) {
  const marqueeTween = gsap.to(marqueeTrack, {
    xPercent: -50,
    repeat: -1,
    duration: 25,
    ease: 'none',
  });
  marqueeTrack.addEventListener('mouseenter', () => marqueeTween.pause());
  marqueeTrack.addEventListener('mouseleave', () => marqueeTween.play());
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

// ===== Formulario de captura de la calculadora (envía por EmailJS) =====
const EMAILJS_SERVICE_ID = import.meta.env.PUBLIC_EMAILJS_SERVICE_ID;
const EMAILJS_TEMPLATE_ID = import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY;
if (EMAILJS_PUBLIC_KEY) emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });

const calcForm = document.getElementById('calcForm') as HTMLFormElement | null;
const calcSuccess = document.getElementById('calcSuccess') as HTMLElement | null;
if (calcForm) {
  calcForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombreInput = document.getElementById('leadNombre') as HTMLInputElement;
    const emailInput = document.getElementById('leadEmail') as HTMLInputElement;
    const dedicacionInput = document.getElementById('leadDedicacion') as HTMLSelectElement;
    const ingresosInput = document.getElementById('leadIngresos') as HTMLInputElement;
    const localidadInput = document.getElementById('leadLocalidad') as HTMLInputElement;
    const productoInput = document.getElementById('leadProducto') as HTMLInputElement;

    const nombre = nombreInput.value.trim();
    const email = emailInput.value.trim();
    const dedicacion = dedicacionInput.value.trim();
    const ingresos = ingresosInput.value.trim();
    const localidad = localidadInput.value.trim();
    const producto = productoInput.value.trim();

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!nombre || !emailOk || !dedicacion || !ingresos || !localidad || !producto) {
      alert('Completá todos los campos con un email válido.');
      return;
    }

    const lead = {
      nombre,
      email,
      dedicacion,
      ingresos,
      localidad,
      producto,
      visitas: ultimasVisitas,
      extra: ultimoExtra,
      fecha: new Date().toISOString(),
    };
    try {
      const leads = JSON.parse(localStorage.getItem('simo_leads') || '[]');
      leads.push(lead);
      localStorage.setItem('simo_leads', JSON.stringify(leads));
    } catch (_) {
      /* no-op */
    }

    const submitBtn = document.getElementById('calcCta') as HTMLButtonElement | null;
    const originalBtnHtml = submitBtn?.innerHTML ?? '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }

    const templateParams = {
      nombre,
      email,
      dedicacion,
      ingresos,
      localidad,
      producto,
      visitas_dia: String(ultimasVisitas),
      ganancia_actual: resHoy?.textContent || '',
      ganancia_simo: resSimo?.textContent || '',
      diferencia: resExtra?.textContent || '',
      fecha: new Date().toLocaleString('es-AR', { dateStyle: 'long', timeStyle: 'short' }),
    };

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      console.error('Faltan las variables de entorno de EmailJS (PUBLIC_EMAILJS_*).');
      alert('El formulario no está configurado todavía. Probá de nuevo más tarde.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
      return;
    }

    emailjs
      .send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
      .then(() => {
        calcForm.hidden = true;
        if (calcSuccess) {
          calcSuccess.hidden = false;
          calcSuccess.textContent = `¡Gracias, ${nombre}! Te escribimos a ${email} con un plan a tu medida.`;
        }
      })
      .catch((err) => {
        console.error('EmailJS error:', err);
        alert('No pudimos enviar tu solicitud. Probá de nuevo en unos segundos.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      });
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

// ===== Plan de pago (IKA y Corven Base / Full) =====
type PlanKey = 'base' | 'full';
const PLANES: Record<PlanKey, { nombre: string; valorNominal: number; anticipoPago: number; cuotaMensual12: number }> = {
  base: { nombre: 'IKA y Corven Base', valorNominal: 1700000, anticipoPago: 190000, cuotaMensual12: 316000 },
  full: { nombre: 'IKA y Corven Full', valorNominal: 2000000, anticipoPago: 290000, cuotaMensual12: 316000 },
};

const planSelect = document.getElementById('planSelect');
const cuotasControl = document.getElementById('cuotasControl');
const planAnticipoEl = document.getElementById('planAnticipo');
const cuotaMensualEl = document.getElementById('cuotaMensual');
const cuotaMensualCantEl = document.getElementById('cuotaMensualCant');
const cuotaSemanalEl = document.getElementById('cuotaSemanal');
const planCta = document.getElementById('planCta') as HTMLAnchorElement | null;

if (planSelect && cuotasControl && planAnticipoEl && cuotaMensualEl) {
  let planActivo: PlanKey = 'full';
  let mesesSeleccionados = 12;

  const calcularPlan = () => {
    const plan = PLANES[planActivo];
    const totalAPagar = plan.cuotaMensual12 * 12;
    const cuotaMensual = totalAPagar / mesesSeleccionados;
    const cuotaSemanalVal = cuotaMensual / 4;
    const semanas = mesesSeleccionados * 4;

    planAnticipoEl.textContent = pesos(plan.anticipoPago);
    cuotaMensualEl.textContent = pesos(cuotaMensual);
    if (cuotaMensualCantEl) cuotaMensualCantEl.textContent = `durante ${semanas} semanas`;
    if (cuotaSemanalEl) cuotaSemanalEl.textContent = pesos(cuotaSemanalVal);

    if (planCta) {
      const params = new URLSearchParams({
        plan: plan.nombre,
        anticipo: String(plan.anticipoPago),
        meses: String(mesesSeleccionados),
        cuotaMensual: String(Math.round(cuotaMensual)),
        cuotaSemanal: String(Math.round(cuotaSemanalVal)),
      });
      planCta.href = `/formulario?${params.toString()}`;
    }
  };

  planSelect.querySelectorAll<HTMLButtonElement>('.plan-card').forEach((card) => {
    card.addEventListener('click', () => {
      planSelect.querySelectorAll('.plan-card').forEach((c) => c.classList.remove('is-active'));
      card.classList.add('is-active');
      planActivo = (card.dataset.plan as PlanKey) || 'full';
      calcularPlan();
    });
  });

  cuotasControl.querySelectorAll<HTMLButtonElement>('.cuota-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      cuotasControl.querySelectorAll('.cuota-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      mesesSeleccionados = parseInt(btn.dataset.cuotas || '12', 10);
      calcularPlan();
    });
  });

  calcularPlan();
}
