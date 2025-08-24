const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkServices() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma',
  });

  try {
    console.log('Checking services table...');
    
    // Check if services table exists
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME || 'panchakarma'}' 
      AND TABLE_NAME = 'services'
    `);

    if (tables.length === 0) {
      console.log('❌ Services table does not exist!');
      
      // Create basic services table
      await connection.execute(`
        CREATE TABLE services (
          id INT AUTO_INCREMENT PRIMARY KEY,
          type ENUM('chat', 'audio_call', 'video_call') NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Insert basic service types
      await connection.execute(`
        INSERT INTO services (type, name, description) VALUES
        ('chat', 'Chat Consultation', 'Text-based consultation with doctor'),
        ('audio_call', 'Audio Call', 'Voice call consultation with doctor'),
        ('video_call', 'Video Call', 'Video call consultation with doctor')
      `);
      
      console.log('✅ Created services table with basic service types');
    } else {
      console.log('✅ Services table exists');
      
      // Check existing services
      const [services] = await connection.execute('SELECT * FROM services');
      console.log('Existing services:', services);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

checkServices();