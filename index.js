// ===== Menú móvil =====
const menuBtn = document.querySelector('.menu-btn');
const menu = document.getElementById('menu');
menuBtn.addEventListener('click', () => {
  const abierto = menu.classList.toggle('abierto');
  menuBtn.setAttribute('aria-expanded', abierto);
});
menu.addEventListener('click', e => {
  if (e.target.tagName === 'A') { menu.classList.remove('abierto'); menuBtn.setAttribute('aria-expanded', 'false'); }
});

// ===== Modal de inicio de sesión =====
const login = document.getElementById('login');
document.querySelectorAll('[data-abrir-login]').forEach(b => b.addEventListener('click', () => login.showModal()));
document.querySelectorAll('[data-cerrar-login]').forEach(b => b.addEventListener('click', () => login.close()));
login.addEventListener('click', e => { if (e.target === login) login.close(); });

// ===== Registro de donante (ventana) =====
const registro = document.getElementById('registro');
document.getElementById('abrir-registro').addEventListener('click', e => { e.preventDefault(); login.close(); registro.showModal(); });
document.querySelectorAll('[data-cerrar-registro]').forEach(b => b.addEventListener('click', () => registro.close()));
registro.addEventListener('click', e => { if (e.target === registro) registro.close(); });
const p1 = document.getElementById('r-pass'), p2 = document.getElementById('r-pass2');
const validar = () => p2.setCustomValidity(p1.value === p2.value ? '' : 'Las contraseñas no coinciden');
p1.addEventListener('input', validar); p2.addEventListener('input', validar);

// ===== Registro de centro de acopio (ventana) =====
const registroCentro = document.getElementById('registro-centro');
const formCentro = document.getElementById('form-centro');
const centroOk = document.getElementById('centro-ok');
document.getElementById('abrir-registro-centro').addEventListener('click', e => { e.preventDefault(); login.close(); registroCentro.showModal(); });
document.querySelectorAll('[data-cerrar-centro]').forEach(b => b.addEventListener('click', () => registroCentro.close()));
registroCentro.addEventListener('click', e => { if (e.target === registroCentro) registroCentro.close(); });
registroCentro.addEventListener('close', () => { formCentro.reset(); formCentro.hidden = false; centroOk.hidden = true; });
const rp1 = document.getElementById('rc-pass'), rp2 = document.getElementById('rc-pass2');
const validarCentro = () => rp2.setCustomValidity(rp1.value === rp2.value ? '' : 'Las contraseñas no coinciden');
rp1.addEventListener('input', validarCentro); rp2.addEventListener('input', validarCentro);

// ===== Abrir registros desde cualquier botón =====
document.querySelectorAll('[data-abrir-registro]').forEach(b => b.addEventListener('click', () => registro.showModal()));
document.querySelectorAll('[data-abrir-registro-centro]').forEach(b => b.addEventListener('click', () => registroCentro.showModal()));

const calma = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Palabra que cambia en el título =====
const rota = document.getElementById('rota');
const palabrasRota = ['ropa', 'alimentos', 'juguetes', 'útiles escolares', 'pañales', 'calzado', 'cobijas'];
if (!calma) {
  let k = 0;
  setInterval(() => {
    rota.classList.add('sale');
    setTimeout(() => { k = (k + 1) % palabrasRota.length; rota.textContent = palabrasRota[k]; rota.classList.remove('sale'); }, 300);
  }, 2400);
}

// ===== Explorador de categorías =====
const categorias = {
  'Ropa': { ej: ['Camisetas', 'Pantalones', 'Sudaderas', 'Abrigos', 'Pijamas', 'Calcetines', 'Ropa interior nueva'], tip: 'Limpia y en buen estado. La ropa interior, solo nueva.' },
  'Calzado': { ej: ['Zapatillas', 'Botas', 'Sandalias', 'Zapatos escolares', 'Calzado infantil'], tip: 'Que estén completos (el par) y sin suelas rotas.' },
  'Útiles escolares': { ej: ['Cuadernos', 'Lápices', 'Colores', 'Mochilas', 'Tijeras', 'Calculadoras'], tip: 'Nuevos o en buen estado; los cuadernos, sin hojas usadas.' },
  'Artículos para bebé': { ej: ['Pañales', 'Toallitas húmedas', 'Biberones', 'Cobijas', 'Cochecitos', 'Mordedores'], tip: 'Biberones y chupetes, solo nuevos por higiene; cunas y sillas, en buen estado y seguras.' },
  'Higiene personal': { ej: ['Jabón', 'Champú', 'Pasta y cepillo dental', 'Desodorante', 'Higiene femenina', 'Cortaúñas'], tip: 'Productos sellados y sin abrir.' },
  'Limpieza': { ej: ['Detergente', 'Suavizante', 'Cloro', 'Escobas y mopas', 'Bolsas de basura', 'Esponjas'], tip: 'Envases cerrados y sin fugas.' },
  'Alimentos': { ej: ['Arroz y legumbres', 'Pasta', 'Aceite', 'Enlatados', 'Cereales', 'Leche no perecedera'], tip: 'No perecederos, sellados y con caducidad vigente.' },
  'Juguetes': { ej: ['Peluches', 'Juegos de mesa', 'Rompecabezas', 'Bloques', 'Pelotas', 'Material didáctico'], tip: 'Completos, limpios y sin piezas rotas.' }
};
const catBtns = document.getElementById('cat-botones'), catPanel = document.getElementById('cat-panel');
function verCategoria(nombre) {
  catBtns.querySelectorAll('button').forEach(b => { const on = b.textContent === nombre; b.classList.toggle('activo', on); b.setAttribute('aria-pressed', on); });
  const c = categorias[nombre]; catPanel.replaceChildren();
  const h = document.createElement('h3'); h.textContent = nombre;
  const ul = document.createElement('ul'); ul.className = 'pills';
  c.ej.forEach(x => { const li = document.createElement('li'); li.textContent = x; ul.append(li); });
  const p = document.createElement('p'); p.className = 'relleno'; p.textContent = 'Consejo: ' + c.tip;
  catPanel.append(h, ul, p);
}
Object.keys(categorias).forEach(n => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = n; b.onclick = () => verCategoria(n); catBtns.append(b);
});
verCategoria('Ropa');

// ===== Cómo funciona: donante / centro =====
document.querySelectorAll('[data-flujo]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-flujo]').forEach(x => { const on = x === b; x.classList.toggle('activo', on); x.setAttribute('aria-pressed', on); });
  document.getElementById('flujo-donante').hidden = b.dataset.flujo !== 'donante';
  document.getElementById('flujo-centro').hidden = b.dataset.flujo !== 'centro';
}));

// ===== Aparecer al hacer scroll y contadores =====
const nums = document.querySelectorAll('[data-n]');
function contarHasta(e) {
  const meta = Number(e.dataset.n); let t0;
  const paso = t => { t0 = t0 ?? t; const p = Math.min((t - t0) / 1200, 1); e.textContent = Math.round(meta * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(paso); };
  requestAnimationFrame(paso);
}
if (!calma && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('visto');
    if (e.target.dataset.n) contarHasta(e.target);
    io.unobserve(e.target);
  }), { threshold: 0.15 });
  document.querySelectorAll('main section:not(.hero) .contenedor > *').forEach(x => { x.classList.add('reveal'); io.observe(x); });
  nums.forEach(n => io.observe(n));
} else {
  nums.forEach(n => n.textContent = n.dataset.n);
}

// =====================================================================
//  SUPABASE: inicio de sesión y registros
// =====================================================================
function aviso(form, texto) {            // caja de error dentro del formulario
  let p = form.querySelector('.aviso');
  if (!p) {
    p = document.createElement('p'); p.className = 'aviso'; p.setAttribute('role', 'alert');
    form.querySelector('button[type=submit]').before(p);
  }
  p.textContent = texto || ''; p.hidden = !texto;
}
const textoError = e => {
  const m = (e && e.message) || '';
  if (/already|registered/i.test(m)) return 'Ese correo ya está registrado.';
  if (/password/i.test(m)) return 'La contraseña debe tener al menos 8 caracteres.';
  if (/5 MB|Máximo/i.test(m)) return m;
  return 'No pudimos completar la operación. Revisa los datos e intenta de nuevo.';
};
// Sube un archivo a la carpeta del usuario: <id>/<nombre>-<fecha>.<ext>
async function subir(bucket, uid, archivo, nombre) {
  if (!archivo || !archivo.size) return null;
  if (archivo.size > 5 * 1024 * 1024) throw new Error('Cada archivo debe pesar máximo 5 MB.');
  const ext = (archivo.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ruta = `${uid}/${nombre}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(ruta, archivo, { contentType: archivo.type });
  if (error) throw error;
  return ruta;
}

// ----- Iniciar sesión -----
document.getElementById('form-login').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector('button[type=submit]');
  aviso(f, ''); btn.disabled = true;
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email: f.correo.value.trim(), password: f.password.value });
    if (error) throw new Error('Correo o contraseña incorrectos.');
    const { data: perfil } = await sb.from('perfiles').select('rol').eq('id', data.user.id).single();
    const quiere = f.rol.value;
    if (!perfil || perfil.rol !== quiere) {
      await sb.auth.signOut();
      throw new Error('Esa cuenta no es de tipo ' + (quiere === 'centro' ? 'centro de acopio' : 'donante') + '. Elige el tipo correcto.');
    }
    location.href = perfil.rol === 'centro' ? 'centro.html' : 'donante.html';
  } catch (x) { aviso(f, x.message); btn.disabled = false; }
});

// ----- Registro de donante -----
document.getElementById('form-registro').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector('button[type=submit]');
  aviso(f, ''); btn.disabled = true;
  try {
    const { data, error } = await sb.auth.signUp({
      email: f.correo.value.trim(), password: f.password.value,
      options: { data: {
        rol: 'donante', nombre: f.nombre.value.trim(), apellido_paterno: f.apellido_paterno.value.trim(),
        apellido_materno: f.apellido_materno.value.trim(), fecha_nacimiento: f.fecha_nacimiento.value,
        ubicacion: f.ubicacion.value.trim(), telefono: f.telefono.value.trim()
      } }
    });
    if (error) throw error;
    if (!data.session) throw new Error('Cuenta creada. Confirma tu correo y luego inicia sesión.');
    try {                                 // la foto es opcional: si falla, la cuenta ya quedó creada
      const ruta = await subir('publico', data.user.id, f.foto.files[0], 'perfil');
      if (ruta) await sb.from('donantes').update({ foto_ruta: ruta }).eq('usuario_id', data.user.id);
    } catch (_) { /* se puede agregar después desde el perfil */ }
    location.href = 'donante.html';
  } catch (x) { aviso(f, textoError(x)); btn.disabled = false; }
});

// ----- Registro de centro -----
formCentro.addEventListener('submit', async e => {
  e.preventDefault();
  const v = id => document.getElementById(id).value.trim();
  const btn = formCentro.querySelector('button[type=submit]');
  aviso(formCentro, ''); btn.disabled = true;
  try {
    const banco = v('rc-banco'), titular = v('rc-titular'), clabe = v('rc-clabe');
    if ((banco || titular || clabe) && !(banco && titular && clabe)) {
      throw new Error('Para recibir transferencias llena banco, titular y CLABE, o deja los tres vacíos.');
    }
    const { data, error } = await sb.auth.signUp({
      email: v('rc-correo'), password: document.getElementById('rc-pass').value,
      options: { data: {
        rol: 'centro', nombre: v('rc-nombre'), tipo: document.getElementById('rc-tipo').value, horario: v('rc-horario'),
        ubicacion: v('rc-ubic'), descripcion: v('rc-desc'), responsable: v('rc-resp'), telefono: v('rc-tel')
      } }
    });
    if (error) throw error;
    if (!data.session) throw new Error('Cuenta creada. Confirma tu correo, inicia sesión y completa tus documentos.');
    const uid = data.user.id;
    const domicilio = await subir('privado', uid, document.getElementById('rc-domicilio').files[0], 'domicilio');
    const identificacion = await subir('privado', uid, document.getElementById('rc-ine').files[0], 'identificacion');
    const { error: e1 } = await sb.from('centro_documentos')
      .update({ comprobante_domicilio_ruta: domicilio, identificacion_ruta: identificacion }).eq('centro_id', uid);
    if (e1) throw e1;
    try {                                 // logo opcional
      const logo = await subir('publico', uid, document.getElementById('rc-logo').files[0], 'logo');
      if (logo) await sb.from('centros').update({ logo_ruta: logo }).eq('usuario_id', uid);
    } catch (_) { /* se puede agregar después */ }
    if (clabe) {
      const { error: e2 } = await sb.from('cuentas_bancarias').insert({ centro_id: uid, banco, titular, clabe });
      if (e2) throw new Error('Tu cuenta se creó, pero la CLABE no es válida (deben ser 18 dígitos). Podrás agregarla después.');
    }
    await sb.auth.signOut();              // el centro entra después, cuando lo verifiquen
    formCentro.hidden = true; centroOk.hidden = false;
  } catch (x) { aviso(formCentro, textoError(x)); btn.disabled = false; }
});