interface UploadBunnyParams {
  folder: string;
  fileName: string;
  buffer: Buffer;
  contentType: string;
}

export async function uploadToBunnyStorage({
  folder,
  fileName,
  buffer,
  contentType,
}: UploadBunnyParams): Promise<string> {
  const zone = process.env.BUNNY_STORAGE_ZONE;
  const apiKey = process.env.BUNNY_STORAGE_API_KEY;
  const host = process.env.BUNNY_STORAGE_HOST || 'storage.bunnycdn.com';
  const pullZone = process.env.BUNNY_PULLZONE_URL?.replace(/\/$/, '');

  if (!zone || !apiKey || !pullZone) {
    throw new Error('Bunny Storage no está configurado en las variables de entorno.');
  }

  // Limpiar ruta: ej. aliados/GUIALOJA-GASTRO-REST-2026-001/menu.jpg
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const cleanFileName = fileName.replace(/^\/+/, '');
  const storagePath = `${cleanFolder}/${cleanFileName}`;
  const uploadUrl = `https://${host}/${zone}/${storagePath}`;

  // Convertir Buffer a Uint8Array para compatibilidad nativa con fetch en Node/Next.js
  const uint8Array = new Uint8Array(buffer);

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: apiKey,
      'Content-Type': contentType,
    },
    body: uint8Array,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error al subir a BunnyCDN: ${response.status} - ${errorText}`);
  }

  return `${pullZone}/${storagePath}`;
}
