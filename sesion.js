// Utilidades de sesión para las páginas privadas (donante.html y centro.html)
function irA(pagina) { location.replace(pagina); }

async function cerrarSesion() {
  await sb.auth.signOut();
  irA('index.html');
}

// Muestra la página solo si hay sesión y el rol coincide; si no, redirige
async function iniciarPagina(rolEsperado, alListo) {
  document.querySelectorAll('.lateral nav a[href="index.html"]').forEach(a =>
    a.addEventListener('click', e => { e.preventDefault(); cerrarSesion(); }));
  window.addEventListener('pageshow', e => { if (e.persisted) location.reload(); });   // botón «atrás» tras cerrar sesión

  let user;
  try {
    const { data, error } = await sb.auth.getUser();
    if (error || !data.user) return irA('index.html');
    user = data.user;
    const { data: perfil } = await sb.from('perfiles').select('rol').eq('id', user.id).single();
    if (!perfil) return irA('index.html');
    if (perfil.rol !== rolEsperado) {      // cuenta de otro tipo: se manda a su propio panel
      return irA(perfil.rol === 'centro' ? 'centro.html' : perfil.rol === 'donante' ? 'donante.html' : 'index.html');
    }
  } catch (e) {
    console.error(e);
    document.body.style.visibility = 'visible';
    document.body.innerHTML = '<p style="padding:2rem;font:16px sans-serif">No pudimos conectar con el servidor. Revisa tu conexión y <a href="index.html">vuelve al inicio</a>.</p>';
    return;
  }
  document.body.style.visibility = 'visible';
  try { await alListo(user); } catch (e) { console.error(e); }
}