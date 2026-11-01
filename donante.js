// ===== Utilidades =====
const $ = id => document.getElementById(id);
const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x !== undefined) e.textContent = x; return e; };

// ===== Catálogo de módulos y tipos de artículo (sepáralos con |) =====
const catalogo = {
  'Ropa': 'Camiseta|Camisa|Blusa|Top|Sudadera|Jersey|Chaqueta|Abrigo|Chaleco|Cazadora|Pantalón|Vaqueros|Shorts|Falda|Vestido|Mono|Peto|Mallas|Pijama|Ropa interior|Traje de baño|Calcetines',
  'Calzado': 'Zapatillas deportivas|Zapatos de vestir / Formales|Botas|Botines|Sandalias / Chanclas|Bailarinas / Manoletinas|Mocasines|Calzado infantil / Bebé|Zapatillas de estar por casa|Botas de agua / Trabajo',
  'Útiles escolares': 'Cuadernos / Libretas|Lápices / Portaminas|Bolígrafos / Plumas|Colores / Rotuladores|Marcadores|Reglas / Escuadras / Transportador|Estuches / Cartucheras|Mochilas / Correajes|Tijeras|Pegamento|Sacapuntas|Gomas de borrar|Calculadoras',
  'Artículos para bebé': 'Pañales|Toallitas húmedas|Biberones|Chupetes|Baberos|Cunas / Cunas de viaje|Cochecitos / Sillas de paseo|Porteadores / Mochilas portabebés|Bañeras / Artículos de baño infantil|Mantas / Sacos de dormir|Mordedores / Sonajeros',
  'Productos de higiene personal': 'Jabón de cuerpo / Gel de ducha|Champú / Acondicionador|Pasta de dientes / Cepillo dental|Desodorante|Crema hidratante / Corporal|Cuidado facial|Productos de afeitado / Depilación|Higiene femenina|Cortaúñas / Limas|Peines / Cepillos para cabello',
  'Productos de limpieza': 'Detergente para ropa|Suavizante|Lavavajillas / Detergente para platos|Limpiahogares / Multiusos|Desinfectante / Lejía / Cloro|Limpiacristales|Estropajos / Esponjas / Bayetas|Escobas / Fregonas / Mopas|Bolsas de basura|Quitagrasas / Desengrasante',
  'Alimentos': 'Arroz / Legumbres|Pasta|Aceite / Vinagre / Condimentos|Enlatados / Conservas|Harinas / Cereales|Leche / Lácteos|Galletas / Snacks|Azúcar / Sal / Café|Bebidas / Zumos|Comida no perecedera',
  'Juguetes': 'Muñecos / Figuras de acción|Juegos de mesa / Puzles / Rompecabezas|Peluches|Bloques de construcción|Vehículos / Coches / Trenes|Juguetes educativos / Didácticos|Manualidades / Plastilina|Pelotas / Artículos deportivos infantiles|Disfraces|Instrumentos musicales de juguete',
  'Otros': 'Cobijas / Cobertores|Libros|Utensilios de cocina'
};
const OTRO = 'Otro (escribir)';
const cats = Object.keys(catalogo);
const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ===== Centros de acopio (cámbialos por los reales o tráelos de la base de datos) =====
const centros = [];

// ===== Datos en memoria: aquí se conectará la base de datos =====
const items = [], entregas = [], dineros = [];
let editando = null, nid = 1, refDinero = '';
const semana = d => Math.floor(d / 6048e5);
const fmt = d => new Date(d + 'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' });
const pesos = n => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

// ===== Ventanas y pestañas =====
document.querySelectorAll('[data-dlg]').forEach(b => b.onclick = () => $(b.dataset.dlg).showModal());
document.querySelectorAll('dialog').forEach(d => d.addEventListener('click', e => { if (e.target === d || e.target.hasAttribute('data-cerrar')) d.close(); }));
const tabs = document.querySelectorAll('[data-tab]');
tabs.forEach(t => t.onclick = () => {
  tabs.forEach(x => x.classList.toggle('activo', x === t));
  document.querySelectorAll('.panel').forEach(p => p.hidden = p.id !== t.dataset.tab);
});
function gracias(msg) { const g = $('gracias'); g.textContent = msg || '¡Gracias por donar! 💙'; g.hidden = false; setTimeout(() => g.hidden = true, 3000); }

// ===== Formulario de artículo (agregar / editar) =====
function llenarTipos(cat) {
  const t = $('a-tipo'); t.replaceChildren();
  catalogo[cat].split('|').concat(OTRO).forEach(x => t.append(new Option(x)));
}
function ajustar() {
  $('w-otro').hidden = $('a-tipo').value !== OTRO;
  $('a-otro').required = !$('w-otro').hidden;
  $('w-cad').hidden = $('a-cat').value !== 'Alimentos';
}
cats.forEach(c => $('a-cat').append(new Option(c)));
llenarTipos(cats[0]); ajustar();
$('a-cat').onchange = () => { llenarTipos($('a-cat').value); ajustar(); };
$('a-tipo').onchange = ajustar;
$('d-art').addEventListener('close', () => {
  editando = null; $('f-art').reset(); $('t-art').textContent = 'Agregar artículo';
  llenarTipos($('a-cat').value); ajustar();
});

$('f-art').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    const cat = $('a-cat').value, tipo = $('a-tipo').value, tid = tipoIds[cat + '|' + tipo];
    if (!tid) throw new Error('Ese tipo de artículo no está en el catálogo de la base.');
    const fila = {
      tipo_articulo_id: tid,
      detalle: tipo === OTRO ? $('a-otro').value.trim() : null,
      cantidad: Number($('a-cant').value),
      condicion: CONDICION[$('a-cond').value],
      caducidad: $('w-cad').hidden ? null : ($('a-cad').value || null),
      notas: $('a-nota').value.trim() || null
    };
    const r = editando
      ? await sb.from('articulos').update(fila).eq('id', editando.id).select(SEL).single()
      : await sb.from('articulos').insert({ ...fila, donante_id: usuarioId }).select(SEL).single();
    if (r.error) throw r.error;
    if (editando) Object.assign(editando, aItem(r.data));
    else items.push({ ...aItem(r.data), estado: 'Pendiente', ent: null });
    $('d-art').close(); render();
  } catch (x) {
    console.error(x);
    alert('No se pudo guardar el artículo. ' + (x.message || ''));
  } finally { btn.disabled = false; }
};

// ===== Ver información, editar, eliminar =====
function ver(i) {
  const f = $('ver-cuerpo'); f.replaceChildren();
  [['Artículo', i.nom], ['Módulo', i.cat], ['Cantidad', i.cant], ['Condición', i.cond], ['Estado', i.estado],
   ['Centro de acopio', i.ent ? i.ent.centro.nombre : 'Aún sin donar'],
   i.cad && ['Caducidad', new Date(i.cad + 'T00:00').toLocaleDateString('es-MX')],
   ['Agregado', new Date(i.alta).toLocaleDateString('es-MX')], i.nota && ['Notas', i.nota]]
    .filter(Boolean).forEach(([k, v]) => { const r = el('p', 'dato'); r.append(el('strong', '', k + ': '), document.createTextNode(v)); f.append(r); });
  $('ver-edit').onclick = () => { $('d-ver').close(); editar(i); };
  $('ver-del').onclick = () => { $('d-ver').close(); eliminar(i); };
  $('d-ver').showModal();
}
function editar(i) {
  editando = i; $('t-art').textContent = 'Editar artículo';
  $('a-cat').value = i.cat; llenarTipos(i.cat); $('a-tipo').value = i.tipo;
  $('a-otro').value = i.tipo === OTRO ? i.nom : '';
  $('a-cant').value = i.cant; $('a-cond').value = i.cond; $('a-cad').value = i.cad; $('a-nota').value = i.nota;
  ajustar(); $('d-art').showModal();
}

async function eliminar(i) {
  if (i.ent) { alert('Este artículo está en una donación. Cancela primero la entrega en "Tus donaciones".'); return; }
  if (!confirm('¿Eliminar "' + i.nom + '" de tu inventario?')) return;
  const { error } = await sb.from('articulos').delete().eq('id', i.id);
  if (error) { console.error(error); alert('No se pudo eliminar el artículo.'); return; }
  items.splice(items.indexOf(i), 1); render();
}

// ===== Donar artículos: centro + artículos + fecha y hora =====
centros.forEach(c => $('d-centro').append(new Option(c.nombre, c.id)));
function infoCentro() {
  const c = centros.find(x => x.id === $('d-centro').value);
  $('d-info').textContent = c ? 'Horario: ' + c.horario + ' · ' + c.dir : '';
}
$('d-centro').onchange = infoCentro;
function abrirDonar(cid) {
  const libres = items.filter(i => !i.ent && i.estado === 'Pendiente');
  const l = $('donar-lista'); l.replaceChildren();
  libres.forEach(i => {
    const lb = el('label', 'check'), c = document.createElement('input');
    c.type = 'checkbox'; c.value = items.indexOf(i);
    lb.append(c, document.createTextNode(i.nom + ' × ' + i.cant + ' (' + i.cat + ')')); l.append(lb);
  });
  $('donar-vacio').hidden = libres.length > 0;
  $('donar-ok').hidden = !libres.length;
  if (cid) $('d-centro').value = cid;
  infoCentro(); $('d-donar').showModal();
}
$('b-donar').onclick = () => abrirDonar();
$('d-fecha').min = new Date().toISOString().slice(0, 10);
$('f-donar').onsubmit = async e => {
  e.preventDefault();
  const sel = [...$('donar-lista').querySelectorAll('input:checked')].map(c => items[c.value]);
  if (!sel.length) { alert('Selecciona al menos un artículo.'); return; }
  const btn = $('donar-ok'); btn.disabled = true;
  try {
    const c = centros.find(x => x.id === $('d-centro').value);
    const nota = $('d-nota').value.trim();
    const { data: d, error } = await sb.from('donaciones').insert({
      donante_id: usuarioId, centro_id: c.id, fecha_entrega: $('d-fecha').value, hora_entrega: $('d-hora').value, nota: nota || null
    }).select('id').single();
    if (error) throw error;
    const { error: e2 } = await sb.from('donacion_articulos').insert(sel.map(i => ({ articulo_id: i.id, donacion_id: d.id })));
    if (e2) { await sb.from('donaciones').delete().eq('id', d.id); throw e2; }   // sin artículos no queda donación a medias
    const en = { id: d.id, centro: c, fecha: $('d-fecha').value, hora: $('d-hora').value, nota, items: sel };
    sel.forEach(i => i.ent = en); entregas.push(en);
    e.target.reset(); $('d-donar').close(); render();
    document.querySelector('[data-tab="p-don"]').click();
  } catch (x) { console.error(x); alert('No se pudo registrar la donación. ' + (x.message || '')); }
  finally { btn.disabled = false; }
};

// ===== Donar dinero (transferencia) =====
centros.forEach(c => $('m-centro').append(new Option(c.nombre, c.id)));

function copiar(txt, btn) {
  const ok = () => { btn.textContent = '¡Copiado!'; setTimeout(() => btn.textContent = 'Copiar', 1500); };
  (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(ok, () => prompt('Copia este dato:', txt));
}
function datosBanco() {
  const c = centros.find(x => x.id === $('m-centro').value), b = $('m-banco'); b.replaceChildren();
  [['Banco', c.banco], ['Titular', c.titular], ['CLABE', c.clabe], ['Concepto / referencia', refDinero]].forEach(([k, v], i) => {
    const r = el('div', 'dato-banco'); r.append(el('span', '', k), el('strong', '', v));
    if (i > 1) { const x = el('button', '', 'Copiar'); x.type = 'button'; x.onclick = () => copiar(v, x); r.append(x); }
    b.append(r);
  });
}
async function abrirDinero(cid) {
  if (!$('m-centro').options.length) { alert('Aún no hay centros que reciban transferencias.'); return; }
  const { data, error } = await sb.rpc('nueva_referencia');
  if (error) { console.error(error); alert('No se pudo generar la referencia.'); return; }
  refDinero = data;
  if (cid) $('m-centro').value = cid;
  datosBanco(); $('d-dinero').showModal();
}
$('m-centro').onchange = datosBanco;
$('m-fecha').max = new Date().toISOString().slice(0, 10);
$('b-dinero').onclick = () => abrirDinero();
$('d-dinero').addEventListener('close', () => $('f-dinero').reset());
$('f-dinero').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    const c = centros.find(x => x.id === $('m-centro').value);
    if (!c || !c.cuentaId) throw new Error('Ese centro no tiene cuenta registrada.');
    const f = $('m-comp').files[0];
    const ruta = await subirArchivo('privado', usuarioId, f, 'comprobante');
    const { data, error } = await sb.from('transferencias').insert({
      donante_id: usuarioId, cuenta_id: c.cuentaId, monto: Number($('m-monto').value),
      fecha_transferencia: $('m-fecha').value, referencia: refDinero,
      clave_rastreo: $('m-rastreo').value.trim() || null, comprobante_ruta: ruta
    }).select('id, monto, fecha_transferencia, referencia, clave_rastreo').single();
    if (error) throw error;
    dineros.push({ id: data.id, centro: c, monto: Number(data.monto), fecha: data.fecha_transferencia, ref: data.referencia,
                   rastreo: data.clave_rastreo || '', comp: f ? f.name : '', ruta, estado: 'Por confirmar' });
    $('d-dinero').close(); render();
    document.querySelector('[data-tab="p-don"]').click();
    gracias('Registramos tu transferencia. El centro la confirmará 💙');
  } catch (x) { console.error(x); alert('No se pudo registrar la transferencia. ' + (x.message || '')); }
  finally { btn.disabled = false; }
};

// ===== Dibujar todo =====
const badge = e => el('span', 'badge' + (e === 'Entregado' || e === 'Confirmada' ? ' ok' : e === 'Listo para entregar' ? ' listo' : ''), e);
async function cancelarTransferencia(d) {
  if (!confirm('¿Cancelar el registro de la transferencia ' + d.ref + '?\n\nEsto solo elimina el registro en Revive. Si ya hiciste la transferencia en tu banco, el dinero no se devuelve: habla con el centro.')) return;
  const { data, error } = await sb.from('transferencias').delete().eq('id', d.id).select('id');
  if (error || !data || !data.length) {
    console.error(error);
    alert('No se pudo cancelar. Puede que el centro ya haya revisado la transferencia.');
    return;
  }
  if (d.ruta) await sb.storage.from('privado').remove([d.ruta]);      // borra también el comprobante
  dineros.splice(dineros.indexOf(d), 1); render();
  gracias('Registro cancelado');
}
function render() {
  const anio = new Date().getFullYear();
  const entregados = items.filter(i => i.estado === 'Entregado');
  const activos = items.filter(i => i.estado !== 'Entregado');
  const listos = activos.filter(i => i.estado === 'Listo para entregar');

  // Inventario por módulos (el estado solo se muestra: lo cambia el centro)
  const q = $('buscar').value.trim().toLowerCase(), cont = $('inv-lista');
  cont.replaceChildren();
  cats.forEach(c => {
    const f = activos.filter(i => i.cat === c && (i.nom + ' ' + i.cat).toLowerCase().includes(q));
    if (!f.length) return;
    const m = el('article', 'tarjeta modulo'); m.append(el('h3', '', c));
    f.forEach(i => {
      const r = el('div', 'art'), n = el('span', 'art-nom', i.nom + ' × ' + i.cant);
      const sm = el('small', '', i.ent ? 'Entrega en ' + i.ent.centro.nombre + ' · ' + fmt(i.ent.fecha) : 'Aún sin donar');
      const b = el('div', 'acciones');
      [['Ver', () => ver(i)], ['Editar', () => editar(i)], ['Eliminar', () => eliminar(i)]].forEach(([t, fn]) => {
        const x = el('button', '', t); x.onclick = fn; b.append(x);
      });
      r.append(n, badge(i.estado), b, sm); m.append(r);
    });
    cont.append(m);
  });
  $('inv-vacio').hidden = activos.length > 0;

  // Tus donaciones: artículos (entregas por centro)
  const dl = $('don-lista'); dl.replaceChildren();
  entregas.sort((a, b) => a.fecha.localeCompare(b.fecha)).forEach(en => {
    const t = el('article', 'tarjeta entrega');
    t.append(el('h3', '', en.centro.nombre), el('p', 'meta', fmt(en.fecha) + ' · ' + en.hora + ' · ' + en.centro.dir));
    en.items.forEach(i => { const r = el('div', 'art'); r.append(el('span', '', i.nom + ' × ' + i.cant), badge(i.estado)); t.append(r); });
    if (en.nota) t.append(el('p', 'meta', 'Nota: ' + en.nota));
    if (en.items.every(i => i.estado === 'Pendiente')) {
      const x = el('button', 'btn claro', 'Cancelar entrega');
      x.onclick = async () => {
        if (!confirm('¿Cancelar esta entrega?')) return;
        const { data, error } = await sb.from('donaciones').delete().eq('id', en.id).select('id');
        if (error || !data || !data.length) { console.error(error); alert('No se pudo cancelar. Puede que el centro ya haya cambiado el estado de algún artículo.'); return; }
        en.items.forEach(i => i.ent = null); entregas.splice(entregas.indexOf(en), 1); render();
      };
      t.append(x);
    }
    dl.append(t);
  });
  $('don-vacio').hidden = entregas.length > 0;

  // Tus donaciones: dinero
  const ml = $('din-lista'); ml.replaceChildren();
  dineros.forEach(d => {
    const t = el('article', 'tarjeta entrega');
    t.append(el('h3', '', pesos(d.monto) + ' → ' + d.centro.nombre));
    const r = el('div', 'art'); r.append(el('span', '', fmt(d.fecha) + ' · ' + d.ref), badge(d.estado)); t.append(r);
    if (d.comp) t.append(el('p', 'meta', 'Comprobante: ' + d.comp));
    if (d.estado === 'Por confirmar') {
      const x = el('button', 'btn claro', 'Cancelar transferencia');
      x.onclick = () => cancelarTransferencia(d);
      t.append(x);
    }
    ml.append(t);
  });
  $('din-vacio').hidden = dineros.length > 0;
  $('din-total').textContent = pesos(dineros.filter(d => d.estado === 'Confirmada' && new Date(d.fecha).getFullYear() === anio).reduce((t, d) => t + d.monto, 0));

  // Resumen y recordatorio
  const delAnio = entregados.filter(i => new Date(i.fecha).getFullYear() === anio);
  const prox = entregas.filter(en => en.items.some(i => i.estado !== 'Entregado'));
  $('s-don').textContent = delAnio.reduce((t, i) => t + Number(i.cant), 0);
  $('s-pen').textContent = activos.reduce((t, i) => t + Number(i.cant), 0);
  $('s-cita').textContent = prox.length ? fmt(prox[0].fecha) : '—';
  const av = $('aviso');
  av.hidden = !listos.length;
  av.textContent = listos.length ? 'El centro marcó ' + listos.length + ' artículo(s) como listos para entregar. Llévalos en la fecha acordada.' : '';

  // Racha (semanas seguidas con al menos una entrega recibida)
  const sem = new Set(entregados.map(i => semana(i.fecha)));
  let w = semana(Date.now()); if (!sem.has(w)) w--;
  let racha = 0; while (sem.has(w)) { racha++; w--; }
  $('racha-n').textContent = racha;
  document.querySelectorAll('.dias i').forEach((d, k) => d.style.background = k < racha ? 'var(--azul-500)' : '');

  // Logros
  const logros = [
    ['Primera donación', entregados.length >= 1], ['5 artículos donados', entregados.length >= 5],
    ['Racha de 4 semanas', racha >= 4], ['Primera entrega programada', entregas.length >= 1],
    ['Primera donación en dinero', dineros.some(d => d.estado === 'Confirmada')]
  ];
  const lg = $('logros'); lg.replaceChildren();
  logros.forEach(([t, ok]) => lg.append(el('span', 'logro' + (ok ? ' on' : ''), (ok ? '★ ' : '☆ ') + t)));

  // Tabla anual
  $('anual').replaceChildren(...meses.map((m, k) => {
    const tr = el('tr'), n = delAnio.filter(i => new Date(i.fecha).getMonth() === k).reduce((t, i) => t + Number(i.cant), 0);
    tr.append(el('td', '', m), el('td', '', n)); return tr;
  }));
}

$('buscar').oninput = render;
$('anio').textContent = new Date().getFullYear();
render();

// ===== Perfil =====
// DATOS DE EJEMPLO: aquí llegarán los datos reales de la persona desde la base de datos
const perfil = { nombre: 'Nombre', ap: 'Apellido', am: 'Apellido', fecha: '2000-01-01', correo: 'correo@ejemplo.com', ubic: 'Ciudad, estado', tel: '', foto: '' };
let fotoTmp = null;   // foto elegida pero aún sin guardar

const iniciales = () => ((perfil.nombre[0] || '') + (perfil.ap[0] || '')).toUpperCase() || 'DN';
function ponerFoto(a, url, ini) { a.textContent = url ? '' : ini; a.style.backgroundImage = url ? 'url("' + url + '")' : ''; }

function pintarPerfil() {
  $('u-nombre').textContent = perfil.nombre + ' ' + perfil.ap;
  $('h-nombre').textContent = perfil.nombre;
  ponerFoto($('u-ini'), perfil.foto, iniciales());
  ponerFoto($('pf-foto'), perfil.foto, iniciales());
}
function cargarPerfil() {   // llena el formulario con los datos guardados (y descarta lo no guardado)
  fotoTmp = null;
  [['p-nombre', 'nombre'], ['p-ap', 'ap'], ['p-am', 'am'], ['p-fecha', 'fecha'], ['p-correo', 'correo'], ['p-ubic', 'ubic'], ['p-tel', 'tel']]
    .forEach(([id, k]) => $(id).value = perfil[k]);
  $('f-pass').reset(); $('pw-new2').setCustomValidity('');
  pintarPerfil();
}
$('d-perfil').addEventListener('close', cargarPerfil);
$('pf-cancelar').onclick = () => $('d-perfil').close();

// Foto
$('pf-archivo').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  fotoTmp = URL.createObjectURL(f); ponerFoto($('pf-foto'), fotoTmp, ''); e.target.value = '';
};
$('pf-quitar').onclick = () => { fotoTmp = ''; ponerFoto($('pf-foto'), '', iniciales()); };

// Guardar datos personales (aquí se enviarán a la base de datos)
$('f-perfil').onsubmit = e => {
  e.preventDefault();
  Object.assign(perfil, {
    nombre: $('p-nombre').value.trim(), ap: $('p-ap').value.trim(), am: $('p-am').value.trim(),
    fecha: $('p-fecha').value, ubic: $('p-ubic').value.trim(), tel: $('p-tel').value.trim()
  });
  if (fotoTmp !== null) perfil.foto = fotoTmp;
  $('d-perfil').close();
  gracias('Perfil actualizado ✓');
};

// Cambiar contraseña (aquí la verificará y guardará el servidor)
const pn = $('pw-new'), pn2 = $('pw-new2');
const igual = () => pn2.setCustomValidity(pn.value === pn2.value ? '' : 'Las contraseñas no coinciden');
pn.oninput = pn2.oninput = igual;
$('f-pass').onsubmit = e => {
  e.preventDefault(); e.target.reset(); igual();
  gracias('Contraseña actualizada ✓');
};

// Eliminar cuenta (aquí se borrará en la base de datos)
$('pf-eliminar').onclick = () => {
  if (confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) location.href = 'index.html';
};

cargarPerfil();

// ===== Así se usó tu donación =====
// EJEMPLOS: los centros enviarán estos reportes desde su panel. Borra los de ejemplo al conectar la base de datos.
const reportes = [];

function pintarImpacto() {
  const visibles = reportes.filter(r => !r.oculto), l = $('imp-lista');
  l.replaceChildren();
  visibles.forEach(r => {
    const a = el('article', 'tarjeta reporte'), f = el('div', 'foto-rep');
    if (r.foto) { const im = document.createElement('img'); im.src = r.foto; im.alt = r.alt || 'Foto compartida por el centro'; im.loading = 'lazy'; f.append(im); }
    else f.textContent = '[Foto]';
    a.append(f, el('h3', '', r.centro), el('p', 'meta', fmt(r.fecha) + ' · Tu donación: ' + r.donacion), el('p', '', r.texto));
    const b = el('div', 'botones');
    const g = el('button', 'btn' + (r.gracias ? ' claro' : ' azul'), r.gracias ? 'Gracias enviado 💙' : 'Dar gracias 💙');
    g.disabled = r.gracias;
    g.onclick = () => { r.gracias = true; pintarImpacto(); gracias('Le avisamos al centro 💙'); };   // aquí se avisará al centro
    const x = el('button', 'btn claro', 'Reportar foto');
    x.onclick = () => { if (confirm('¿Reportar esta publicación como inapropiada? Dejará de mostrarse.')) { r.oculto = true; pintarImpacto(); gracias('Gracias por avisarnos'); } };   // aquí se avisará al equipo
    b.append(g, x); a.append(b); l.append(a);
  });
  $('imp-vacio').hidden = visibles.length > 0;
  const n = visibles.filter(r => r.nuevo).length;
  $('tab-impacto').textContent = 'Así se usó tu donación' + (n ? ' (' + n + ')' : '');
}
$('tab-impacto').addEventListener('click', () => { reportes.forEach(r => r.nuevo = false); pintarImpacto(); });

// SOLO PARA PRUEBAS: el centro enviará esto desde su panel. En la consola:
// centroEnviaReporte({ centro: 'Nombre', donacion: 'Ropa × 3', texto: 'Mensaje', foto: 'enlace-de-imagen' })
window.centroEnviaReporte = d => {
  reportes.unshift({ id: Date.now(), fecha: new Date().toISOString().slice(0, 10), gracias: false, nuevo: true, ...d });
  pintarImpacto();
};
pintarImpacto();

// ===== Centros, donaciones y dinero en Supabase =====
const ESTADO_ART = { pendiente: 'Pendiente', listo_para_entregar: 'Listo para entregar', entregado: 'Entregado' };
const ESTADO_TRANSF = { por_confirmar: 'Por confirmar', confirmada: 'Confirmada', no_encontrada: 'No encontrada' };

function pintarCentros() {
  const lista = $('centros-lista'); lista.replaceChildren();
  if (!centros.length) lista.append(el('p', 'vacio', 'Todavía no hay centros aprobados.'));
  centros.forEach(c => {
    const a = el('article', 'tarjeta'); a.append(el('h3', '', c.nombre));
    a.append(el('p', '', 'Dirección: ' + c.dir), el('p', '', 'Horario: ' + c.horario));
    if (c.tel) a.append(el('p', '', 'Teléfono: ' + c.tel));
    if (c.necesita.length) {
      a.append(el('h4', '', 'Lo que necesitamos ahora'));
      const ul = el('ul', 'necesita');
      c.necesita.forEach(n => { const li = el('li'); li.append(el('span', '', n), el('b', '', 'Se necesita')); ul.append(li); });
      a.append(ul);
    }
    const bb = el('div', 'botones');
    const b1 = el('button', 'btn', 'Donar artículos'); b1.onclick = () => abrirDonar(c.id); bb.append(b1);
    if (c.cuentaId) { const b2 = el('button', 'btn azul', 'Donar dinero'); b2.onclick = () => abrirDinero(c.id); bb.append(b2); }
    else bb.append(el('small', '', 'Este centro aún no recibe donaciones en dinero.'));
    a.append(bb); lista.append(a);
  });
}

async function cargarCentros() {
  const { data, error } = await sb.from('centros')
    .select('usuario_id, nombre, ubicacion, horario, centro_contactos(tipo, valor), insumos_urgentes(nombre), cuentas_bancarias(id, banco, titular, clabe)')
    .eq('verificacion', 'aprobado').order('nombre');
  if (error) throw error;
  centros.length = 0;
  data.forEach(c => {
    const ct = Object.fromEntries(c.centro_contactos.map(x => [x.tipo, x.valor])), cb = Array.isArray(c.cuentas_bancarias) ? c.cuentas_bancarias[0] : c.cuentas_bancarias;
    centros.push({ id: c.usuario_id, nombre: c.nombre, dir: c.ubicacion, horario: c.horario, tel: ct.telefono || '',
      banco: cb ? cb.banco : '', titular: cb ? cb.titular : '', clabe: cb ? cb.clabe : '', cuentaId: cb ? cb.id : null,
      necesita: c.insumos_urgentes.map(x => x.nombre) });
  });
  $('d-centro').replaceChildren(); centros.forEach(c => $('d-centro').append(new Option(c.nombre, c.id)));
  $('m-centro').replaceChildren(); centros.filter(c => c.cuentaId).forEach(c => $('m-centro').append(new Option(c.nombre, c.id)));
  pintarCentros();
}

async function cargarDonaciones() {
  const { data, error } = await sb.from('donaciones')
    .select('id, fecha_entrega, hora_entrega, nota, centro_id, centros(nombre, ubicacion), donacion_articulos(articulo_id, estado, entregado_en)')
    .eq('donante_id', usuarioId).order('fecha_entrega');
  if (error) throw error;
  entregas.length = 0;
  data.forEach(d => {
    const en = { id: d.id, centro: { id: d.centro_id, nombre: d.centros?.nombre || 'Centro', dir: d.centros?.ubicacion || '' },
      fecha: d.fecha_entrega, hora: d.hora_entrega.slice(0, 5), nota: d.nota || '', items: [] };
    d.donacion_articulos.forEach(da => {
      const it = items.find(i => i.id === da.articulo_id); if (!it) return;
      it.estado = ESTADO_ART[da.estado]; it.fecha = da.entregado_en ? Date.parse(da.entregado_en) : undefined;
      it.ent = en; en.items.push(it);
    });
    entregas.push(en);
  });
}

async function cargarDinero() {
  const { data, error } = await sb.from('transferencias')
    .select('id, monto, fecha_transferencia, referencia, clave_rastreo, comprobante_ruta, estado, cuentas_bancarias(centros(nombre))')
    .order('creado_en');
  if (error) throw error;
  dineros.length = 0;
  data.forEach(t => dineros.push({ id: t.id, centro: { nombre: t.cuentas_bancarias?.centros?.nombre || 'Centro' },
    monto: Number(t.monto), fecha: t.fecha_transferencia, ref: t.referencia, rastreo: t.clave_rastreo || '',
    comp: t.comprobante_ruta ? t.comprobante_ruta.split('/').pop() : '', ruta: t.comprobante_ruta, estado: ESTADO_TRANSF[t.estado] }));
}

// ===== Inventario en Supabase =====
let usuarioId = null;
const tipoIds = {};                                  // 'Categoría|Tipo' → id en la base
const CONDICION = { 'Nuevo': 'nuevo', 'Buen estado': 'buen_estado', 'Usado': 'usado' };
const COND_TEXTO = { nuevo: 'Nuevo', buen_estado: 'Buen estado', usado: 'Usado' };
const SEL = 'id, cantidad, condicion, caducidad, notas, detalle, creado_en, tipos_articulo(nombre, categorias(nombre))';

function aItem(r) {                                  // fila de la base → objeto que usa la página
  const tipo = r.tipos_articulo.nombre;
  return { id: r.id, cat: r.tipos_articulo.categorias.nombre, tipo,
           nom: tipo === OTRO ? (r.detalle || OTRO) : tipo,
           cant: r.cantidad, cond: COND_TEXTO[r.condicion], cad: r.caducidad || '',
           nota: r.notas || '', alta: new Date(r.creado_en).getTime() };
}

async function cargarInventario() {
  const { data: tipos, error: e1 } = await sb.from('tipos_articulo').select('id, nombre, categorias(nombre)');
  if (e1) throw e1;
  tipos.forEach(t => { tipoIds[t.categorias.nombre + '|' + t.nombre] = t.id; });
  Object.entries(catalogo).forEach(([c, lista]) => lista.split('|').concat(OTRO).forEach(t => {
    if (!tipoIds[c + '|' + t]) console.warn('Falta en la base: ' + c + ' / ' + t);
  }));
  const { data, error } = await sb.from('articulos').select(SEL).eq('donante_id', usuarioId).order('creado_en');
  if (error) throw error;
  items.length = 0;
  data.forEach(r => items.push({ ...aItem(r), estado: 'Pendiente', ent: null }));
  render();
}

// ===== Sesión real (Supabase) =====
iniciarPagina('donante', async user => {
  usuarioId = user.id;
  const { data: d, error } = await sb.from('donantes').select('*').eq('usuario_id', user.id).single();
  if (error || !d) { console.error(error); return; }
  Object.assign(perfil, {
    nombre: d.nombre, ap: d.apellido_paterno, am: d.apellido_materno, fecha: d.fecha_nacimiento,
    correo: user.email, ubic: d.ubicacion, tel: d.telefono || '',
    foto: d.foto_ruta ? sb.storage.from('publico').getPublicUrl(d.foto_ruta).data.publicUrl : ''
  });
  cargarPerfil();
  try {
    await cargarInventario();
    await cargarCentros();
    await cargarDonaciones();
    await cargarDinero();
    await cargarImpacto();
    render();
  } catch (x) { console.error(x); alert('No pudimos cargar tus datos. Recarga la página.'); }
});

// =====================================================================
//  PASO F: impacto, perfil, soporte y cuenta (Supabase)
// =====================================================================

// ----- Recomendaciones y reportes de errores -----
[['d-reco', 'r-t', 'recomendacion', 'Gracias por tu recomendación 💙'],
 ['d-error', 'e-t', 'error', 'Recibimos tu reporte. Gracias por avisarnos 💙']].forEach(([dlg, campo, tipo, aviso]) => {
  const f = $(dlg).querySelector('form');
  f.onsubmit = async e => {
    e.preventDefault();
    const texto = $(campo).value.trim(), btn = f.querySelector('button[type=submit]');
    if (!texto) return;
    if (texto.length > 2000) return alert('El mensaje es muy largo (máximo 2000 caracteres).');
    btn.disabled = true;
    const { error } = await sb.from('mensajes_soporte').insert({ usuario_id: usuarioId, tipo, mensaje: texto });
    btn.disabled = false;
    if (error) { console.error(error); return alert('No se pudo enviar. Intenta de nuevo.'); }
    f.reset(); $(dlg).close(); gracias(aviso);
  };
});

// ----- Así se usó tu donación -----
async function cargarImpacto() {
  const { data, error } = await sb.from('reportes_impacto')
    .select('id, mensaje, creado_en, visto, gracias_enviado, reporte_fotos(ruta, orden), donaciones!inner(donante_id, centros(nombre), donacion_articulos(articulos(cantidad, detalle, tipos_articulo(nombre))))')
    .eq('donaciones.donante_id', usuarioId).eq('oculto', false).order('creado_en', { ascending: false });
  if (error) throw error;
  const rutas = data.flatMap(r => r.reporte_fotos.map(f => f.ruta)), firmadas = {};
  if (rutas.length) {
    const { data: s } = await sb.storage.from('privado').createSignedUrls(rutas, 3600);
    (s || []).forEach(x => { if (x.signedUrl) firmadas[x.path] = x.signedUrl; });
  }
  reportes.length = 0;
  data.forEach(r => reportes.push({
    id: r.id, centro: r.donaciones.centros ? r.donaciones.centros.nombre : 'Centro', fecha: r.creado_en.slice(0, 10),
    donacion: r.donaciones.donacion_articulos.map(a => {
      const t = a.articulos.tipos_articulo.nombre;
      return (t === OTRO ? (a.articulos.detalle || t) : t) + ' × ' + a.articulos.cantidad;
    }).join(', '),
    texto: r.mensaje, gracias: r.gracias_enviado, visto: r.visto, nuevo: !r.visto,
    fotos: r.reporte_fotos.sort((a, b) => a.orden - b.orden).map(f => firmadas[f.ruta]).filter(Boolean)
  }));
  pintarImpacto();
}
async function darGracias(r) {
  const { error } = await sb.from('reportes_impacto').update({ gracias_enviado: true }).eq('id', r.id);
  if (error) { console.error(error); return alert('No se pudo enviar el agradecimiento.'); }
  r.gracias = true; pintarImpacto(); gracias('Le avisamos al centro 💙');
}
async function reportarFoto(r) {
  if (!confirm('¿Reportar esta publicación como inapropiada? Dejará de mostrarse y la revisará el equipo de Revive.')) return;
  const d = await sb.from('denuncias_foto').insert({ reporte_id: r.id, motivo: 'Reportada por el donante' });
  if (d.error && d.error.code !== '23505') { console.error(d.error); return alert('No se pudo enviar el reporte.'); }   // 23505 = ya estaba reportada
  const { error } = await sb.from('reportes_impacto').update({ oculto: true }).eq('id', r.id);
  if (error) { console.error(error); return alert('No se pudo ocultar la publicación.'); }
  reportes.splice(reportes.indexOf(r), 1); pintarImpacto(); gracias('Gracias por avisarnos');
}
function pintarImpacto() {
  const l = $('imp-lista'); l.replaceChildren();
  reportes.forEach(r => {
    const a = el('article', 'tarjeta reporte');
    if (r.fotos.length) {
      const g = el('div', 'galeria');
      r.fotos.forEach(u => { const im = document.createElement('img'); im.src = u; im.alt = 'Foto compartida por el centro'; im.loading = 'lazy'; g.append(im); });
      a.append(g);
    }
    a.append(el('h3', '', r.centro), el('p', 'meta', fmt(r.fecha) + ' · Tu donación: ' + r.donacion), el('p', '', r.texto));
    const b = el('div', 'botones');
    const g = el('button', 'btn' + (r.gracias ? ' claro' : ' azul'), r.gracias ? 'Gracias enviado 💙' : 'Dar gracias 💙');
    g.disabled = r.gracias; g.onclick = () => darGracias(r); b.append(g);
    if (r.fotos.length) { const x = el('button', 'btn claro', 'Reportar foto'); x.onclick = () => reportarFoto(r); b.append(x); }
    a.append(b); l.append(a);
  });
  $('imp-vacio').hidden = reportes.length > 0;
  const n = reportes.filter(r => r.nuevo).length;
  $('tab-impacto').textContent = 'Así se usó tu donación' + (n ? ' (' + n + ')' : '');
}
$('tab-impacto').addEventListener('click', async () => {      // al abrir la pestaña, los mensajes quedan como vistos
  const ids = reportes.filter(r => !r.visto).map(r => r.id);
  if (!ids.length) return;
  reportes.forEach(r => { r.visto = true; });
  const { error } = await sb.from('reportes_impacto').update({ visto: true }).in('id', ids);
  if (error) console.error(error);
});

// ----- Perfil: datos y foto -----
let fotoArchivo = null;
$('pf-archivo').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  if (f.size > 5 * 1024 * 1024) { alert('La foto debe pesar máximo 5 MB.'); e.target.value = ''; return; }
  fotoArchivo = f; fotoTmp = URL.createObjectURL(f); ponerFoto($('pf-foto'), fotoTmp, ''); e.target.value = '';
};
$('pf-quitar').onclick = () => { fotoArchivo = null; fotoTmp = ''; ponerFoto($('pf-foto'), '', iniciales()); };
$('f-perfil').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    const campos = {
      nombre: $('p-nombre').value.trim(), apellido_paterno: $('p-ap').value.trim(), apellido_materno: $('p-am').value.trim(),
      fecha_nacimiento: $('p-fecha').value, ubicacion: $('p-ubic').value.trim(), telefono: $('p-tel').value.trim() || null
    };
    const { data: ant } = await sb.from('donantes').select('foto_ruta').eq('usuario_id', usuarioId).single();
    if (fotoTmp && fotoArchivo) campos.foto_ruta = await subirArchivo('publico', usuarioId, fotoArchivo, 'perfil');
    else if (fotoTmp === '') campos.foto_ruta = null;
    const { error } = await sb.from('donantes').update(campos).eq('usuario_id', usuarioId);
    if (error) throw error;
    if ('foto_ruta' in campos && ant && ant.foto_ruta && ant.foto_ruta !== campos.foto_ruta) {
      const r = await sb.storage.from('publico').remove([ant.foto_ruta]);       // borra la foto anterior
      if (r.error) console.warn(r.error);
    }
    Object.assign(perfil, { nombre: campos.nombre, ap: campos.apellido_paterno, am: campos.apellido_materno,
      fecha: campos.fecha_nacimiento, ubic: campos.ubicacion, tel: campos.telefono || '' });
    if ('foto_ruta' in campos) perfil.foto = campos.foto_ruta ? sb.storage.from('publico').getPublicUrl(campos.foto_ruta).data.publicUrl : '';
    fotoArchivo = null; $('d-perfil').close(); gracias('Perfil actualizado ✓');
  } catch (x) { console.error(x); alert('No se pudieron guardar los cambios. ' + (x.message || '')); }
  finally { btn.disabled = false; }
};

// ----- Perfil: contraseña -----
$('f-pass').onsubmit = async e => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
  try {
    const re = await sb.auth.signInWithPassword({ email: perfil.correo, password: $('pw-act').value });
    if (re.error) return alert('La contraseña actual no es correcta.');
    const { error } = await sb.auth.updateUser({ password: $('pw-new').value });
    if (error) throw error;
    e.target.reset(); igual(); gracias('Contraseña actualizada ✓');
  } catch (x) { console.error(x); alert('No se pudo actualizar la contraseña. ' + (x.message || '')); }
  finally { btn.disabled = false; }
};

// ----- Eliminar mi cuenta -----
$('pf-eliminar').onclick = async () => {
  if (!confirm('¿Seguro que quieres eliminar tu cuenta? Se borrarán tu perfil, tu inventario y tus donaciones. No se puede deshacer.')) return;
  const { data: archivos } = await sb.storage.from('publico').list(usuarioId);          // tu foto de perfil
  if (archivos && archivos.length) await sb.storage.from('publico').remove(archivos.map(f => usuarioId + '/' + f.name));
  const { error } = await sb.rpc('eliminar_mi_cuenta');
  if (error) { console.error(error); return alert('No se pudo eliminar la cuenta. Intenta de nuevo.'); }
  await sb.auth.signOut(); location.replace('index.html');
};