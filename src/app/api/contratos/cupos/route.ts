import { NextResponse } from 'next/server';
import { getDbPool, initDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();
    const db = getDbPool();

    const [rows]: [any[], any] = await db.query(`
      SELECT 
        vertical,
        COUNT(*) as total,
        SUM(CASE WHEN estado_contrato IN ('ACEPTADO', 'ACTIVO') THEN 1 ELSE 0 END) as ocupados
      FROM contratos_emitidos
      GROUP BY vertical
    `);

    let cupos = {
      gastro: { ocupados: 0, limite: 40 },
      hotelesSm: { ocupados: 0, limite: 20 },
      operadores: { ocupados: 0, limite: 10 },
    };

    rows.forEach((row) => {
      const v = row.vertical;
      const count = Number(row.ocupados) || 0;
      if (v === 'GUIALOJA-GASTRO-REST' || v === 'GUIALOJA-GASTRO-CAFE') {
        cupos.gastro.ocupados += count;
      } else if (v === 'GUIALOJA-HOTEL-SM') {
        cupos.hotelesSm.ocupados += count;
      } else if (v === 'GUIALOJA-TUR-OPE') {
        cupos.operadores.ocupados += count;
      }
    });

    return NextResponse.json({ success: true, cupos });
  } catch (error: any) {
    console.error('Error al obtener cupos:', error);
    // Retornar fallback para no romper interfaz si la DB está iniciando
    return NextResponse.json({
      success: false,
      error: error.message,
      cupos: {
        gastro: { ocupados: 14, limite: 40 },
        hotelesSm: { ocupados: 6, limite: 20 },
        operadores: { ocupados: 3, limite: 10 },
      },
    });
  }
}

