const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixServicesEnum() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma',
  });

  try {
    console.log('Fixing services table enum values...');
    
    // Clear existing data first
    await connection.execute('DELETE FROM services');
    
    // Alter the enum to match what appointment service expects
    await connection.execute(`
      ALTER TABLE services 
      MODIFY COLUMN type ENUM('chat', 'audio_call', 'video_call') NOT NULL
    `);
    
    // Insert correct data
    await connection.execute(`
      INSERT INTO services (type, name, description, is_active) VALUES
      ('chat', 'Chat Consultation', 'Text-based consultation with doctor', true),
      ('audio_call', 'Audio Call', 'Voice call consultation with doctor', true),
      ('video_call', 'Video Call', 'Video call consultation with doctor', true)
    `);
    
    console.log('✅ Services enum fixed successfully');
    
    // Verify
    const [services] = await connection.execute('SELECT id, type, name, description FROM services');
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

fixServicesEnum();