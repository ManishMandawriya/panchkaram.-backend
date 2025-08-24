const mysql = require('mysql2/promise');

async function checkUsersTable() {
  let connection;
  
  try {
    console.log('🔍 Checking users table structure...\n');
    
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'panchakarma'
    });

    // Check table structure
    const [columns] = await connection.execute('DESCRIBE users');

    console.log('📋 Users table columns:');
    console.log('======================');
    columns.forEach(column => {
      console.log(`${column.Field.padEnd(20)} ${column.Type.padEnd(20)} ${column.Null === 'NO' ? '(required)' : '(nullable)'}`);
    });

    // Check for patients with correct column names
    const [patients] = await connection.execute(`
      SELECT id, full_name, email, phone_number, is_phone_verified, is_active, created_at 
      FROM users 
      WHERE role = 'patient' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);

    console.log('\n📋 Found patients:');
    console.log('==================');
    
    if (patients.length === 0) {
      console.log('❌ No patients found in database');
    } else {
      patients.forEach((patient, index) => {
        console.log(`${index + 1}. ID: ${patient.id}`);
        console.log(`   Name: ${patient.full_name || 'N/A'}`);
        console.log(`   Email: ${patient.email}`);
        console.log(`   Phone: ${patient.phone_number}`);
        console.log(`   Phone Verified: ${patient.is_phone_verified ? '✅ Yes' : '❌ No'}`);
        console.log(`   Active: ${patient.is_active ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${patient.created_at}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkUsersTable(); 