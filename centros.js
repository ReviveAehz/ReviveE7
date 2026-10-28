const $ = id => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };

// Menú móvil
const menuBtn = document.querySelector('.menu-btn'), menu = $('menu');
menuBtn.addEventListener('click', () => { menuBtn.setAttribute('aria-expanded', menu.classList.toggle('abierto')); });

// DATOS DE EJEMPLO: aquí llegarán, desde la base de datos, SOLO los centros ya verificados.
// Nunca incluyas banco, titular ni CLABE en esta página: eso lo ven únicamente los donantes con sesión.
const TIPOS = ['Albergue', 'Casa hogar', 'Comedor comunitario', 'Asociación civil', 'Iglesia o parroquia', 'Otro'];
const centros = [
  { nombre: '[Centro de acopio 1]', tipo: 'Albergue', ubic: '[Dirección y ciudad]', horario: '[Horario de recepción]', desc: '[Descripción del centro.]', urgentes: ['[Insumo urgente 1]', '[Insumo urgente 2]'], tel: '[Teléfono]', correo: '[correo@ejemplo.com]', web: '' },
  { nombre: '[Centro de acopio 2]', tipo: 'Casa hogar', ubic: '[Dirección y ciudad]', horario: '[Horario de recepción]', desc: '[Descripción del centro.]', urgentes: ['[Insumo urgente 1]'], tel: '[Teléfono]', correo: '[correo@ejemplo.com]', web: '' },
  { nombre: '[Centro de acopio 3]', tipo: 'Comedor comunitario', ubic: '[Dirección y ciudad]', horario: '[Horario de recepción]', desc: '[Descripción del centro.]', urgentes: ['[Insumo urgente 1]', '[Insumo urgente 2]'], tel: '[Teléfono]', correo: '[correo@ejemplo.com]', web: '' }
];

TIPOS.forEach(t => $('f-tipo').append(new Option(t)));
const enlaceSeguro = u => /^https?:\/\//i.test(u) ? u : '';   // evita enlaces peligrosos

function render() {
  const q = $('f-buscar').value.trim().toLowerCase(), tipo = $('f-tipo').value, l = $('lista');
  l.replaceChildren();
  const vis = centros.filter(c => (!tipo || c.tipo === tipo) && (c.nombre + ' ' + c.ubic + ' ' + c.urgentes.join(' ')).toLowerCase().includes(q));
  vis.forEach(c => {
    const t = el('article', 'tarjeta');
    t.append(el('span', 'badge', c.tipo), el('h3', '', c.nombre));
    t.append(el('p', 'meta', 'Ubicación: ' + c.ubic), el('p', 'meta', 'Horario de recepción: ' + c.horario), el('p', '', c.desc));
    t.append(el('h4', '', 'Lo que necesitan ahora'));
    const ul = el('ul', 'necesita');
    c.urgentes.forEach(u => { const li = el('li'); li.append(el('span', '', u), el('b', '', 'Urgente')); ul.append(li); });
    t.append(ul, el('p', 'meta', 'Contacto: ' + c.tel + ' · ' + c.correo));
    const w = enlaceSeguro(c.web);
    if (w) { const a = el('a', '', 'Página web'); a.href = w; a.target = '_blank'; a.rel = 'noopener'; t.append(a); }
    const b = el('a', 'btn', 'Quiero donar aquí'); b.href = 'index.html#usuarios'; t.append(b);
    l.append(t);
  });
  $('f-vacio').hidden = vis.length > 0;
  $('f-cuenta').textContent = vis.length + ' centro(s) encontrado(s)';
}
$('f-buscar').oninput = render;
$('f-tipo').onchange = render;
render();