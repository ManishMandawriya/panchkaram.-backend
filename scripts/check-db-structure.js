const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

async function checkDatabaseStructure() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'panchakarma',
    });

    console.log('🔗 Connected to MySQL database');

    // Check doctor_services table structure
    console.log('\n📋 doctor_services table structure:');
    const [servicesColumns] = await connection.execute('DESCRIBE doctor_services');
    console.table(servicesColumns);

    // Check doctor_availability table structure
    console.log('\n📋 doctor_availability table structure:');
    const [availabilityColumns] = await connection.execute('DESCRIBE doctor_availability');
    console.table(availabilityColumns);

    // Check sample data
    console.log('\n📊 Sample doctor_services data:');
    const [servicesData] = await connection.execute('SELECT * FROM doctor_services LIMIT 3');
    console.table(servicesData);

    console.log('\n📊 Sample doctor_availability data:');
    const [availabilityData] = await connection.execute('SELECT * FROM doctor_availability LIMIT 3');
    console.table(availabilityData);

  } catch (error) {
    console.error('❌ Error checking database structure:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

checkDatabaseStructure();