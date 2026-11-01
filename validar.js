// =====================================================================
//  validar.js: validaciones compartidas por todas las páginas de Revive
//  Carga después de config.js:  <script src="validar.js"></script>
//  Las reglas también existen en la base de datos (revive_validaciones.sql): la página
//  avisa bien al usuario, pero la base es quien realmente protege los datos.
// =====================================================================
const V = (() => {
    // ---------- fechas ----------
    const local = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const hoy = () => local(new Date());
    const mas = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return local(d); };
    const hace = anios => { const d = new Date(); d.setFullYear(d.getFullYear() - anios); return local(d); };
  
    // ---------- limpieza ----------
    const lin = v => String(v == null ? '' : v).normalize('NFC').replace(/\s+/g, ' ').trim();                 // una línea
    const multi = v => String(v == null ? '' : v).normalize('NFC').replace(/\r/g, '').replace(/[ \t]+/g, ' ')
      .replace(/ ?\n ?/g, '\n').replace(/\n{3,}/g, '\n\n').trim();                                            // varias líneas
    const palabras = t => t.trim() ? t.trim().split(/\s+/).length : 0;
  
    const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
    const PERSONA = /^\p{L}+(?:[ '’.-]\p{L}+)*\.?$/u;
    const LUGAR = /^[\p{L}\p{N} .,#°ºª\/()&'’:-]+$/u;
    const CORREO = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
    const urlOk = v => { try { const u = new URL(v); return /^https?:$/.test(u.protocol) && u.hostname.includes('.') && !/\s/.test(v); } catch (e) { return false; } };
    const clabeOk = c => {
      if (!/^\d{18}$/.test(c)) return false;
      let s = 0; for (let i = 0; i < 17; i++) s += (Number(c[i]) * [3, 7, 1][i % 3]) % 10;
      return (10 - (s % 10)) % 10 === Number(c[17]);
    };
  
    // ---------- fábrica de reglas ----------
    // cada regla: { f(valor) -> mensaje o '', norm(valor), max, ml (maxlength del campo), ... }
    const campo = (o, check) => ({
      max: o.max, ml: o.ml || o.max, norm: o.norm || (o.multi ? multi : lin),
      f(v) {
        if (v === '') return o.obl === false ? '' : 'Este campo es obligatorio.';
        if (o.max && v.length > o.max) return 'Máximo ' + o.max + ' caracteres.';
        if (CTRL.test(v)) return 'Hay caracteres no permitidos.';
        return check(v) || '';
      }
    });
    const persona = (max = 80, obl = true) => campo({ max, obl }, v => PERSONA.test(v) ? '' : 'Usa solo letras, espacios, guion, punto o apóstrofo.');
    const lugar = (max = 150, obl = true) => campo({ max, obl }, v =>
      !LUGAR.test(v) ? 'Usa solo letras, números y . , # - / ( ) & : (no se permiten símbolos como < > { } ; = $).'
        : !/\p{L}/u.test(v) ? 'Debe incluir letras.' : v.length < 2 ? 'Es demasiado corto.' : '');
    const libre = (max = 2000, obl = true, varias = true) => campo({ max, obl, multi: varias }, v => /[<>]/.test(v) ? 'No se permiten los caracteres < y >.' : '');
    const palabrasMax = (max, obl = true) => {
      const r = libre(max * 14, obl); const f0 = r.f;
      r.f = v => f0(v) || (palabras(v) > max ? 'Máximo ' + max + ' palabras.' : ''); return r;
    };
    const correo = (obl = true) => campo({ max: 150, obl }, v => CORREO.test(v) && !v.includes('..') ? '' : 'Escribe un correo válido, por ejemplo nombre@dominio.com.');
    const telefono = (obl = false) => campo({ max: 20, ml: 24, obl, norm: v => lin(v).replace(/[\s().-]/g, '') },
      v => /^[1-9]\d{9}$/.test(v) && !/^(\d)\1+$/.test(v) ? '' : 'Escribe un teléfono de 10 dígitos.');
    const red = (obl = false) => campo({ max: 255, obl }, v => /^@?[A-Za-z0-9._]{1,30}$/.test(v) || urlOk(v) ? '' : 'Escribe el usuario (@nombre) o un enlace que empiece con https://');
    const web = (obl = false) => campo({ max: 255, obl }, v => urlOk(v) ? '' : 'Escribe un enlace válido que empiece con https://');
    const clabe = (obl = false) => campo({ max: 18, ml: 24, obl, norm: v => lin(v).replace(/[\s-]/g, '') },
      v => !/^\d{18}$/.test(v) ? 'La CLABE debe tener 18 dígitos.' : clabeOk(v) ? '' : 'La CLABE no es válida: el último dígito no coincide.');
    const password = () => campo({ max: 72, norm: v => String(v == null ? '' : v) },
      v => v.length < 8 ? 'Mínimo 8 caracteres.' : !/[A-Za-z]/.test(v) || !/\d/.test(v) ? 'Debe incluir letras y números.' : '');
    const passLogin = () => campo({ max: 72, norm: v => String(v == null ? '' : v) }, () => '');
    const rastreo = () => campo({ max: 40, ml: 40, obl: false, norm: v => lin(v).replace(/\s/g, '') },
      v => /^[A-Za-z0-9]{6,40}$/.test(v) ? '' : 'Usa de 6 a 40 letras o números, sin espacios.');
    const lineas = (maxLineas, maxLen) => campo({ max: maxLineas * (maxLen + 2), obl: false, multi: true }, v => {
      const ls = v.split('\n').map(s => s.trim()).filter(Boolean);
      if (ls.length > maxLineas) return 'Máximo ' + maxLineas + ' insumos.';
      return ls.some(s => s.length > maxLen || !LUGAR.test(s)) ? 'Cada insumo: máximo ' + maxLen + ' caracteres, solo letras, números y . , # - / ( ) & :' : '';
    });
    const num = (f, extra) => ({ norm: lin, f, ...extra });
    const entero = (min, max, obl = true) => num(v => {
      if (v === '') return obl ? 'Este campo es obligatorio.' : '';
      if (!/^\d+$/.test(v)) return 'Escribe un número entero.';
      return Number(v) < min || Number(v) > max ? 'Debe estar entre ' + min + ' y ' + max + '.' : '';
    }, { numero: true, min, max, decimal: false });
    const monto = () => num(v => {
      if (v === '') return 'Este campo es obligatorio.';
      if (!/^\d+(\.\d{1,2})?$/.test(v)) return 'Escribe un monto válido, con máximo 2 decimales.';
      return Number(v) <= 0 ? 'El monto debe ser mayor que 0.' : Number(v) > 1000000 ? 'El monto máximo es $1,000,000.' : '';
    }, { numero: true, decimal: true });
    const fecha = (min, max, obl = true) => num(v => {
      if (v === '') return obl ? 'Escribe una fecha.' : '';
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(Date.parse(v))) return 'La fecha no es válida.';
      const mn = typeof min === 'function' ? min() : min, mx = typeof max === 'function' ? max() : max;
      if (mn && v < mn) return 'La fecha no puede ser anterior al ' + mn + '.';
      if (mx && v > mx) return 'La fecha no puede ser posterior al ' + mx + '.';
      return '';
    }, { fecha: true, min, max });
    const selector = () => num(v => v === '' ? 'Elige una opción.' : '');
  
    // ---------- conexión con los campos ----------
    const aplicar = mapa => {
      const formas = new Set();
      Object.entries(mapa).forEach(([id, r]) => {
        const el = /[#\[.\s]/.test(id) ? document.querySelector(id) : document.getElementById(id);   // por id, o por selector (#form [name=x])
        if (!el) { console.warn('validar.js: no existe ' + id); return; }
        const texto = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && !['date', 'number', 'file', 'checkbox', 'radio'].includes(el.type));
        if (texto && r.ml) el.maxLength = r.ml;
        if (r.fecha) { const g = x => typeof x === 'function' ? x() : x; if (g(r.min)) el.min = g(r.min); if (g(r.max)) el.max = g(r.max); }
        if (el.type === 'number') {
          el.step = r.decimal ? '0.01' : '1'; if (r.min != null) el.min = r.min; if (r.max != null) el.max = r.max;
          el.addEventListener('keydown', e => { if (['e', 'E', '+', '-'].includes(e.key) || (!r.decimal && ['.', ','].includes(e.key))) e.preventDefault(); });
        }
        const validar = escribir => {
          const v = (r.norm || lin)(el.value);
          if (escribir && texto && el.type !== 'password' && v !== el.value) el.value = v;
          el.setCustomValidity(r.f(v));
        };
        el.addEventListener('input', () => validar(false));
        el.addEventListener('change', () => validar(false));
        el.addEventListener('blur', () => validar(true));
        validar(false);
        if (el.form) { (el.form._v = el.form._v || []).push(validar); formas.add(el.form); }
      });
      formas.forEach(f => {
        if (f._vlisto) return; f._vlisto = true;
        f.addEventListener('submit', e => {                         // antes que los demás: limpia y vuelve a validar
          f._v.forEach(fn => fn(true));
          if (!f.checkValidity()) { e.preventDefault(); e.stopImmediatePropagation(); f.reportValidity(); }
        }, true);
      });
    };
  
    // ---------- archivos: se revisa el contenido real, no solo la extensión ----------
    const IMG = ['image/jpeg', 'image/png', 'image/webp'], DOC = IMG.concat('application/pdf');
    const firma = async f => {
      const b = new Uint8Array(await f.slice(0, 12).arrayBuffer());
      const es = (i, t) => [...t].every((c, k) => b[i + k] === c.charCodeAt(0));
      if (b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF) return 'image/jpeg';
      if (b[0] === 0x89 && es(1, 'PNG')) return 'image/png';
      if (es(0, 'RIFF') && es(8, 'WEBP')) return 'image/webp';
      if (es(0, '%PDF-')) return 'application/pdf';
      return '';
    };
    const archivo = async (f, permitidos, mb) => {
      if (!f || !f.size) return 'El archivo está vacío.';
      if (f.size > mb * 1024 * 1024) return 'El archivo es demasiado grande (máximo ' + mb + ' MB).';
      const real = await firma(f);
      if (!real || !permitidos.includes(real)) return 'Tipo de archivo no permitido. Usa ' + (permitidos.includes('application/pdf') ? 'JPG, PNG, WebP o PDF.' : 'JPG, PNG o WebP.');
      return '';
    };
    const archivos = mapa => Object.entries(mapa).forEach(([id, o]) => {
      const el = document.getElementById(id); if (!el) return;
      el.addEventListener('change', async () => {
        for (const f of [...el.files]) {
          const m = await archivo(f, o.tipos, o.mb || 15);
          if (m) { alert(f.name + ': ' + m); el.value = ''; return; }
        }
      });
    });
  
    // ---------- errores en lenguaje claro (nunca se muestran textos técnicos) ----------
    const fallo = t => Object.assign(new Error(t), { code: 'USR' });
    const error = x => {
      const m = (x && x.message) || '';
      if (x && (x.code === 'USR' || x.code === 'P0001' || x.name === 'Error')) return m;       // mensajes escritos por nosotros
      if (x && x.code === '23514') return 'Alguno de los datos tiene un formato no permitido. Revísalos.';
      if (x && x.code === '23505') return 'Ese dato ya existe.';
      if (x && x.code === '23503') return 'No se puede completar porque depende de otro dato.';
      if (x && (x.code === '42501' || /row-level security/i.test(m))) return 'No tienes permiso para hacer esto.';
      if (/already|registered/i.test(m)) return 'Ese correo ya está registrado.';
      if (/Database error/i.test(m)) return 'Revisa los datos: hay campos con formato no permitido.';
      if (/password/i.test(m)) return 'La contraseña no cumple los requisitos.';
      return m ? 'No se pudo completar la operación. Intenta de nuevo.' : '';
    };
  
    return { hoy, mas, hace, lin, multi, palabras, persona, lugar, libre, palabrasMax, correo, telefono, red, web, clabe, password, passLogin, rastreo,
             lineas, entero, monto, fecha, selector, aplicar, archivo, archivos, fallo, error, clabeOk, IMG, DOC };
  })();
  if (typeof module !== 'undefined') module.exports = V;