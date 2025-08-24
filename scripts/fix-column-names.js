const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function fixColumnNames() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'panchakarma',
    });

    console.log('🔗 Connected to MySQL database');

    // Fix doctor_services table column names
    console.log('\n🔧 Fixing doctor_services table column names...');
    
    await connection.execute('ALTER TABLE doctor_services CHANGE doctorId doctor_id INT NOT NULL');
    console.log('✅ Renamed doctorId to doctor_id');
    
    await connection.execute('ALTER TABLE doctor_services CHANGE serviceType service_type ENUM("chat","audio_call","video_call") NOT NULL');
    console.log('✅ Renamed serviceType to service_type');
    
    await connection.execute('ALTER TABLE doctor_services CHANGE isEnabled is_enabled TINYINT(1) DEFAULT 1');
    console.log('✅ Renamed isEnabled to is_enabled');
    
    await connection.execute('ALTER TABLE doctor_services CHANGE createdAt created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Renamed createdAt to created_at');
    
    await connection.execute('ALTER TABLE doctor_services CHANGE updatedAt updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    console.log('✅ Renamed updatedAt to updated_at');

    // Fix doctor_availability table column names
    console.log('\n🔧 Fixing doctor_availability table column names...');
    
    await connection.execute('ALTER TABLE doctor_availability CHANGE doctorId doctor_id INT NOT NULL');
    console.log('✅ Renamed doctorId to doctor_id');
    
    await connection.execute('ALTER TABLE doctor_availability CHANGE dayOfWeek day_of_week ENUM("monday","tuesday","wednesday","thursday","friday","saturday","sunday") NOT NULL');
    console.log('✅ Renamed dayOfWeek to day_of_week');
    
    await connection.execute('ALTER TABLE doctor_availability CHANGE startTime start_time TIME NOT NULL DEFAULT "09:00:00"');
    console.log('✅ Renamed startTime to start_time');
    
    await connection.execute('ALTER TABLE doctor_availability CHANGE endTime end_time TIME NOT NULL DEFAULT "17:00:00"');
    console.log('✅ Renamed endTime to end_time');
    
    await connection.execute('ALTER TABLE doctor_availability CHANGE isAvailable is_available TINYINT(1) DEFAULT 1');
    console.log('✅ Renamed isAvailable to is_available');
    
    await connection.execute('ALTER TABLE doctor_availability CHANGE slotDuration slot_duration INT DEFAULT 30');
    console.log('✅ Renamed slotDuration to slot_duration');
    
    await connection.execute('ALTER TABLE doctor_availability CHANGE breakTime break_time INT DEFAULT 0');
    console.log('✅ Renamed breakTime to break_time');
    
    await connection.execute('ALTER TABLE doctor_availability CHANGE createdAt created_at DATETIME DEFAULT CURRENT_TIMESTAMP');
    console.log('✅ Renamed createdAt to created_at');
    
    await connection.execute('ALTER TABLE doctor_availability CHANGE updatedAt updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    console.log('✅ Renamed updatedAt to updated_at');

    console.log('\n🎉 All column names fixed successfully!');

    // Verify the changes
    console.log('\n📋 Updated doctor_services table structure:');
    const [servicesColumns] = await connection.execute('DESCRIBE doctor_services');
    console.table(servicesColumns.map(col => ({ Field: col.Field, Type: col.Type })));

    console.log('\n📋 Updated doctor_availability table structure:');
    const [availabilityColumns] = await connection.execute('DESCRIBE doctor_availability');
    console.table(availabilityColumns.map(col => ({ Field: col.Field, Type: col.Type })));

  } catch (error) {
    console.error('❌ Error fixing column names:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

fixColumnNames();