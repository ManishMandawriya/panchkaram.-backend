const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function initializeDoctorServices() {
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

    // Get all doctors
    const [doctors] = await connection.execute(
      "SELECT id, full_name FROM users WHERE role = 'doctor' AND is_active = 1"
    );

    console.log(`📋 Found ${doctors.length} doctors to initialize`);

    for (const doctor of doctors) {
      console.log(`\n👨‍⚕️ Initializing services for: ${doctor.full_name} (ID: ${doctor.id})`);

      // Add default services
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
        console.log(`  ✅ Added ${service.serviceType} service - ₹${service.price}`);
      }

      // Add default availability (Monday to Friday, 9 AM to 5 PM)
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
      console.log(`  ✅ Added weekly availability (Mon-Fri 9AM-5PM)`);
    }

    console.log('\n🎉 Successfully initialized services and availability for all doctors!');

    // Test query to show the results
    const [testResults] = await connection.execute(`
      SELECT 
        u.full_name,
        ds.serviceType,
        ds.price,
        ds.isEnabled,
        da.dayOfWeek,
        da.startTime,
        da.endTime,
        da.isAvailable
      FROM users u
      LEFT JOIN doctor_services ds ON u.id = ds.doctorId
      LEFT JOIN doctor_availability da ON u.id = da.doctorId
      WHERE u.role = 'doctor' AND u.id = ?
      ORDER BY u.full_name, ds.serviceType, da.dayOfWeek
    `, [doctors[0]?.id]);

    if (testResults.length > 0) {
      console.log('\n📊 Sample data for first doctor:');
      console.log(testResults.slice(0, 10)); // Show first 10 records
    }

  } catch (error) {
    console.error('❌ Error initializing doctor services:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the initialization
initializeDoctorServices();