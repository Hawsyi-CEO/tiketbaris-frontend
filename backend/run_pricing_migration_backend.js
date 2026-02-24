const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mysql = require('mysql2/promise');

(async () => {
  const config = {
    host: (process.env.DB_HOST === 'localhost' || !process.env.DB_HOST) ? '127.0.0.1' : process.env.DB_HOST,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tiket',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
  };

  console.log('Using DB config:', { host: config.host, user: config.user, database: config.database, port: config.port });

  const conn = await mysql.createConnection(config);
  try {
    console.log('Connected to DB');

    const table = 'transactions';
    const columnsToAdd = [
      {
        name: 'payment_method',
        definition: "VARCHAR(50) DEFAULT NULL COMMENT 'Payment method: gopay, shopeepay, dana, bank, cc, minimarket, akulaku, kredivo'"
      },
      {
        name: 'midtrans_fee_amount',
        definition: "INT DEFAULT 0 COMMENT 'Biaya Midtrans (varies per payment method)'"
      },
      {
        name: 'platform_fee_amount',
        definition: "INT DEFAULT 0 COMMENT 'Komisi platform 2% (FLAT)'"
      },
      {
        name: 'total_fee_amount',
        definition: "INT DEFAULT 0 COMMENT 'Total fee = midtrans_fee + platform_fee'"
      },
      {
        name: 'net_amount_to_organizer',
        definition: "INT DEFAULT 0 COMMENT 'Uang yang diterima organizer = gross - total_fee'"
      },
      {
        name: 'fee_breakdown',
        definition: "JSON DEFAULT NULL COMMENT 'Breakdown detail: {midtrans, platform, total, percentages}'"
      }
    ];

    for (const col of columnsToAdd) {
      const [rows] = await conn.execute(
        `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [config.database, table, col.name]
      );
      if (rows[0].cnt === 0) {
        console.log(`Adding column ${col.name} to ${table}...`);
        await conn.execute(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.definition}`);
        console.log(`Added column ${col.name}`);
      } else {
        console.log(`Column ${col.name} already exists, skipping.`);
      }
    }

    // Indexes
    const indexes = [
      { name: 'idx_payment_method', cols: 'payment_method' },
      { name: 'idx_fee_amounts', cols: 'platform_fee_amount, midtrans_fee_amount' }
    ];

    for (const idx of indexes) {
      const [idxRows] = await conn.execute(
        `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
        [config.database, table, idx.name]
      );
      if (idxRows[0].cnt === 0) {
        console.log(`Creating index ${idx.name} on ${idx.cols}...`);
        await conn.execute(`ALTER TABLE ${table} ADD INDEX ${idx.name} (${idx.cols})`);
        console.log(`Index ${idx.name} created.`);
      } else {
        console.log(`Index ${idx.name} already exists, skipping.`);
      }
    }

    // Create audit table if not exists
    console.log('Ensuring transactions_fee_audit table exists...');
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS transactions_fee_audit (
        id INT PRIMARY KEY AUTO_INCREMENT,
        transaction_id INT NOT NULL,
        gross_amount INT NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        midtrans_fee INT NOT NULL,
        platform_fee INT NOT NULL,
        total_fee INT NOT NULL,
        net_amount INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id),
        INDEX idx_transaction (transaction_id),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('transactions_fee_audit ensured.');

    // Verification: list added columns
    const [verify] = await conn.execute(
      `SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME IN (?)`,
      [config.database, table, columnsToAdd.map(c => c.name)]
    );

    console.log('\nVerification result:');
    verify.forEach(r => console.log(`- ${r.COLUMN_NAME}: ${r.COLUMN_TYPE} -- ${r.COLUMN_COMMENT}`));

    console.log('\nMigration completed successfully.');
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
})();
