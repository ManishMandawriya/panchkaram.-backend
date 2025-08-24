const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUsersAndCreateAppointment() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma',
  });

  try {
    console.log('Checking existing users...');

    // Check what users exist
    const [users] = await connection.execute(`
      SELECT id, email, role FROM users ORDER BY id LIMIT 5
    `);

    console.log('Existing users:', users);

    if (users.length === 0) {
      console.log('No users found, creating a test patient...');
      
      // Create a test patient user
      await connection.execute(`
        INSERT INTO users (email, password, role, full_name, phone, is_active, is_approved, created_at, updated_at)
        VALUES ('testpatient@test.com', '$2a$10$dummy.hash.for.test', 'patient', 'Test Patient', '1234567890', TRUE, TRUE, NOW(), NOW())
      `);
      
      console.log('✅ Test patient created');
    }

    // Get the first available user ID (patient or any user)
    const [availableUsers] = await connection.execute(`
      SELECT id FROM users ORDER BY id LIMIT 1
    `);
    
    const patientId = availableUsers[0].id;
    console.log(`Using patient ID: ${patientId}`);

    // Create a test appointment for doctor 2 on Monday at 10:00AM
    const appointmentDate = '2024-01-15'; // This should be a Monday
    const appointmentTime = '10:00AM';
    const doctorId = 2;

    await connection.execute(`
      INSERT INTO appointments (
        patient_id, doctor_id, appointment_date, appointment_time, 
        service_type, patient_name, patient_age, patient_gender, 
        problem_description, status, total_amount, is_active, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, 'chat', 'Test Patient', '25', 'male', 
        'Test appointment for slot booking', 'confirmed', 200.00, TRUE, NOW(), NOW()
      )
    `, [patientId, doctorId, appointmentDate, appointmentTime]);

    console.log(`✅ Test appointment created successfully`);
    console.log(`   Patient ID: ${patientId}`);
    console.log(`   Doctor: ${doctorId}`);
    console.log(`   Date: ${appointmentDate} (Monday)`);
    console.log(`   Time: ${appointmentTime}`);
    console.log(`   Status: confirmed`);

    // Verify the appointment was created
    const [appointments] = await connection.execute(`
      SELECT id, patient_id, doctor_id, appointment_date, appointment_time, status, patient_name
      FROM appointments 
      WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ?
    `, [doctorId, appointmentDate, appointmentTime]);

    if (appointments.length > 0) {
      console.log('✅ Appointment verified in database:');
      console.log(appointments[0]);
    } else {
      console.log('❌ Appointment not found in database');
    }

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

checkUsersAndCreateAppointment()
  .then(() => {
    console.log('Test appointment creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test appointment creation failed:', error);
    process.exit(1);
  });