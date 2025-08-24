const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function createDoctorServiceTables() {
  let connection;

  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'panchakarma',
    });

    console.log('🔗 Connected to MySQL database');

    // Create doctor_services table
    const createDoctorServicesTable = `
      CREATE TABLE IF NOT EXISTS doctor_services (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctorId INT NOT NULL,
        serviceType ENUM('chat', 'audio_call', 'video_call') NOT NULL,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        isEnabled BOOLEAN DEFAULT TRUE,
        description TEXT,
        duration INT DEFAULT 30 COMMENT 'Duration in minutes',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_doctor_service (doctorId, serviceType)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createDoctorServicesTable);
    console.log('✅ doctor_services table created successfully');

    // Create doctor_availability table
    const createDoctorAvailabilityTable = `
      CREATE TABLE IF NOT EXISTS doctor_availability (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctorId INT NOT NULL,
        dayOfWeek ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
        startTime TIME NOT NULL DEFAULT '09:00:00',
        endTime TIME NOT NULL DEFAULT '17:00:00',
        isAvailable BOOLEAN DEFAULT TRUE,
        slotDuration INT DEFAULT 30 COMMENT 'Slot duration in minutes',
        breakTime INT DEFAULT 0 COMMENT 'Break time between slots in minutes',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (doctorId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_doctor_day (doctorId, dayOfWeek)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createDoctorAvailabilityTable);
    console.log('✅ doctor_availability table created successfully');

    // Insert sample data for existing doctors
    const sampleDoctors = await connection.execute(
      "SELECT id FROM users WHERE role = 'doctor' LIMIT 5"
    );

    if (sampleDoctors[0].length > 0) {
      console.log('📝 Adding sample services and availability for existing doctors...');

      for (const doctor of sampleDoctors[0]) {
        // Add sample services
        const services = [
          { serviceType: 'chat', price: 200, isEnabled: true, duration: 30 },
          { serviceType: 'audio_call', price: 500, isEnabled: true, duration: 30 },
          { serviceType: 'video_call', price: 800, isEnabled: false, duration: 30 },
        ];

        for (const service of services) {
          await connection.execute(`
            INSERT IGNORE INTO doctor_services (doctorId, serviceType, price, isEnabled, duration)
            VALUES (?, ?, ?, ?, ?)
          `, [doctor.id, service.serviceType, service.price, service.isEnabled, service.duration]);
        }

        // Add sample availability
        const availability = [
          { dayOfWeek: 'monday', startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
          { dayOfWeek: 'tuesday', startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
          { dayOfWeek: 'wednesday', startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
          { dayOfWeek: 'thursday', startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
          { dayOfWeek: 'friday', startTime: '09:00:00', endTime: '17:00:00', isAvailable: true },
          { dayOfWeek: 'saturday', startTime: '09:00:00', endTime: '17:00:00', isAvailable: false },
          { dayOfWeek: 'sunday', startTime: '09:00:00', endTime: '17:00:00', isAvailable: false },
        ];

        for (const slot of availability) {
          await connection.execute(`
            INSERT IGNORE INTO doctor_availability (doctorId, dayOfWeek, startTime, endTime, isAvailable)
            VALUES (?, ?, ?, ?, ?)
          `, [doctor.id, slot.dayOfWeek, slot.startTime, slot.endTime, slot.isAvailable]);
        }

        console.log(`✅ Added services and availability for doctor ID: ${doctor.id}`);
      }
    }

    console.log('🎉 Doctor service tables created and sample data inserted successfully!');

  } catch (error) {
    console.error('❌ Error creating doctor service tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
createDoctorServiceTables();