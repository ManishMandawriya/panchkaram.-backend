const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixServices() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma',
  });

  try {
    console.log('Fixing services table...');
    
    // Clear existing data
    await connection.execute('DELETE FROM services');
    
    // Insert with correct types
    await connection.execute(`
      INSERT INTO services (type, name, description, is_active) VALUES
      ('chat', 'Chat Consultation', 'Text-based consultation with doctor', true),
      ('audio_call', 'Audio Call', 'Voice call consultation with doctor', true),
      ('video_call', 'Video Call', 'Video call consultation with doctor', true)
    `);
    
    console.log('✅ Services fixed successfully');
    
    // Verify services
    const [services] = await connection.execute('SELECT id, type, name, description, is_active FROM services');
    console.log('Fixed services:');
    services.forEach(service => {
      console.log(`- ID: ${service.id}, Type: "${service.type}", Name: "${service.name}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

fixServices();