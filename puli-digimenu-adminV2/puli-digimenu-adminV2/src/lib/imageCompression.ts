import imageCompression from 'browser-image-compression'

const DEFAULT_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1200,
  useWebWorker: true,
  initialQuality: 0.85,
}

export async function compressImage(file: File): Promise<Blob> {
  return imageCompression(file, DEFAULT_OPTIONS)
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function compressAndToDataUrl(file: File): Promise<string> {
  const compressed = await compressImage(file)
  return blobToDataUrl(compressed)
}
