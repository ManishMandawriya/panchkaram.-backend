const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateDoctorServices() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma',
  });

  try {
    console.log('Starting migration to single service record structure...');

    // First, get all existing doctor services
    const [existingServices] = await connection.execute(`
      SELECT * FROM doctor_services ORDER BY doctor_id, service_type
    `);

    console.log(`Found ${existingServices.length} existing service records`);

    // Drop the old table
    await connection.execute('DROP TABLE IF EXISTS doctor_services_backup');
    await connection.execute('CREATE TABLE doctor_services_backup AS SELECT * FROM doctor_services');
    await connection.execute('DROP TABLE doctor_services');

    // Create new table structure
    await connection.execute(`
      CREATE TABLE doctor_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL UNIQUE,
        
        chat_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        chat_enabled BOOLEAN DEFAULT TRUE,
        chat_duration INT DEFAULT 30,
        chat_description TEXT NULL,
        
        audio_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        audio_enabled BOOLEAN DEFAULT TRUE,
        audio_duration INT DEFAULT 30,
        audio_description TEXT NULL,
        
        video_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        video_enabled BOOLEAN DEFAULT TRUE,
        video_duration INT DEFAULT 30,
        video_description TEXT NULL,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Group existing services by doctor_id
    const doctorServices = {};
    existingServices.forEach(service => {
      if (!doctorServices[service.doctor_id]) {
        doctorServices[service.doctor_id] = {
          doctorId: service.doctor_id,
          chat: { price: 0, enabled: false, duration: 30, description: null },
          audio: { price: 0, enabled: false, duration: 30, description: null },
          video: { price: 0, enabled: false, duration: 30, description: null },
        };
      }

      const serviceType = service.service_type;
      if (serviceType === 'chat') {
        doctorServices[service.doctor_id].chat = {
          price: service.price || 0,
          enabled: service.is_enabled !== false,
          duration: service.duration || 30,
          description: service.description,
        };
      } else if (serviceType === 'audio_call') {
        doctorServices[service.doctor_id].audio = {
          price: service.price || 0,
          enabled: service.is_enabled !== false,
          duration: service.duration || 30,
          description: service.description,
        };
      } else if (serviceType === 'video_call') {
        doctorServices[service.doctor_id].video = {
          price: service.price || 0,
          enabled: service.is_enabled !== false,
          duration: service.duration || 30,
          description: service.description,
        };
      }
    });

    // Insert consolidated records
    for (const doctorId in doctorServices) {
      const services = doctorServices[doctorId];
      
      await connection.execute(`
        INSERT INTO doctor_services (
          doctor_id,
          chat_price, chat_enabled, chat_duration, chat_description,
          audio_price, audio_enabled, audio_duration, audio_description,
          video_price, video_enabled, video_duration, video_description
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        services.doctorId,
        services.chat.price, services.chat.enabled, services.chat.duration, services.chat.description,
        services.audio.price, services.audio.enabled, services.audio.duration, services.audio.description,
        services.video.price, services.video.enabled, services.video.duration, services.video.description,
      ]);
    }

    console.log(`Successfully migrated ${Object.keys(doctorServices).length} doctor service records`);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

migrateDoctorServices()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });