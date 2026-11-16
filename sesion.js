function irA(pagina, motivo) {
  console.warn('Redirigiendo a ' + pagina + (motivo ? ' (' + motivo + ')' : ''));
  location.replace(pagina);
  setTimeout(() => {
    document.body.style.visibility = 'visible';
    document.body.innerHTML = '<p style="padding:2rem;font:16px sans-serif">Redirigiendo… si no cambia, <a href="' + pagina + '">entra aquí</a>.</p>';
  }, 1500);
}

async function cerrarSesion() {
  try { await sb.auth.signOut(); } catch (e) { console.error(e); }
  irA('index.html', 'sesión cerrada');
}

async function iniciarPagina(rolEsperado, alListo) {
  document.querySelectorAll('.lateral nav a[href="index.html"]').forEach(a =>
    a.addEventListener('click', e => { e.preventDefault(); cerrarSesion(); }));
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });   

  const espera = setTimeout(() => irA('index.html', 'tiempo agotado'), 8000);        
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { clearTimeout(espera); return irA('index.html', 'sin sesión'); }
    const user = session.user;
    const { data: perfil, error } = await sb.from('perfiles').select('rol').eq('id', user.id).single();
    clearTimeout(espera);
    if (error || !perfil) return irA('index.html', 'sin perfil');
    if (perfil.rol !== rolEsperado) {
      return irA(perfil.rol === 'centro' ? 'centro.html' : perfil.rol === 'donante' ? 'donante.html' : 'index.html', 'rol distinto');
    }
    document.body.style.visibility = 'visible';
    try { await alListo(user); } catch (e) { console.error(e); }
  } catch (e) {
    clearTimeout(espera);
    console.error(e);
    document.body.style.visibility = 'visible';
    document.body.innerHTML = '<p style="padding:2rem;font:16px sans-serif">No pudimos conectar con el servidor. Revisa tu conexión y <a href="index.html">vuelve al inicio</a>.</p>';
  }
}