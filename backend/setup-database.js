const mysql = require('mysql2/promise');
const path = require('path');

// Database config
const config = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'u390486773_simtix',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Function to add documents column
async function setupDocumentsColumn() {
    try {
        const connection = await mysql.createConnection(config);
        console.log('✅ Connected to database');

        try {
            // Add documents column
            const sql = `
                ALTER TABLE events 
                ADD COLUMN documents LONGTEXT DEFAULT NULL
            `;
            
            const [result] = await connection.execute(sql);
            console.log('✅ Documents column added successfully');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('✅ Documents column already exists');
            } else {
                throw err;
            }
        }

        // Verify column exists
        const [columns] = await connection.execute('DESC events');
        const hasDocuments = columns.some(col => col.Field === 'documents');
        
        if (hasDocuments) {
            console.log('✅ Verified: documents column exists in events table');
        } else {
            console.log('❌ documents column not found');
            await connection.end();
            process.exit(1);
        }

        // Show sample event with documents field
        const [events] = await connection.execute('SELECT id, title, documents FROM events LIMIT 1');
        if (events.length > 0) {
            console.log('✅ Sample event:', events[0]);
        }

        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

// Run setup
setupDocumentsColumn();
