// ===== Utilidades =====
const $ = id => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };
const pesos = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
const fmt = d => new Date(d + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
const palabras = t => t.trim() ? t.trim().split(/\s+/).length : 0;
const anio = new Date().getFullYear();
const ESTADOS = ['Pendiente', 'Listo para entregar', 'Entregado'];
const A_DB = { 'Pendiente': 'pendiente', 'Listo para entregar': 'listo_para_entregar', 'Entregado': 'entregado' };
const DE_DB = { pendiente: 'Pendiente', listo_para_entregar: 'Listo para entregar', entregado: 'Entregado' };
const T_DB = { por_confirmar: 'Por confirmar', confirmada: 'Confirmada', no_encontrada: 'No encontrada' };
const ETIQUETAS = { telefono: 'Teléfono', correo: 'Correo', facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok', x: 'X', web: 'Página web' };
const idsContacto = { telefono: 'e-tel', correo: 'e-correo', facebook: 'e-fb', instagram: 'e-ig', tiktok: 'e-tk', x: 'e-x', web: 'e-web' };
function gracias(msg) { const g = $('gracias'); g.textContent = msg; g.hidden = false; setTimeout(() => g.hidden = true, 3000); }
const badge = e => el('span', 'badge' + (e === 'Entregado' || e === 'Confirmada' ? ' ok' : e === 'Listo para entregar' ? ' listo' : ''), e);
const fallo = (x, msg) => { console.error(x); alert(msg + (x && x.message ? ' (' + x.message + ')' : '')); };
const nombreArt = a => !a ? 'Artículo' : (a.tipos_articulo && a.tipos_articulo.nombre === 'Otro (escribir)' ? (a.detalle || 'Otro') : (a.tipos_articulo ? a.tipos_articulo.nombre : 'Artículo'));
const nombreDe = d => d ? (d.nombre + ' ' + (d.apellido_paterno || '')).trim() : 'Donante';

// ===== Datos (vienen de Supabase) =====
let uid = null;
const centro = { nombre: '', tipo: '', ubic: '', horario: '', desc: '', verificado: false, contactos: {}, imagenes: [], urgentes: [], cuenta: null };
let bandeja = [], donDe = {}, donNombre = {}, dineros = [], enviados = [];
let imgsEdit = [], fotosMo = [];

// ===== Ventanas y pestañas =====
document.querySelectorAll('[data-dlg]').forEach(b => b.onclick = () => $(b.dataset.dlg).showModal());
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d || e.target.hasAttribute('data-cerrar')) d.close(); }));
const tabs = document.querySelectorAll('[data-tab]');
tabs.forEach(t => t.onclick = () => {
  tabs.forEach(x => x.classList.toggle('activo', x === t));
  document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== t.dataset.tab);
});

// ===== Contadores de palabras =====
function contar(taId, cId, max) {
  const ta = $(taId), n = palabras(ta.value), c = $(cId);
  c.textContent = n + ' / ' + max + ' palabras'; c.classList.toggle('excede', n > max);
  ta.setCustomValidity(n > max ? 'Máximo ' + max + ' palabras' : '');
}
$('e-desc').oninput = () => contar('e-desc', 'e-dcuenta', 500);
$('mo-desc').oninput = () => contar('mo-desc', 'mo-cuenta', 150);

// ===== Imágenes con límite (cada una: {id, ruta, url} guardada, o {file, url} nueva) =====
function pintarMinis(cont, arr, refrescar) {
  cont.replaceChildren();
  arr.forEach((u, i) => {
    const d = el('div', 'mini'), im = document.createElement('img'), b = el('button', '', '×');
    im.src = u.url; im.alt = 'Imagen ' + (i + 1);
    b.type = 'button'; b.setAttribute('aria-label', 'Quitar imagen ' + (i + 1)); b.onclick = () => { arr.splice(i, 1); refrescar(); };
    d.append(im, b); cont.append(d);
  });
}
function agregar(input, arr, max, refrescar) {
  const libre = max - arr.length, files = [...input.files];
  if (files.length > libre) gracias('Máximo ' + max + ' imágenes. Se agregaron ' + libre + '.');
  files.slice(0, libre).forEach(f => arr.push({ file: f, url: URL.createObjectURL(f) }));
  input.value = ''; refrescar();
}
const refImgsEdit = () => { pintarMinis($('e-prev'), imgsEdit, refImgsEdit); $('e-icuenta').textContent = imgsEdit.length + ' de 10 imágenes'; };
const refFotosMo = () => { pintarMinis($('mo-prev'), fotosMo, refFotosMo); $('mo-fcuenta').textContent = fotosMo.length + ' de 5 fotos'; };
$('e-imgs').onchange = () => agregar($('e-imgs'), imgsEdit, 10, refImgsEdit);
$('mo-fotos').onchange = () => agregar($('mo-fotos'), fotosMo, 5, refFotosMo);

// ===== Carga de datos =====
async function cargarCentro() {
  const [c, ct, im, ins, cb] = await Promise.all([
    sb.from('centros').select('nombre, ubicacion, horario, descripcion, verificacion, tipos_centro(nombre)').eq('usuario_id', uid).single(),
    sb.from('centro_contactos').select('tipo, valor').eq('centro_id', uid),
    sb.from('centro_imagenes').select('id, ruta').eq('centro_id', uid).order('orden').order('id'),
    sb.from('insumos_urgentes').select('nombre').eq('centro_id', uid).order('id'),
    sb.from('cuentas_bancarias').select('id, banco, titular, clabe').eq('centro_id', uid).limit(1)
  ]);
  for (const r of [c, ct, im, ins, cb]) if (r.error) throw r.error;
  Object.assign(centro, {
    nombre: c.data.nombre, tipo: c.data.tipos_centro ? c.data.tipos_centro.nombre : '', ubic: c.data.ubicacion,
    horario: c.data.horario, desc: c.data.descripcion || '', verificado: c.data.verificacion === 'aprobado',
    contactos: Object.fromEntries(ct.data.map(x => [x.tipo, x.valor])),
    imagenes: im.data.map(x => ({ id: x.id, ruta: x.ruta, url: sb.storage.from('publico').getPublicUrl(x.ruta).data.publicUrl })),
    urgentes: ins.data.map(x => x.nombre), cuenta: cb.data[0] || null
  });
}
async function cargarBandeja() {
  const [b, d] = await Promise.all([
    sb.rpc('mi_bandeja'),
    sb.from('donaciones').select('id, donante_id, fecha_entrega, hora_entrega, nota, donantes(nombre, apellido_paterno), donacion_articulos(articulo_id, estado, articulos(cantidad, detalle, tipos_articulo(nombre)))')
      .eq('centro_id', uid).order('fecha_entrega')
  ]);
  if (b.error) throw b.error; if (d.error) throw d.error;
  bandeja = b.data.map(x => ({ id: x.donante_id, nombre: nombreDe(x), correo: x.correo, tel: x.telefono || '', donaciones: Number(x.donaciones), pendientes: Number(x.pendientes) }));
  donDe = {}; donNombre = {};
  d.data.forEach(x => {
    donNombre[x.donante_id] = nombreDe(x.donantes);
    (donDe[x.donante_id] = donDe[x.donante_id] || []).push({ id: x.id, fecha: x.fecha_entrega, hora: x.hora_entrega.slice(0, 5), nota: x.nota || '',
      arts: x.donacion_articulos.map(a => ({ id: a.articulo_id, estado: DE_DB[a.estado], nom: nombreArt(a.articulos), cant: a.articulos ? a.articulos.cantidad : '' })) });
  });
}
async function cargarDinero() {
  const { data, error } = await sb.from('transferencias')
    .select('id, monto, fecha_transferencia, referencia, comprobante_ruta, estado, donantes(nombre, apellido_paterno), cuentas_bancarias!inner(centro_id)')
    .eq('cuentas_bancarias.centro_id', uid).order('creado_en', { ascending: false });
  if (error) throw error;
  dineros = data.map(t => ({ id: t.id, monto: Number(t.monto), fecha: t.fecha_transferencia, ref: t.referencia, comp: t.comprobante_ruta, estado: T_DB[t.estado], donante: nombreDe(t.donantes) }));
}
async function cargarImpacto() {
  const { data, error } = await sb.from('reportes_impacto')
    .select('id, mensaje, creado_en, gracias_enviado, donaciones!inner(centro_id, fecha_entrega, donantes(nombre, apellido_paterno)), reporte_fotos(ruta)')
    .eq('donaciones.centro_id', uid).order('creado_en', { ascending: false });
  if (error) throw error;
  const rutas = data.flatMap(r => r.reporte_fotos.map(f => f.ruta)), firmadas = {};
  if (rutas.length) {
    const { data: s } = await sb.storage.from('privado').createSignedUrls(rutas, 3600);
    (s || []).forEach(x => { if (x.signedUrl) firmadas[x.path] = x.signedUrl; });
  }
  enviados = data.map(r => ({ donante: nombreDe(r.donaciones.donantes), texto: r.mensaje, fecha: r.creado_en.slice(0, 10), gracias: r.gracias_enviado,
    fotos: r.reporte_fotos.map(f => firmadas[f.ruta]).filter(Boolean) }));
}
async function recargarOperacion() { await Promise.all([cargarBandeja(), cargarDinero()]); render(); }

// ===== Bandeja: ver, cambiar estado, confirmar, quitar =====
async function cambiarEstado(art, nuevo, d) {
  const { error } = await sb.from('donacion_articulos').update({ estado: A_DB[nuevo] }).eq('articulo_id', art.id);
  if (error) return fallo(error, 'No se pudo cambiar el estado.');
  await cargarBandeja(); render(); pintarUsuario(d);
  if (nuevo === 'Entregado') gracias('Entrega confirmada ✓');
}
function pintarUsuario(d) {
  $('t-usuario').textContent = d.nombre;
  const c = $('usr-cuerpo'); c.replaceChildren();
  c.append(el('p', 'dato', 'Correo: ' + d.correo + (d.tel ? ' · Teléfono: ' + d.tel : '')), el('h4', '', 'Donaciones'));
  const dons = donDe[d.id] || [];
  if (!dons.length) c.append(el('p', 'vacio', 'Este donante aún no tiene donaciones.'));
  dons.forEach(x => {
    c.append(el('h4', '', fmt(x.fecha) + ' · ' + x.hora + (x.nota ? ' · ' + x.nota : '')));
    x.arts.forEach(a => {
      const r = el('div', 'art'), s = el('select', 'estado');
      s.setAttribute('aria-label', 'Estado de ' + a.nom);
      ESTADOS.forEach(o => { const op = el('option', '', o); op.selected = o === a.estado; s.append(op); });
      s.onchange = () => cambiarEstado(a, s.value, d);
      r.append(el('span', 'art-nom', a.nom + ' × ' + a.cant), s); c.append(r);
    });
  });
  $('usr-confirmar').onclick = async () => {
    const ids = dons.map(x => x.id);
    if (!ids.length || !dons.some(x => x.arts.some(a => a.estado !== 'Entregado'))) { gracias('No hay donaciones por confirmar'); return; }
    const { error } = await sb.from('donacion_articulos').update({ estado: 'entregado' }).in('donacion_id', ids).neq('estado', 'entregado');
    if (error) return fallo(error, 'No se pudo confirmar.');
    await cargarBandeja(); render(); pintarUsuario(d); gracias('Donación confirmada ✓');
  };
  $('usr-eliminar').onclick = async () => {
    if (!confirm('¿Quitar a ' + d.nombre + ' de tu bandeja? Su cuenta no se borra.')) return;
    const { error } = await sb.from('bandeja_centro').update({ oculto: true }).eq('centro_id', uid).eq('donante_id', d.id);
    if (error) return fallo(error, 'No se pudo quitar de la bandeja.');
    $('d-usuario').close(); await cargarBandeja(); render();
  };
}
$('ban-buscar').oninput = () => render();

// ===== Transferencias =====
async function resolverDinero(d, estado) {
  const { error } = await sb.from('transferencias').update({ estado, revisado_en: new Date().toISOString() }).eq('id', d.id);
  if (error) return fallo(error, 'No se pudo actualizar la transferencia.');
  await cargarDinero(); render();
  gracias(estado === 'confirmada' ? 'Transferencia confirmada ✓' : 'Marcada como no encontrada');
}
async function verComprobante(ruta) {
  const w = window.open('', '_blank');
  const { data, error } = await sb.storage.from('privado').createSignedUrl(ruta, 120);
  if (error) { if (w) w.close(); return fallo(error, 'No se pudo abrir el comprobante.'); }
  if (w) w.location.href = data.signedUrl;
}

// ===== Motivar a usuarios =====
function donacionesEntregadas(donanteId) {
  return (donDe[donanteId] || []).filter(x => x.arts.some(a => a.estado === 'Entregado'));
}
function llenarMotivar() {
  const s = $('mo-donante'), prev = s.value;
  const elig = Object.keys(donDe).filter(id => donacionesEntregadas(id).length);
  s.replaceChildren(new Option(elig.length ? 'Selecciona un donante' : 'Aún no hay donantes con donaciones entregadas', ''));
  elig.forEach(id => s.append(new Option(donNombre[id], id)));
  s.value = elig.includes(prev) ? prev : '';
  llenarDon();
}
function llenarDon() {
  const s = $('mo-don'), id = $('mo-donante').value;
  s.replaceChildren(new Option(id ? 'Selecciona la donación' : 'Primero elige un donante', ''));
  if (id) donacionesEntregadas(id).forEach(x =>
    s.append(new Option(fmt(x.fecha) + ' · ' + x.arts.filter(a => a.estado === 'Entregado').map(a => a.nom + ' × ' + a.cant).join(', '), x.id)));
}
$('mo-donante').onchange = llenarDon;
$('f-motivar').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    const { data: rep, error } = await sb.from('reportes_impacto')
      .insert({ donacion_id: Number($('mo-don').value), mensaje: $('mo-desc').value.trim(), autorizacion: $('mo-aut').checked }).select('id').single();
    if (error) throw error;
    for (const [i, f] of fotosMo.entries()) {
      const ruta = await subirArchivo('privado', uid, f.file, 'impacto');
      const r = await sb.from('reporte_fotos').insert({ reporte_id: rep.id, ruta, orden: i });
      if (r.error) throw r.error;
    }
    const nombre = donNombre[$('mo-donante').value] || 'el donante';
    e.target.reset(); fotosMo = []; refFotosMo(); contar('mo-desc', 'mo-cuenta', 150);
    await cargarImpacto(); render(); gracias('Mensaje enviado a ' + nombre + ' 💙');
  } catch (x) { fallo(x, 'No se pudo enviar el mensaje.'); }
  finally { btn.disabled = false; }
};

// ===== Editar datos del establecimiento =====
function validarContactos() {
  const n = Object.values(idsContacto).filter(id => $(id).value.trim()).length;
  $('e-ccuenta').textContent = '(mínimo 2 · llevas ' + n + ')';
  $('e-tel').setCustomValidity(n < 2 ? 'Agrega al menos 2 datos de contacto' : '');
}
Object.values(idsContacto).forEach(id => $(id).addEventListener('input', validarContactos));
function cargarForm() {
  $('e-nombre').value = centro.nombre; $('e-ubic').value = centro.ubic; $('e-tipo').value = centro.tipo; $('e-horario').value = centro.horario;
  Object.entries(idsContacto).forEach(([k, id]) => $(id).value = centro.contactos[k] || '');
  $('e-desc').value = centro.desc; $('e-urg').value = centro.urgentes.join('\n');
  $('e-banco').value = centro.cuenta ? centro.cuenta.banco : ''; $('e-titular').value = centro.cuenta ? centro.cuenta.titular : '';
  $('e-clabe').value = centro.cuenta ? centro.cuenta.clabe : '';
  imgsEdit = centro.imagenes.map(x => ({ ...x })); refImgsEdit(); validarContactos(); contar('e-desc', 'e-dcuenta', 500);
}
$('d-editar').addEventListener('close', cargarForm);
$('e-cancelar').onclick = () => $('d-editar').close();
$('f-editar').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  const ok = r => { if (r.error) throw r.error; return r; };
  try {
    const banco = $('e-banco').value.trim(), titular = $('e-titular').value.trim(), clabe = $('e-clabe').value.trim();
    if ((banco || titular || clabe) && !(banco && titular && clabe)) throw new Error('Para recibir transferencias llena banco, titular y CLABE, o deja los tres vacíos.');
    // 1. datos generales
    const tipo = ok(await sb.from('tipos_centro').select('id').eq('nombre', $('e-tipo').value).single());
    ok(await sb.from('centros').update({ nombre: $('e-nombre').value.trim(), tipo_id: tipo.data.id, ubicacion: $('e-ubic').value.trim(),
      horario: $('e-horario').value.trim(), descripcion: $('e-desc').value.trim() || null }).eq('usuario_id', uid));
    // 2. contactos (los vacíos se borran)
    const llenos = [], vacios = [];
    Object.entries(idsContacto).forEach(([k, id]) => { const v = $(id).value.trim(); if (v) llenos.push({ centro_id: uid, tipo: k, valor: v }); else vacios.push(k); });
    if (llenos.length) ok(await sb.from('centro_contactos').upsert(llenos, { onConflict: 'centro_id,tipo' }));
    if (vacios.length) ok(await sb.from('centro_contactos').delete().eq('centro_id', uid).in('tipo', vacios));
    // 3. imágenes: primero se quitan las eliminadas, luego se suben las nuevas
    const quedan = imgsEdit.filter(x => x.id).map(x => x.id), quitar = centro.imagenes.filter(x => !quedan.includes(x.id));
    if (quitar.length) {
      ok(await sb.from('centro_imagenes').delete().in('id', quitar.map(x => x.id)));
      await sb.storage.from('publico').remove(quitar.map(x => x.ruta));
    }
    for (const n of imgsEdit.filter(x => x.file)) {
      const ruta = await subirArchivo('publico', uid, n.file, 'imagen');
      ok(await sb.from('centro_imagenes').insert({ centro_id: uid, ruta }));
    }
    // 4. insumos urgentes: una línea = un insumo
    const lineas = [...new Set($('e-urg').value.split('\n').map(s => s.trim().slice(0, 100)).filter(Boolean))];
    ok(await sb.from('insumos_urgentes').delete().eq('centro_id', uid));
    if (lineas.length) ok(await sb.from('insumos_urgentes').insert(lineas.map(nombre => ({ centro_id: uid, nombre }))));
    // 5. cuenta bancaria (no se borra: las transferencias dependen de ella)
    if (banco) ok(await sb.from('cuentas_bancarias').upsert({ centro_id: uid, banco, titular, clabe }, { onConflict: 'centro_id' }));
    $('d-editar').close(); await cargarCentro(); cargarForm(); render(); gracias('Datos actualizados ✓');
  } catch (x) { fallo(x, 'No se pudieron guardar los cambios.'); await cargarCentro().catch(() => {}); render(); }
  finally { btn.disabled = false; }
};

// ===== Dibujar todo =====
function render() {
  const ini = centro.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'CA';
  $('c-ini').textContent = ini; $('c-nombre-lat').textContent = centro.nombre || 'Centro'; $('c-nombre').textContent = centro.nombre || 'Centro';
  $('aviso-verif').hidden = centro.verificado;

  $('s-art').textContent = Object.values(donDe).flat().reduce((t, d) => t + d.arts.filter(a => a.estado !== 'Entregado').length, 0);
  $('s-din').textContent = dineros.filter(d => d.estado === 'Por confirmar').length;
  $('s-don').textContent = bandeja.length;

  const q = $('ban-buscar').value.trim().toLowerCase(), bl = $('ban-lista'); bl.replaceChildren();
  const vis = bandeja.filter(d => d.nombre.toLowerCase().includes(q));
  vis.forEach(d => {
    const t = el('article', 'tarjeta');
    t.append(el('h3', '', d.nombre), el('p', 'meta', d.correo), el('p', '', d.donaciones + ' donación(es) · ' + d.pendientes + ' por confirmar'));
    const b = el('button', 'btn', 'Ver y confirmar'); b.onclick = () => { pintarUsuario(d); $('d-usuario').showModal(); }; t.append(b); bl.append(t);
  });
  $('ban-vacio').hidden = vis.length > 0;

  const dl = $('din-lista'); dl.replaceChildren();
  dineros.forEach(d => {
    const t = el('article', 'tarjeta entrega'), r = el('div', 'art');
    t.append(el('h3', '', pesos(d.monto) + ' · ' + d.donante));
    r.append(el('span', '', fmt(d.fecha) + ' · Referencia ' + d.ref), badge(d.estado)); t.append(r);
    const bb = el('div', 'botones');
    if (d.comp) { const v = el('button', 'btn claro', 'Ver comprobante'); v.onclick = () => verComprobante(d.comp); bb.append(v); }
    if (d.estado === 'Por confirmar') {
      const ok = el('button', 'btn', 'Confirmar: ya llegó'), no = el('button', 'btn claro', 'No la encuentro');
      ok.onclick = () => resolverDinero(d, 'confirmada'); no.onclick = () => resolverDinero(d, 'no_encontrada'); bb.append(ok, no);
    }
    if (bb.children.length) t.append(bb);
    dl.append(t);
  });
  $('din-vacio').hidden = dineros.length > 0;
  $('din-total').textContent = pesos(dineros.filter(d => d.estado === 'Confirmada' && new Date(d.fecha).getFullYear() === anio).reduce((t, d) => t + d.monto, 0));

  llenarMotivar();
  const ml = $('mo-lista'); ml.replaceChildren();
  enviados.forEach(m => {
    const t = el('article', 'tarjeta entrega');
    t.append(el('h3', '', m.donante), el('p', 'meta', fmt(m.fecha) + (m.gracias ? ' · El donante dio las gracias 💙' : '')), el('p', '', m.texto));
    if (m.fotos.length) { const g = el('div', 'galeria'); m.fotos.forEach(u => { const im = document.createElement('img'); im.src = u; im.alt = 'Foto enviada'; g.append(im); }); t.append(g); }
    ml.append(t);
  });
  $('mo-vacio').hidden = enviados.length > 0;

  $('v-nombre').textContent = centro.nombre; $('v-tipo').textContent = centro.tipo || '—'; $('v-ubic').textContent = centro.ubic || '—';
  $('v-horario').textContent = centro.horario || '—'; $('v-desc').textContent = centro.desc || '—';
  const cl = $('v-contacto'); cl.replaceChildren();
  Object.entries(ETIQUETAS).filter(([k]) => centro.contactos[k]).forEach(([k, n]) => { const li = el('li'); li.append(el('strong', '', n + ': '), document.createTextNode(centro.contactos[k])); cl.append(li); });
  const ul = $('v-urg'); ul.replaceChildren();
  centro.urgentes.forEach(u => { const li = el('li'); li.append(el('span', '', u), el('b', '', 'Urgente')); ul.append(li); });
  const gi = $('v-imgs'); gi.replaceChildren();
  centro.imagenes.forEach((u, i) => { const im = document.createElement('img'); im.src = u.url; im.alt = 'Imagen ' + (i + 1) + ' del establecimiento'; im.loading = 'lazy'; gi.append(im); });
  $('v-imgs-vacio').hidden = centro.imagenes.length > 0;
}

// ===== Arranque: sesión real =====
iniciarPagina('centro', async user => {
  uid = user.id;
  try { await Promise.all([cargarCentro(), cargarBandeja(), cargarDinero(), cargarImpacto()]); }
  catch (x) { fallo(x, 'No pudimos cargar tus datos. Recarga la página.'); }
  cargarForm(); refFotosMo(); render();
});