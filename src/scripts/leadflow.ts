import {
  MARCAS, VERSIONES, FOTOS, CUOTA_SEMANAL, SEMANAS, WSP, pesos, nombreMoto,
  PROVINCIAS_NEA, type MarcaKey, type VersionKey,
} from '../data/planes';

// El Google Form exige DNI, email, localidad, provincia e ingresos. No los pedimos
// de entrada: provincia y localidad se deducen del código de área y el resto
// se envía como pendiente para que lo complete el asesor.
const GOOGLE_FORM_ACTION =
  'https://docs.google.com/forms/u/0/d/e/1FAIpQLSe96FB0Q9PIkkIGe0X6Ce2ATL8p2d0KbWxt1ZPTUBzqM6Qa4w/formResponse';
const ENTRY = {
  nombre: 'entry.671640965',
  dni: 'entry.1956526813',
  tel: 'entry.932098576',
  email: 'entry.50744535',
  rubro: 'entry.1169236772',
  localidad: 'entry.1142098624',
  provincia: 'entry.1241461408',
  ingresos: 'entry.681900591',
  cuotas: 'entry.1443379784',
  producto: 'entry.670293137',
  integracion: 'entry.318947418',
  cuotaSemanal: 'entry.1496890500',
  prorrateo: 'entry.1621411405',
};
const PENDIENTE = 'Pendiente (lo pide el asesor)';

// Códigos de área del NEA → provincia y ciudad cabecera.
const AREAS: [string, string, string][] = [
  ['3644', 'Chaco', 'Pres. Roque Sáenz Peña'],
  ['3735', 'Chaco', 'Villa Ángela'],
  ['3731', 'Chaco', 'Charata'],
  ['362', 'Chaco', 'Resistencia'],
  ['3777', 'Corrientes', 'Goya'],
  ['3772', 'Corrientes', 'Paso de los Libres'],
  ['3773', 'Corrientes', 'Mercedes'],
  ['3774', 'Corrientes', 'Curuzú Cuatiá'],
  ['379', 'Corrientes', 'Corrientes'],
  ['3718', 'Formosa', 'Clorinda'],
  ['370', 'Formosa', 'Formosa'],
  ['3751', 'Misiones', 'Eldorado'],
  ['3755', 'Misiones', 'Oberá'],
  ['3757', 'Misiones', 'Puerto Iguazú'],
  ['3758', 'Misiones', 'Apóstoles'],
  ['376', 'Misiones', 'Posadas'],
];

// Deja el número como 10 dígitos nacionales (código de área + número):
// saca +54, el 9 de celulares, el 0 inicial y el 15 después del código de área.
function normalizarTel(raw: string) {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('9') && d.length > 10) d = d.slice(1);
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 12) {
    const area = AREAS.find(([code]) => d.startsWith(code) && d.slice(code.length, code.length + 2) === '15');
    if (area) d = area[0] + d.slice(area[0].length + 2);
  }
  return d;
}

const zonaPorTel = (tel: string) => AREAS.find(([code]) => tel.startsWith(code));

// Eventos de conversión: llegan a GA4 / GTM / Meta Pixel cuando estén instalados.
type Win = Window & { dataLayer?: object[]; gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
function track(event: string, params: Record<string, string | number> = {}) {
  const w = window as Win;
  w.dataLayer?.push({ event, ...params });
  w.gtag?.('event', event, params);
  if (event === 'lead_submit') w.fbq?.('track', 'Lead', params);
}

document.querySelectorAll<HTMLElement>('[data-leadflow]').forEach((root) => {
  const form = root.querySelector<HTMLFormElement>('[data-lf-form]')!;
  const panels = Array.from(root.querySelectorAll<HTMLElement>('.lf-panel'));
  const head = root.querySelector<HTMLElement>('[data-lf-head]')!;
  const label = root.querySelector<HTMLElement>('[data-lf-label]')!;
  const bar = root.querySelector<HTMLElement>('[data-lf-bar]')!;
  const back = root.querySelector<HTMLButtonElement>('[data-lf-back]')!;
  const pick = root.querySelector<HTMLElement>('[data-lf-pick]')!;
  const error = root.querySelector<HTMLElement>('[data-lf-error]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-lf-submit]')!;

  const TOTAL = 4;
  const DONE = 5;
  let step = 1;
  let started = false;

  const value = (name: string) =>
    (form.elements.namedItem(name) as RadioNodeList | HTMLInputElement | null)?.value.trim() ?? '';

  const marca = () => value('marca') as MarcaKey;
  const version = () => value('version') as VersionKey;
  const moto = () => nombreMoto(marca(), version());

  // El paso 2 muestra las fotos de la marca elegida.
  const mostrarMarca = (m: MarcaKey) => {
    root.querySelector('[data-lf-marca]')!.textContent = MARCAS[m].nombre;
    root.querySelectorAll<HTMLImageElement>('[data-lf-img]').forEach((img) => {
      img.src = FOTOS[m][img.dataset.lfImg as VersionKey];
      img.alt = `${MARCAS[m].nombre} ${MARCAS[m].modelo}`;
    });
  };

  const check = (name: string, val: string) => {
    const input = form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${val}"]`);
    if (input) input.checked = true;
  };

  const goTo = (n: number) => {
    step = n;
    panels.forEach((p) => (p.hidden = Number(p.dataset.step) !== n));
    label.textContent = n <= TOTAL ? `Paso ${n} de ${TOTAL}` : 'Solicitud enviada';
    bar.style.setProperty('--p', `${(Math.min(n, TOTAL) / TOTAL) * 100}%`);
    back.hidden = n === 1 || n === DONE;
    head.classList.toggle('is-done', n === DONE);

    if (n === 4) {
      pick.textContent = `${moto()} · ${pesos(CUOTA_SEMANAL)}/semana`;
    }
    // En mobile el panel puede quedar fuera de vista al cambiar de paso.
    if (root.getBoundingClientRect().top < 0) {
      document.dispatchEvent(new CustomEvent('simo:scrollto', { detail: root }));
    }
    if (started) track('lead_step', { step: n });
  };

  form.addEventListener('change', (e) => {
    const input = e.target as HTMLInputElement;
    if (input.type !== 'radio') return;
    if (!started) {
      started = true;
      track('lead_start');
    }
    if (input.name === 'marca') {
      mostrarMarca(marca());
      form.querySelectorAll<HTMLInputElement>('input[name="version"]').forEach((v) => (v.checked = false));
      setTimeout(() => goTo(2), 180);
    }
    if (input.name === 'version') setTimeout(() => goTo(3), 180);
    if ((input.name === 'rubro' || input.name === 'cobro') && value('rubro') && value('cobro')) {
      setTimeout(() => goTo(4), 220);
    }
  });

  // "La quiero" en la sección de motos: precarga marca y versión y salta al perfil.
  document.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-pick-marca]');
    if (!btn || step === DONE) return;
    e.preventDefault();
    const m = btn.dataset.pickMarca as MarcaKey;
    check('marca', m);
    check('version', btn.dataset.pickVersion!);
    mostrarMarca(m);
    if (!started) {
      started = true;
      track('lead_start', { origen: 'catalogo' });
    }
    goTo(3);
    document.dispatchEvent(new CustomEvent('simo:scrollto', { detail: root }));
  });

  back.addEventListener('click', () => goTo(step - 1));

  // Si el código de área es del NEA, la provincia se completa sola (se puede cambiar).
  const provinciaSel = form.elements.namedItem('provincia') as HTMLSelectElement;
  form.elements.namedItem('tel')!.addEventListener('input', (e) => {
    if (provinciaSel.dataset.touched) return;
    const zona = zonaPorTel(normalizarTel((e.target as HTMLInputElement).value));
    provinciaSel.value = zona ? zona[1] : '';
  });
  provinciaSel.addEventListener('change', () => (provinciaSel.dataset.touched = '1'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = value('nombre');
    const tel = normalizarTel(value('tel'));

    const showError = (msg: string, field: string) => {
      error.textContent = msg;
      error.hidden = false;
      (form.elements.namedItem(field) as HTMLInputElement).focus();
    };
    if (nombre.length < 2) return showError('Decinos tu nombre así sabemos cómo llamarte.', 'nombre');
    if (tel.length < 10 || tel.length > 11) {
      return showError('Revisá el número: código de área + número, por ejemplo 362 4123456.', 'tel');
    }
    const email = value('email');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return showError('Revisá tu email, o dejalo vacío si no querés darlo.', 'email');
    }
    const dni = value('dni').replace(/\D/g, '');
    if (dni.length < 7 || dni.length > 8) return showError('Revisá tu DNI: son 7 u 8 números, sin puntos.', 'dni');
    const provincia = value('provincia');
    if (!provincia) return showError('Elegí tu provincia.', 'provincia');
    error.hidden = true;

    const key = `${marca()}-${version()}`;
    const nombreProducto = moto();
    const anticipo = VERSIONES[version()].anticipoPago;
    const rubro = value('rubro');
    const cobro = value('cobro');
    const zona = zonaPorTel(tel);

    const data = new URLSearchParams({
      [ENTRY.nombre]: nombre,
      [ENTRY.dni]: dni,
      [ENTRY.tel]: tel,
      [ENTRY.email]: email || 'No informado',
      [ENTRY.rubro]: rubro,
      // El Google Form solo acepta las provincias del NEA u "Otra": la provincia real va en localidad.
      [ENTRY.localidad]: zona && zona[1] === provincia
        ? `${zona[2]}, ${provincia} (ciudad por código de área, a confirmar)`
        : `${provincia} (localidad pendiente)`,
      [ENTRY.provincia]: PROVINCIAS_NEA.includes(provincia) ? provincia : 'Otra',
      [ENTRY.ingresos]: `Cobra: ${cobro} · monto ${PENDIENTE.toLowerCase()}`,
      [ENTRY.cuotas]: `${SEMANAS / 4} meses (${SEMANAS} cuotas semanales)`,
      [ENTRY.producto]: nombreProducto,
      [ENTRY.integracion]: `3 pagos de ${pesos(anticipo)}`,
      [ENTRY.cuotaSemanal]: pesos(CUOTA_SEMANAL),
      [ENTRY.prorrateo]: '3 pagos',
    });

    submit.disabled = true;
    submit.textContent = 'Enviando...';
    try {
      // Google Forms no expone CORS: la respuesta es opaca, así que si la red
      // no falla damos el envío por hecho.
      await fetch(GOOGLE_FORM_ACTION, { method: 'POST', mode: 'no-cors', body: data });
    } catch (err) {
      console.error('No se pudo guardar el lead en Google Forms:', err);
    }
    track('lead_submit', { plan: key, rubro, cobro, provincia });

    const mensaje =
      `Hola SIMO, soy ${nombre}. Ya envié mi solicitud para la ${nombreProducto} ` +
      `(${pesos(CUOTA_SEMANAL)} por semana) y quería más información. ` +
      `Me dedico a: ${rubro}. Cobro: ${cobro}.`;
    const wsp = root.querySelector<HTMLAnchorElement>('[data-lf-wsp]')!;
    wsp.href = `https://wa.me/${WSP}?text=${encodeURIComponent(mensaje)}`;
    wsp.addEventListener('click', () => track('lead_whatsapp', { plan: key }), { once: true });

    root.querySelector('[data-lf-done-title]')!.textContent = `¡Listo, ${nombre.split(' ')[0]}!`;
    root.querySelector('[data-lf-done-text]')!.textContent =
      `Tu solicitud para la ${nombreProducto} ya fue enviada a evaluación. Te vamos a contactar por WhatsApp al ${tel}` +
      (email ? ` o por correo a ${email}.` : '.');
    goTo(DONE);
    root.querySelector<HTMLElement>('.lf-done')?.focus({ preventScroll: true });
  });

  goTo(1);
});
