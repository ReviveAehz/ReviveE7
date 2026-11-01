const SUPABASE_URL = 'https://tyeoaijewdwzwcpvlkzm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Z_RQb7ecCYPcflHOFZIX6A_JQF9qWXT';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function comprimirImagen(archivo, maxLado, calidad) {
  if (!archivo || !archivo.type.startsWith('image/') || archivo.type === 'image/gif') return archivo;
  let bmp;
  try { bmp = await createImageBitmap(archivo); }
  catch (e) { throw V.fallo('La imagen está dañada o no es válida.'); }
  try {
    const k = Math.min(1, maxLado / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', calidad));
    if (!blob || blob.size >= archivo.size) return archivo;
    return new File([blob], archivo.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch (e) { return archivo; }
}

async function subirArchivo(bucket, uid, archivo, nombre) {
  if (!archivo || !archivo.size) return null;
  const err = await V.archivo(archivo, bucket === 'privado' ? V.DOC : V.IMG, 15);   // revisa el contenido real
  if (err) throw V.fallo(err);
  archivo = bucket === 'privado' ? await comprimirImagen(archivo, 2000, 0.85) : await comprimirImagen(archivo, 1280, 0.8);
  const tope = archivo.type === 'application/pdf' ? 5 : 3;
  if (archivo.size > tope * 1024 * 1024) throw V.fallo('Cada ' + (tope === 5 ? 'PDF' : 'imagen') + ' debe pesar máximo ' + tope + ' MB.');
  const ext = (archivo.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const ruta = `${uid}/${nombre}-${Date.now()}.${ext}`;
  const { error } = await sb.storage.from(bucket).upload(ruta, archivo, { contentType: archivo.type });
  if (error) throw error;
  return ruta;
}