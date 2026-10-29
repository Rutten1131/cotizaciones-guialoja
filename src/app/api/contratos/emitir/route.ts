import { NextResponse } from 'next/server';
import { initDatabase, queryWithRetry } from '@/lib/db';
import { sendEvolutionDocument } from '@/lib/evolution';
import { ContratoPayload } from '@/types/contract';

export async function POST(req: Request) {
  try {
    await initDatabase();
    const body: ContratoPayload = await req.json();

    const {
      codigo_unico,
      vertical,
      ecosistema_portal,
      es_piloto,
      nombre_comercial,
      ruc_cedula,
      representante_legal,
      direccion,
      canton = 'Loja',
      whatsapp,
      email,
      modalidad_plan,
      subtotal,
      iva,
      recargo_pasarela,
      total_cobrado,
      metodo_pago,
      dominio_web,
      carta_recogida,
      menu_fotos_urls,
      pdf_base64,
    } = body;

    // Fecha de congelamiento a 1 año si es piloto
    const fechaCongelamiento = es_piloto
      ? new Date(new Date().setFullYear(new Date().getFullYear() + 1))
          .toISOString()
          .slice(0, 10)
      : null;

    const fotosJson = menu_fotos_urls && menu_fotos_urls.length > 0 ? JSON.stringify(menu_fotos_urls) : null;

    const insertQuery = `
      INSERT INTO contratos_emitidos (
        codigo_unico, vertical, ecosistema_portal, es_piloto, nombre_comercial,
        ruc_cedula, representante_legal, direccion, canton, whatsapp, email,
        modalidad_plan, subtotal, iva, recargo_pasarela, total_cobrado,
        metodo_pago, dominio_web, carta_recogida, pdf_url, estado_contrato, fecha_congelamiento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ENVIADO', ?)
      ON DUPLICATE KEY UPDATE 
        total_cobrado = VALUES(total_cobrado),
        pdf_url = VALUES(pdf_url),
        estado_contrato = 'ENVIADO'
    `;

    // Usar queryWithRetry para reconexión automática si ECONNRESET
    await queryWithRetry(insertQuery, [
      codigo_unico,
      vertical,
      ecosistema_portal,
      es_piloto ? 1 : 0,
      nombre_comercial,
      ruc_cedula,
      representante_legal,
      direccion,
      canton,
      whatsapp,
      email || null,
      modalidad_plan,
      subtotal,
      iva,
      recargo_pasarela,
      total_cobrado,
      metodo_pago,
      dominio_web || null,
      carta_recogida ? 1 : 0,
      fotosJson,
      fechaCongelamiento,
    ]);

    // Disparo por WhatsApp vía Evolution API
    let evolutionResponse = null;
    let whatsappError = null;

    const captionTexto = `¡Hola *${representante_legal}*! Bienvenido/a al ecosistema digital *GuIAloja* 🚀.

Adjunto a este mensaje encontrarás el PDF con el contrato oficial de afiliación para *${nombre_comercial}* (${codigo_unico}), el cual ya cuenta con mi firma digital.

📌 *Resumen de tu plan:* ${modalidad_plan} — Total: *$${Number(total_cobrado).toFixed(2)} USD* (${metodo_pago}).

✅ *PASO FINAL PARA ACTIVAR TU FICHA:* Por favor responde a este mensaje con la palabra *ACEPTADO* junto con tu comprobante de pago. (Apenas respondas, nuestro sistema registrará tu alta y el número oficial para recibir tu información).`;

    if (pdf_base64) {
      try {
        evolutionResponse = await sendEvolutionDocument({
          number: whatsapp,
          base64File: pdf_base64,
          fileName: `Contrato_${codigo_unico}.pdf`,
          caption: captionTexto,
        });

        const msgId = evolutionResponse?.key?.id || null;
        if (msgId) {
          await queryWithRetry(
            `UPDATE contratos_emitidos SET whatsapp_message_id = ? WHERE codigo_unico = ?`,
            [msgId, codigo_unico]
          );
        }
      } catch (err: any) {
        console.error('Error Evolution API:', err);
        whatsappError = err.message;
      }
    }

    return NextResponse.json({
      success: true,
      codigo_unico,
      whatsappEnviado: !whatsappError,
      whatsappError,
    });
  } catch (error: any) {
    console.error('Error en POST /api/contratos/emitir:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
