const $ = id => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };

// Menú móvil
const menuBtn = document.querySelector('.menu-btn'), menu = $('menu');
menuBtn.addEventListener('click', () => { menuBtn.setAttribute('aria-expanded', menu.classList.toggle('abierto')); });

const TIPOS = ['Albergue', 'Casa hogar', 'Comedor comunitario', 'Asociación civil', 'Iglesia o parroquia', 'Otro'];
TIPOS.forEach(t => $('f-tipo').append(new Option(t)));
const enlaceSeguro = u => /^https?:\/\//i.test(u) ? u : '';   // evita enlaces peligrosos

let centros = [];                 // llegan desde Supabase
let cargado = false;

function render() {
  const q = $('f-buscar').value.trim().toLowerCase(), tipo = $('f-tipo').value, l = $('lista');
  l.replaceChildren();
  const vis = centros.filter(c => (!tipo || c.tipo === tipo) &&
    (c.nombre + ' ' + c.ubic + ' ' + c.urgentes.join(' ')).toLowerCase().includes(q));

  vis.forEach(c => {
    const t = el('article', 'tarjeta');
    t.append(el('span', 'badge', c.tipo), el('h3', '', c.nombre));
    t.append(el('p', 'meta', 'Ubicación: ' + c.ubic), el('p', 'meta', 'Horario de recepción: ' + c.horario));
    if (c.desc) t.append(el('p', '', c.desc));
    if (c.urgentes.length) {
      t.append(el('h4', '', 'Lo que necesitan ahora'));
      const ul = el('ul', 'necesita');
      c.urgentes.forEach(u => { const li = el('li'); li.append(el('span', '', u), el('b', '', 'Urgente')); ul.append(li); });
      t.append(ul);
    }
    const contacto = [c.tel, c.correo].filter(Boolean).join(' · ');
    if (contacto) t.append(el('p', 'meta', 'Contacto: ' + contacto));
    const w = enlaceSeguro(c.web);
    if (w) { const a = el('a', '', 'Página web'); a.href = w; a.target = '_blank'; a.rel = 'noopener'; t.append(a); }
    const b = el('a', 'btn', 'Quiero donar aquí'); b.href = 'index.html#usuarios'; t.append(b);
    l.append(t);
  });

  if (!cargado) return;
  $('f-vacio').textContent = centros.length ? 'No encontramos centros con esa búsqueda.' : 'Todavía no hay centros aprobados.';
  $('f-vacio').hidden = vis.length > 0;
  $('f-cuenta').textContent = vis.length + ' centro(s) encontrado(s)';
}
$('f-buscar').oninput = render;
$('f-tipo').onchange = render;

async function cargar() {
  $('f-cuenta').textContent = 'Cargando centros…';
  const { data, error } = await sb.from('centros')
    .select('usuario_id, nombre, ubicacion, horario, descripcion, tipos_centro(nombre), centro_contactos(tipo, valor), insumos_urgentes(nombre)')
    .eq('verificacion', 'aprobado').order('nombre');
  if (error) {
    console.error(error);
    $('f-cuenta').textContent = '';
    $('f-vacio').textContent = 'No pudimos cargar los centros. Intenta de nuevo.';
    $('f-vacio').hidden = false;
    return;
  }
  centros = data.map(c => {
    const ct = Object.fromEntries(c.centro_contactos.map(x => [x.tipo, x.valor]));
    return { id: c.usuario_id, nombre: c.nombre, tipo: c.tipos_centro ? c.tipos_centro.nombre : '', ubic: c.ubicacion,
             horario: c.horario, desc: c.descripcion || '', urgentes: c.insumos_urgentes.map(x => x.nombre),
             tel: ct.telefono || '', correo: ct.correo || '', web: ct.web || '' };
  });
  cargado = true;
  render();
}
cargar();