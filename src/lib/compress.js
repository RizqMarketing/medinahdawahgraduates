// Canvas-based image compression with HEIC support for iPhone photos.
// Resizes images to a max dimension and re-encodes as JPEG at a given quality.

function isHeic(file) {
  const t = (file.type || '').toLowerCase()
  const n = (file.name || '').toLowerCase()
  return t === 'image/heic' || t === 'image/heif' ||
         n.endsWith('.heic') || n.endsWith('.heif')
}

async function heicToJpeg(file) {
  const { default: heic2any } = await import('heic2any')
  const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
  const base = (file.name || 'photo').replace(/\.(heic|heif)$/i, '')
  return new File([blob instanceof Blob ? blob : blob[0]], `${base}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  })
}

export async function compressImage(file, { maxDim = 1600, quality = 0.85 } = {}) {
  if (!file) return file

  // Convert HEIC/HEIF first (iPhone photos) so the browser can encode to JPEG
  if (isHeic(file)) {
    try {
      file = await heicToJpeg(file)
    } catch (err) {
      console.warn('HEIC conversion failed, uploading original:', err)
      return file
    }
  }

  if (!file.type?.startsWith('image/')) return file
  // Don't compress GIFs — would lose animation
  if (file.type === 'image/gif') return file

  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch (err) {
    console.warn('Image decode failed, uploading original:', err)
    return file
  }

  const longest = Math.max(bitmap.width, bitmap.height)
  const scale = longest > maxDim ? maxDim / longest : 1
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  let blob
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(w, h)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(bitmap, 0, 0, w, h)
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality })
    } else {
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      ctx.drawImage(bitmap, 0, 0, w, h)
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality))
    }
  } catch (err) {
    console.warn('Image encode failed, uploading original:', err)
    return file
  } finally {
    if (bitmap.close) bitmap.close()
  }

  if (!blob || blob.size >= file.size) return file

  const base = file.name.replace(/\.[^.]+$/, '')
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
}
