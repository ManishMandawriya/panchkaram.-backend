const mysql = require('mysql2/promise');
require('dotenv').config();

async function populateServices() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma',
  });

  try {
    console.log('Populating services table...');
    
    // Insert basic service types
    await connection.execute(`
      INSERT IGNORE INTO services (type, name, description, is_active) VALUES
      ('chat', 'Chat Consultation', 'Text-based consultation with doctor', true),
      ('audio_call', 'Audio Call', 'Voice call consultation with doctor', true),
      ('video_call', 'Video Call', 'Video call consultation with doctor', true)
    `);
    
    console.log('✅ Services populated successfully');
    
    // Verify services
    const [services] = await connection.execute('SELECT * FROM services');
    console.log('Available services:', services);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

populateServices();