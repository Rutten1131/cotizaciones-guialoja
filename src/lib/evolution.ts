interface SendWhatsAppMessageParams {
  number: string;
  text: string;
}

interface SendWhatsAppDocumentParams {
  number: string;
  base64File: string;
  fileName: string;
  caption: string;
}

export async function sendEvolutionTextMessage({ number, text }: SendWhatsAppMessageParams) {
  const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!apiUrl || !apiKey || !instance) {
    throw new Error('Evolution API no configurada en las variables de entorno.');
  }

  // Limpiar número
  const cleanNumber = number.replace(/\D/g, '');

  const response = await fetch(`${apiUrl}/message/sendText/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: cleanNumber,
      text: text,
      options: {
        delay: 1200,
        presence: 'composing',
        linkPreview: true,
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Error al enviar texto con Evolution API');
  }

  return data;
}

export async function sendEvolutionDocument({
  number,
  base64File,
  fileName,
  caption,
}: SendWhatsAppDocumentParams) {
  const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;

  if (!apiUrl || !apiKey || !instance) {
    throw new Error('Evolution API no configurada en las variables de entorno.');
  }

  const cleanNumber = number.replace(/\D/g, '');
  // Asegurar formato base64 puro o data uri
  const base64Data = base64File.includes(',') ? base64File.split(',')[1] : base64File;

  const response = await fetch(`${apiUrl}/message/sendMedia/${instance}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: cleanNumber,
      mediatype: 'document',
      mimetype: 'application/pdf',
      caption: caption,
      media: base64Data,
      fileName: fileName,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || 'Error al enviar documento con Evolution API');
  }

  return data;
}

