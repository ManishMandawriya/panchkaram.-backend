const mysql = require('mysql2/promise');

async function verifyPatientPhone() {
  let connection;
  
  try {
    console.log('🔍 Verifying patient phone number...\n');
    
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'panchakarma'
    });

    // Update the patient to be phone verified
    const [result] = await connection.execute(`
      UPDATE users 
      SET is_phone_verified = 1 
      WHERE phone_number = '1234567890' AND role = 'patient'
    `);

    if (result.affectedRows > 0) {
      console.log('✅ Patient phone number verified successfully!');
      
      // Check the updated patient
      const [patients] = await connection.execute(`
        SELECT id, full_name, email, phone_number, is_phone_verified, is_active 
        FROM users 
        WHERE phone_number = '1234567890' AND role = 'patient'
      `);

      if (patients.length > 0) {
        const patient = patients[0];
        console.log('\n📋 Updated patient details:');
        console.log('==========================');
        console.log(`ID: ${patient.id}`);
        console.log(`Name: ${patient.full_name || 'N/A'}`);
        console.log(`Email: ${patient.email}`);
        console.log(`Phone: ${patient.phone_number}`);
        console.log(`Phone Verified: ${patient.is_phone_verified ? '✅ Yes' : '❌ No'}`);
        console.log(`Active: ${patient.is_active ? '✅ Yes' : '❌ No'}`);
      }
    } else {
      console.log('❌ No patient found with phone number 1234567890');
    }

  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyPatientPhone(); 