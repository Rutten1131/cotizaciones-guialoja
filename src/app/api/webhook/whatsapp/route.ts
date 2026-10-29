import { NextResponse } from 'next/server';
import { queryWithRetry } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Evolution API payload para mensajes entrantes
    const event = body?.event;
    const data = body?.data;

    if (event === 'messages.upsert' && data?.message) {
      const remoteJid = data?.key?.remoteJid || '';
      const cleanPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');

      // Obtener el texto del mensaje
      const messageText = (
        data?.message?.conversation ||
        data?.message?.extendedTextMessage?.text ||
        ''
      ).trim().toUpperCase();

      // Si responde ACEPTADO o ACEPTO
      if (messageText.includes('ACEPTADO') || messageText.includes('ACEPTO')) {
        await queryWithRetry(
          `UPDATE contratos_emitidos 
           SET estado_contrato = 'ACEPTADO' 
           WHERE (whatsapp LIKE ? OR whatsapp LIKE ?) AND estado_contrato = 'ENVIADO'
           ORDER BY id DESC LIMIT 1`,
          [`%${cleanPhone}%`, `%${cleanPhone.replace(/^593/, '')}%`]
        );

        console.log(`[Webhook Evolution] Contrato aceptado por ${cleanPhone}.`);
      }
    }

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('Error en Webhook WhatsApp:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

