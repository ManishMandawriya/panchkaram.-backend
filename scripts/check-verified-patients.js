const mysql = require('mysql2/promise');

async function checkVerifiedPatients() {
  let connection;
  
  try {
    console.log('🔍 Checking for verified patients in database...\n');
    
    // Database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'panchakarma'
    });

    // Check for verified patients
    const [patients] = await connection.execute(`
      SELECT id, fullName, email, phoneNumber, isPhoneVerified, isActive, createdAt 
      FROM users 
      WHERE role = 'patient' 
      ORDER BY createdAt DESC 
      LIMIT 10
    `);

    console.log('📋 Found patients:');
    console.log('==================');
    
    if (patients.length === 0) {
      console.log('❌ No patients found in database');
    } else {
      patients.forEach((patient, index) => {
        console.log(`${index + 1}. ID: ${patient.id}`);
        console.log(`   Name: ${patient.fullName || 'N/A'}`);
        console.log(`   Email: ${patient.email}`);
        console.log(`   Phone: ${patient.phoneNumber}`);
        console.log(`   Phone Verified: ${patient.isPhoneVerified ? '✅ Yes' : '❌ No'}`);
        console.log(`   Active: ${patient.isActive ? '✅ Yes' : '❌ No'}`);
        console.log(`   Created: ${patient.createdAt}`);
        console.log('---');
      });
    }

    // Check for any appointments
    const [appointments] = await connection.execute(`
      SELECT id, patientId, doctorId, appointmentDate, appointmentTime, status, isActive
      FROM appointments 
      ORDER BY appointmentDate DESC 
      LIMIT 5
    `);

    console.log('\n📅 Found appointments:');
    console.log('=====================');
    
    if (appointments.length === 0) {
      console.log('❌ No appointments found in database');
    } else {
      appointments.forEach((appointment, index) => {
        console.log(`${index + 1}. ID: ${appointment.id}`);
        console.log(`   Patient ID: ${appointment.patientId}`);
        console.log(`   Doctor ID: ${appointment.doctorId}`);
        console.log(`   Date: ${appointment.appointmentDate}`);
        console.log(`   Time: ${appointment.appointmentTime}`);
        console.log(`   Status: ${appointment.status}`);
        console.log(`   Active: ${appointment.isActive ? '✅ Yes' : '❌ No'}`);
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

checkVerifiedPatients(); 