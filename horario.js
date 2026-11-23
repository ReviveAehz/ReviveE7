const Horario = (() => {
    const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const HORAS = [];
    for (let h = 5; h <= 23; h++) ['00', '30'].forEach(m => HORAS.push(String(h).padStart(2, '0') + ':' + m));
    const minutos = t => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const nombre = i => DIAS[i].toLowerCase();
  
    function formato(dias, ini, fin) {
      const d = [...dias].sort((a, b) => a - b), partes = [];
      for (let i = 0; i < d.length;) {
        let j = i; while (j + 1 < d.length && d[j + 1] === d[j] + 1) j++;
        if (j - i >= 2) partes.push(DIAS[d[i]] + ' a ' + nombre(d[j]));
        else for (let k = i; k <= j; k++) partes.push(DIAS[d[k]]);
        i = j + 1;
      }
      return partes.map((p, i) => i ? p.charAt(0).toLowerCase() + p.slice(1) : p).join(', ') + ', ' + ini + ' a ' + fin;
    }
  
    function parse(txt) {
      const t = String(txt || '').trim(), corte = t.lastIndexOf(', ');
      if (corte < 1) return null;
      const m = /^(\d{1,2}):(\d{2}) a (\d{1,2}):(\d{2})$/.exec(t.slice(corte + 2));
      if (!m) return null;
      const p = n => String(n).padStart(2, '0'), ini = p(m[1]) + ':' + m[2], fin = p(m[3]) + ':' + m[4];
      const idx = s => DIAS.findIndex(x => x.toLowerCase() === s.toLowerCase());
      const dias = new Set();
      for (const tok of t.slice(0, corte).split(', ')) {
        const r = /^(\S+) a (\S+)$/.exec(tok), a = idx(r ? r[1] : tok), b = r ? idx(r[2]) : a;
        if (a < 0 || b < a) return null;
        for (let k = a; k <= b; k++) dias.add(k);
      }
      return dias.size && minutos(ini) < minutos(fin) ? { dias: [...dias].sort((a, b) => a - b), ini, fin } : null;
    }
  
    const css = '.horario{display:grid;gap:.6rem}.horario-dias{display:flex;flex-wrap:wrap;gap:.4rem}' +
      '.horario-dias button{font:inherit;font-weight:600;padding:.35rem .8rem;border:2px solid var(--negro,#000);border-radius:999px;background:#fff;color:inherit;cursor:pointer}' +
      '.horario-dias button[aria-pressed="true"]{background:var(--azul-500,#4a96f0)}' +
      '.horario-horas{display:flex;flex-wrap:wrap;gap:.8rem}.horario-horas label{display:flex;align-items:center;gap:.4rem;font-weight:600}' +
      '.horario-aviso{color:#b00020;min-height:1.2em}';
  
    function montar(id) {
      const campo = document.getElementById(id); if (!campo) { console.warn('horario.js: no existe ' + id); return; }
      if (!document.getElementById('horario-css')) { const s = document.createElement('style'); s.id = 'horario-css'; s.textContent = css; document.head.append(s); }
      const valorReal = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      const raiz = document.createElement('div'); raiz.className = 'horario'; raiz.setAttribute('role', 'group'); raiz.setAttribute('aria-label', 'Horario de recepción');
      const fila = document.createElement('div'); fila.className = 'horario-dias';
      const botones = DIAS.map((d, i) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = CORTO[i]; b.title = d; b.setAttribute('aria-pressed', 'false');
        b.onclick = () => { b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); salir(); };
        fila.append(b); return b;
      });
      const horas = document.createElement('div'); horas.className = 'horario-horas';
      const lista = (txt, def) => {
        const l = document.createElement('label'), s = document.createElement('select');
        HORAS.forEach(h => s.append(new Option(h, h))); s.value = def; s.onchange = salir;
        l.append(txt + ' ', s); horas.append(l); return s;
      };
      const ini = lista('Abre', '09:00'), fin = lista('Cierra', '17:00');
      const aviso = document.createElement('small'); aviso.className = 'horario-aviso'; aviso.setAttribute('role', 'alert');
      raiz.append(fila, horas, aviso); campo.after(raiz);
  
      let tocado = false;
      const elegidos = () => botones.map((b, i) => b.getAttribute('aria-pressed') === 'true' ? i : -1).filter(i => i >= 0);
      const problema = () => !elegidos().length ? 'Elige al menos un día de recepción.'
        : minutos(ini.value) >= minutos(fin.value) ? 'La hora de apertura debe ser anterior a la de cierre.' : '';
      function salir() {
        const p = problema(); aviso.textContent = tocado ? p : '';
        valorReal.set.call(campo, p ? '' : formato(elegidos(), ini.value, fin.value));
      }
      Object.defineProperty(campo, 'value', {
        get() { return valorReal.get.call(campo); },
        set(v) {
          valorReal.set.call(campo, v);
          const h = parse(v);
          botones.forEach((b, i) => b.setAttribute('aria-pressed', h && h.dias.includes(i) ? 'true' : 'false'));
          ini.value = h ? h.ini : '09:00'; fin.value = h ? h.fin : '17:00';
          aviso.textContent = ''; tocado = false;
        }
      });
      if (campo.form) {
        campo.form.addEventListener('submit', e => {
          tocado = true; const p = problema(); salir();
          if (p) { e.preventDefault(); e.stopImmediatePropagation(); botones[0].scrollIntoView({ block: 'center' }); }
        }, true);
        campo.form.addEventListener('reset', () => setTimeout(() => { campo.value = ''; }, 0));
      }
    }
    return { DIAS, HORAS, formato, parse, montar, minutos };
  })();
  document.querySelectorAll('input[data-horario]').forEach(i => Horario.montar(i.id));