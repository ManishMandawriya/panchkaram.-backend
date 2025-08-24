const mysql = require('mysql2/promise');
require('dotenv').config();

async function describeServices() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma',
  });

  try {
    console.log('Describing services table structure...');
    
    const [structure] = await connection.execute('DESCRIBE services');
    console.log('Table structure:', structure);
    
    // Try to fix by updating existing records
    await connection.execute(`UPDATE services SET type = 'chat' WHERE name = 'Chat Consultation'`);
    await connection.execute(`UPDATE services SET type = 'audio_call' WHERE name = 'Audio Call'`);
    await connection.execute(`UPDATE services SET type = 'video_call' WHERE name = 'Video Call'`);
    
    console.log('Updated existing records...');
    
    // Verify
    const [services] = await connection.execute('SELECT id, type, name FROM services');
    console.log('Updated services:', services);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

describeServices();