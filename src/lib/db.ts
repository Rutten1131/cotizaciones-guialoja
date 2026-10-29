import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getDbPool(): mysql.Pool {
  if (!pool) {
    const config: mysql.PoolOptions = {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,

      // ── Pool settings robustos para StackCP ────────────────────────────────
      waitForConnections: true,
      connectionLimit: 5,          // StackCP tiene límite bajo de conexiones
      queueLimit: 0,

      // Evitar que el pool reutilice conexiones muertas
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000, // 10 s

      // Reconectar automáticamente si la conexión se cae
      connectTimeout: 30000,        // 30 s timeout al conectar

      // StackCP cierra conexiones inactivas; ajustamos para que no duren más
      // que el wait_timeout del servidor (típicamente 28 s en hosts compartidos)
    };

    if (process.env.DB_SSL === 'true') {
      config.ssl = { rejectUnauthorized: false };
    }

    pool = mysql.createPool(config);

    // Limpiar conexiones muertas del pool antes de que el servidor las corte
    pool.on('connection', (connection) => {
      connection.query('SET SESSION wait_timeout=28');
    });
  }
  return pool;
}

// Ejecuta una query con reintento automático si la conexión fue cortada
export async function queryWithRetry<T = any>(
  sql: string,
  values?: any[],
  retries = 2
): Promise<T> {
  const db = getDbPool();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const [rows] = values
        ? await db.execute(sql, values)
        : await db.query(sql);
      return rows as T;
    } catch (err: any) {
      const isConnectionError =
        err.code === 'ECONNRESET' ||
        err.code === 'PROTOCOL_CONNECTION_LOST' ||
        err.code === 'ENOTFOUND' ||
        err.fatal === true;

      if (isConnectionError && attempt < retries) {
        console.warn(`[DB] Conexión perdida (intento ${attempt}/${retries}). Reintentando...`);
        // Forzar recreación del pool en el siguiente getDbPool()
        pool = null;
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error('queryWithRetry: agotados todos los reintentos');
}

let dbInitialized = false;

export async function initDatabase(): Promise<void> {
  // Solo crear la tabla una vez por ciclo de vida del proceso
  if (dbInitialized) return;

  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS contratos_emitidos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      codigo_unico VARCHAR(60) NOT NULL UNIQUE,
      vertical VARCHAR(40) NOT NULL,
      ecosistema_portal VARCHAR(100) NOT NULL,
      es_piloto TINYINT(1) DEFAULT 1,
      nombre_comercial VARCHAR(150) NOT NULL,
      ruc_cedula VARCHAR(20) NOT NULL,
      representante_legal VARCHAR(150) NOT NULL,
      direccion TEXT,
      canton VARCHAR(50) DEFAULT 'Loja',
      whatsapp VARCHAR(25) NOT NULL,
      email VARCHAR(120),
      modalidad_plan VARCHAR(80) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      iva DECIMAL(10,2) DEFAULT 0.00,
      recargo_pasarela DECIMAL(10,2) DEFAULT 0.00,
      total_cobrado DECIMAL(10,2) NOT NULL,
      metodo_pago VARCHAR(50) NOT NULL,
      dominio_web VARCHAR(150) NULL,
      carta_recogida TINYINT(1) DEFAULT 0,
      fotos_urls TEXT NULL,
      pdf_url TEXT NULL,
      estado_contrato VARCHAR(25) DEFAULT 'ENVIADO',
      whatsapp_message_id VARCHAR(100) NULL,
      fecha_emision DATETIME DEFAULT CURRENT_TIMESTAMP,
      fecha_congelamiento DATE NULL,
      INDEX idx_vertical (vertical),
      INDEX idx_estado (estado_contrato),
      INDEX idx_whatsapp (whatsapp)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await queryWithRetry(createTableQuery);

  // Asegurar que la columna fotos_urls exista si la tabla ya había sido creada antes
  try {
    await queryWithRetry(`ALTER TABLE contratos_emitidos ADD COLUMN fotos_urls TEXT NULL AFTER carta_recogida`);
  } catch (e: any) {
    // Si ya existe (código ER_DUP_FIELDNAME), ignorar
  }
  dbInitialized = true;
  console.log('[DB] Tabla contratos_emitidos verificada/creada.');
}
