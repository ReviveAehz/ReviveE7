// ===== Utilidades =====
const $ = id => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
const pesos = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
const fmt = d => new Date(d + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
const palabras = t => t.trim() ? t.trim().split(/\s+/).length : 0;
const anio = new Date().getFullYear();
const ESTADOS = ['Pendiente', 'Listo para entregar', 'Entregado'];
function gracias(msg) { const g = $('gracias'); g.textContent = msg; g.hidden = false; setTimeout(() => g.hidden = true, 3000); }
const badge = e => el('span', 'badge' + (e === 'Entregado' || e === 'Confirmada' ? ' ok' : e === 'Listo para entregar' ? ' listo' : ''), e);

// ===== DATOS DE EJEMPLO: aquí llegarán los datos reales desde la base de datos =====
const centro = {
  nombre: '[Nombre del centro]', tipo: 'Albergue', ubic: '[Dirección]', horario: '[Horario de recepción]',
  contacto: { tel: '5500000000', correo: 'centro@ejemplo.com', fb: '', ig: '', tk: '', x: '', web: '' },
  imgs: [], desc: '', urgentes: ['[Insumo urgente 1]', '[Insumo urgente 2]'],
  banco: '', titular: '', clabe: '',
  verificado: true   // false = cuenta en revisión (no aparece para los donantes)
};
const donantes = [
  { id: 1, nombre: '[Donante de ejemplo 1]', correo: 'donante1@ejemplo.com', tel: '5500000001',
    dons: [{ desc: 'Ropa × 3', fecha: '2026-10-10', estado: 'Entregado' }, { desc: 'Alimentos × 5', fecha: '2026-10-20', estado: 'Pendiente' }] },
  { id: 2, nombre: '[Donante de ejemplo 2]', correo: 'donante2@ejemplo.com', tel: '',
    dons: [{ desc: 'Juguetes × 2', fecha: '2026-10-22', estado: 'Listo para entregar' }] }
];
const dineros = [
  { donante: '[Donante de ejemplo 1]', monto: 500, fecha: '2026-10-15', ref: 'DON-0001', comp: 'comprobante.jpg', estado: 'Por confirmar' },
  { donante: '[Donante de ejemplo 2]', monto: 200, fecha: '2026-10-16', ref: 'DON-0002', comp: '', estado: 'Por confirmar' }
];
const enviados = [];

// ===== Ventanas y pestañas =====
document.querySelectorAll('[data-dlg]').forEach(b => b.onclick = () => $(b.dataset.dlg).showModal());
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d || e.target.hasAttribute('data-cerrar')) d.close(); }));
const tabs = document.querySelectorAll('[data-tab]');
tabs.forEach(t => t.onclick = () => {
  tabs.forEach(x => x.classList.toggle('activo', x === t));
  document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== t.dataset.tab);
});

// ===== Contadores de palabras (bloquean el envío si se pasan del máximo) =====
function contar(taId, cId, max) {
  const ta = $(taId), n = palabras(ta.value), c = $(cId);
  c.textContent = n + ' / ' + max + ' palabras';
  c.classList.toggle('excede', n > max);
  ta.setCustomValidity(n > max ? 'Máximo ' + max + ' palabras' : '');
}
$('e-desc').oninput = () => contar('e-desc', 'e-dcuenta', 500);
$('mo-desc').oninput = () => contar('mo-desc', 'mo-cuenta', 150);

// ===== Imágenes con límite =====
function pintarMinis(cont, arr, refrescar) {
  cont.replaceChildren();
  arr.forEach((u, i) => {
    const d = el('div', 'mini'), im = document.createElement('img'), b = el('button', '', '×');
    im.src = u; im.alt = 'Imagen ' + (i + 1);
    b.type = 'button'; b.setAttribute('aria-label', 'Quitar imagen ' + (i + 1)); b.onclick = () => { arr.splice(i, 1); refrescar(); };
    d.append(im, b); cont.append(d);
  });
}
function agregar(input, arr, max, refrescar) {
  const libre = max - arr.length, files = [...input.files];
  if (files.length > libre) gracias('Máximo ' + max + ' imágenes. Se agregaron ' + libre + '.');
  files.slice(0, libre).forEach(f => arr.push(URL.createObjectURL(f)));
  input.value = ''; refrescar();
}
let imgsEdit = [], fotosMo = [];
const refImgsEdit = () => { pintarMinis($('e-prev'), imgsEdit, refImgsEdit); $('e-icuenta').textContent = imgsEdit.length + ' de 10 imágenes'; };
const refFotosMo = () => { pintarMinis($('mo-prev'), fotosMo, refFotosMo); $('mo-fcuenta').textContent = fotosMo.length + ' de 5 fotos'; };
$('e-imgs').onchange = () => agregar($('e-imgs'), imgsEdit, 10, refImgsEdit);
$('mo-fotos').onchange = () => agregar($('mo-fotos'), fotosMo, 5, refFotosMo);

// ===== Editar datos del establecimiento =====
const idsContacto = { tel: 'e-tel', correo: 'e-correo', fb: 'e-fb', ig: 'e-ig', tk: 'e-tk', x: 'e-x', web: 'e-web' };
function validarContactos() {   // mínimo 2 datos de contacto
  const n = Object.values(idsContacto).filter(id => $(id).value.trim()).length;
  $('e-ccuenta').textContent = '(mínimo 2 · llevas ' + n + ')';
  $('e-tel').setCustomValidity(n < 2 ? 'Agrega al menos 2 datos de contacto' : '');
}
Object.values(idsContacto).forEach(id => $(id).addEventListener('input', validarContactos));

function cargarForm() {   // llena el formulario con lo guardado (y descarta lo no guardado)
  $('e-nombre').value = centro.nombre; $('e-ubic').value = centro.ubic; $('e-tipo').value = centro.tipo; $('e-horario').value = centro.horario;
  Object.entries(idsContacto).forEach(([k, id]) => $(id).value = centro.contacto[k] || '');
  $('e-desc').value = centro.desc; $('e-urg').value = centro.urgentes.join('\n');
  $('e-banco').value = centro.banco; $('e-titular').value = centro.titular; $('e-clabe').value = centro.clabe;
  imgsEdit = [...centro.imgs]; refImgsEdit(); validarContactos(); contar('e-desc', 'e-dcuenta', 500);
}
$('d-editar').addEventListener('close', cargarForm);
$('e-cancelar').onclick = () => $('d-editar').close();
$('f-editar').onsubmit = e => {
  e.preventDefault();
  Object.assign(centro, {
    nombre: $('e-nombre').value.trim(), ubic: $('e-ubic').value.trim(), tipo: $('e-tipo').value, horario: $('e-horario').value.trim(),
    contacto: Object.fromEntries(Object.entries(idsContacto).map(([k, id]) => [k, $(id).value.trim()])),
    imgs: [...imgsEdit], desc: $('e-desc').value.trim(),
    urgentes: $('e-urg').value.split('\n').map(s => s.trim()).filter(Boolean),
    banco: $('e-banco').value.trim(), titular: $('e-titular').value.trim(), clabe: $('e-clabe').value.trim()
  });   // aquí se enviarán los datos a la base de datos
  $('d-editar').close(); render(); gracias('Datos actualizados ✓');
};

// ===== Bandeja de usuarios =====
function pintarUsuario(d) {
  $('t-usuario').textContent = d.nombre;
  const c = $('usr-cuerpo'); c.replaceChildren();
  c.append(el('p', 'dato', 'Correo: ' + d.correo + (d.tel ? ' · Teléfono: ' + d.tel : '')), el('h4', '', 'Donaciones'));
  if (!d.dons.length) c.append(el('p', 'vacio', 'Este donante aún no tiene donaciones.'));
  d.dons.forEach(x => {
    const r = el('div', 'art'), s = el('select', 'estado');
    s.setAttribute('aria-label', 'Estado de ' + x.desc);
    ESTADOS.forEach(o => { const op = el('option', '', o); op.selected = o === x.estado; s.append(op); });
    s.onchange = () => { x.estado = s.value; render(); pintarUsuario(d); };
    r.append(el('span', 'art-nom', x.desc + ' · ' + fmt(x.fecha)), s); c.append(r);
  });
  $('usr-confirmar').onclick = () => {
    const n = d.dons.filter(x => x.estado !== 'Entregado').length;
    if (!n) { gracias('No hay donaciones por confirmar'); return; }
    d.dons.forEach(x => x.estado = 'Entregado'); render(); pintarUsuario(d); gracias('Donación confirmada ✓');
  };
  $('usr-eliminar').onclick = () => {
    if (confirm('¿Quitar a ' + d.nombre + ' de tu bandeja? Su cuenta no se borra.')) { donantes.splice(donantes.indexOf(d), 1); $('d-usuario').close(); render(); }
  };
}
function abrirUsuario(d) { pintarUsuario(d); $('d-usuario').showModal(); }
$('ban-buscar').oninput = () => render();

// ===== Transferencias =====
function resolverDinero(d, estado) { d.estado = estado; render(); gracias(estado === 'Confirmada' ? 'Transferencia confirmada ✓' : 'Marcada como no encontrada'); }

// ===== Motivar a usuarios =====
function llenarDon() {
  const d = donantes.find(x => String(x.id) === $('mo-donante').value), s = $('mo-don');
  s.replaceChildren(new Option(d ? 'Selecciona la donación' : 'Primero elige un donante', ''));
  if (d) d.dons.filter(x => x.estado === 'Entregado').forEach(x => s.append(new Option(x.desc + ' · ' + fmt(x.fecha), x.desc)));
}
$('mo-donante').onchange = llenarDon;
$('f-motivar').onsubmit = e => {
  e.preventDefault();
  const d = donantes.find(x => String(x.id) === $('mo-donante').value);
  enviados.unshift({ donante: d.nombre, don: $('mo-don').value, texto: $('mo-desc').value.trim(), fotos: [...fotosMo], fecha: new Date().toISOString().slice(0, 10) });
  // aquí se enviará el mensaje y las fotos al donante (aparecen en su sección "Así se usó tu donación")
  e.target.reset(); fotosMo = []; refFotosMo(); contar('mo-desc', 'mo-cuenta', 150);
  render(); gracias('Mensaje enviado a ' + d.nombre + ' 💙');
};

// ===== Dibujar todo =====
function render() {
  // Datos generales y aviso de verificación
  const ini = centro.nombre.replace(/[\[\]]/g, '').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CA';
  $('c-ini').textContent = ini; $('c-nombre-lat').textContent = centro.nombre; $('c-nombre').textContent = centro.nombre;
  $('aviso-verif').hidden = centro.verificado;

  // Resumen
  $('s-art').textContent = donantes.reduce((t, d) => t + d.dons.filter(x => x.estado !== 'Entregado').length, 0);
  $('s-din').textContent = dineros.filter(d => d.estado === 'Por confirmar').length;
  $('s-don').textContent = donantes.length;

  // Bandeja
  const q = $('ban-buscar').value.trim().toLowerCase(), bl = $('ban-lista'); bl.replaceChildren();
  const vis = donantes.filter(d => d.nombre.toLowerCase().includes(q));
  vis.forEach(d => {
    const pend = d.dons.filter(x => x.estado !== 'Entregado').length, t = el('article', 'tarjeta');
    t.append(el('h3', '', d.nombre), el('p', 'meta', d.correo), el('p', '', d.dons.length + ' donación(es) · ' + pend + ' por confirmar'));
    const b = el('button', 'btn', 'Ver y confirmar'); b.onclick = () => abrirUsuario(d); t.append(b); bl.append(t);
  });
  $('ban-vacio').hidden = vis.length > 0;

  // Transferencias
  const dl = $('din-lista'); dl.replaceChildren();
  dineros.forEach(d => {
    const t = el('article', 'tarjeta entrega'), r = el('div', 'art');
    t.append(el('h3', '', pesos(d.monto) + ' · ' + d.donante));
    r.append(el('span', '', fmt(d.fecha) + ' · Referencia ' + d.ref), badge(d.estado)); t.append(r);
    if (d.comp) t.append(el('p', 'meta', 'Comprobante: ' + d.comp));
    if (d.estado === 'Por confirmar') {
      const bb = el('div', 'botones'), ok = el('button', 'btn', 'Confirmar: ya llegó'), no = el('button', 'btn claro', 'No la encuentro');
      ok.onclick = () => resolverDinero(d, 'Confirmada'); no.onclick = () => resolverDinero(d, 'No encontrada');
      bb.append(ok, no); t.append(bb);
    }
    dl.append(t);
  });
  $('din-vacio').hidden = dineros.length > 0;
  $('din-total').textContent = pesos(dineros.filter(d => d.estado === 'Confirmada' && new Date(d.fecha).getFullYear() === anio).reduce((t, d) => t + d.monto, 0));

  // Motivar: donantes que ya donaron + enviados
  const elig = donantes.filter(d => d.dons.some(x => x.estado === 'Entregado')), s = $('mo-donante'), prev = s.value;
  s.replaceChildren(new Option(elig.length ? 'Selecciona un donante' : 'Aún no hay donantes con donaciones entregadas', ''));
  elig.forEach(d => s.append(new Option(d.nombre, d.id)));
  s.value = elig.some(d => String(d.id) === prev) ? prev : ''; llenarDon();
  const ml = $('mo-lista'); ml.replaceChildren();
  enviados.forEach(m => {
    const t = el('article', 'tarjeta entrega');
    t.append(el('h3', '', m.donante), el('p', 'meta', fmt(m.fecha) + ' · ' + m.don), el('p', '', m.texto));
    if (m.fotos.length) { const g = el('div', 'galeria'); m.fotos.forEach(u => { const im = document.createElement('img'); im.src = u; im.alt = 'Foto enviada'; g.append(im); }); t.append(g); }
    ml.append(t);
  });
  $('mo-vacio').hidden = enviados.length > 0;

  // Mi establecimiento
  $('v-nombre').textContent = centro.nombre; $('v-tipo').textContent = centro.tipo || '—'; $('v-ubic').textContent = centro.ubic || '—';
  $('v-horario').textContent = centro.horario || '—'; $('v-desc').textContent = centro.desc || '—';
  const etiquetas = { tel: 'Teléfono', correo: 'Correo', fb: 'Facebook', ig: 'Instagram', tk: 'TikTok', x: 'X', web: 'Página web' };
  const cl = $('v-contacto'); cl.replaceChildren();
  Object.entries(etiquetas).filter(([k]) => centro.contacto[k]).forEach(([k, n]) => { const li = el('li'); li.append(el('strong', '', n + ': '), document.createTextNode(centro.contacto[k])); cl.append(li); });
  const ul = $('v-urg'); ul.replaceChildren();
  centro.urgentes.forEach(u => { const li = el('li'); li.append(el('span', '', u), el('b', '', 'Urgente')); ul.append(li); });
  const gi = $('v-imgs'); gi.replaceChildren();
  centro.imgs.forEach((u, i) => { const im = document.createElement('img'); im.src = u; im.alt = 'Imagen ' + (i + 1) + ' del establecimiento'; im.loading = 'lazy'; gi.append(im); });
  $('v-imgs-vacio').hidden = centro.imgs.length > 0;
}

cargarForm(); refFotosMo(); render();

// ===== Sesión real (Supabase) =====
iniciarPagina('centro', async user => {
  const { data: c, error } = await sb.from('centros').select('nombre, verificacion').eq('usuario_id', user.id).single();
  if (error || !c) { console.error(error); return; }
  centro.nombre = c.nombre;
  centro.verificado = c.verificacion === 'aprobado';
  render();
});