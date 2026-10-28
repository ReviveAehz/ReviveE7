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

// ===== Registro de donante =====
const registro = document.getElementById('registro');
document.getElementById('abrir-registro').addEventListener('click', e => { e.preventDefault(); login.close(); registro.showModal(); });
document.querySelectorAll('[data-cerrar-registro]').forEach(b => b.addEventListener('click', () => registro.close()));
registro.addEventListener('click', e => { if (e.target === registro) registro.close(); });
const p1 = document.getElementById('r-pass'), p2 = document.getElementById('r-pass2');
const validar = () => p2.setCustomValidity(p1.value === p2.value ? '' : 'Las contraseñas no coinciden');
p1.addEventListener('input', validar); p2.addEventListener('input', validar);

// ===== Registro de centro de acopio =====
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

formCentro.addEventListener('submit', e => {
  e.preventDefault();
  // Aquí se enviará la solicitud (datos y archivos) al servidor
  formCentro.hidden = true; centroOk.hidden = false;
});

// ===== Inicio de sesión: cada rol va a su propia página =====
document.getElementById('form-login').addEventListener('submit', e => {
  e.target.action = document.getElementById('rol-centro').checked ? 'centro.html' : 'donante.html';
});

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
// Ajusta los consejos según lo que acepte cada centro
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