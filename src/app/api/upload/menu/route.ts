import { NextResponse } from 'next/server';
import { uploadToBunnyStorage } from '@/lib/bunny';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const codigoUnico = (formData.get('codigo_unico') as string) || 'aliado-temp';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Nombre de archivo seguro
    const extension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const safeFileName = `menu_${timestamp}.${extension}`;
    const folder = `aliados/${codigoUnico}`;

    const cdnUrl = await uploadToBunnyStorage({
      folder,
      fileName: safeFileName,
      buffer,
      contentType: file.type || 'image/jpeg',
    });

    return NextResponse.json({
      success: true,
      url: cdnUrl,
      fileName: safeFileName,
    });
  } catch (error: any) {
    console.error('Error al subir a Bunny Storage:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

