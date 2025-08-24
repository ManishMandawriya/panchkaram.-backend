const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTimeSlotsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma',
  });

  try {
    console.log('Creating doctor_time_slots table...');

    // Create the table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS doctor_time_slots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
        time_slot TIME NOT NULL COMMENT 'Specific time slot (e.g., 10:00:00, 10:30:00)',
        is_available BOOLEAN DEFAULT TRUE,
        duration INT DEFAULT 30 COMMENT 'Duration of this slot in minutes',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_doctor_day_time (doctor_id, day_of_week, time_slot)
      )
    `);

    console.log('✅ doctor_time_slots table created successfully');

    // Insert sample time slots for doctor ID 2
    const doctorId = 2;
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    // Generate time slots from 9:00 AM to 5:00 PM with 30-minute intervals
    const timeSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      timeSlots.push(`${hour.toString().padStart(2, '0')}:00:00`);
      timeSlots.push(`${hour.toString().padStart(2, '0')}:30:00`);
    }

    console.log('Inserting sample time slots for doctor 2...');
    
    for (const day of days) {
      for (const timeSlot of timeSlots) {
        try {
          await connection.execute(`
            INSERT IGNORE INTO doctor_time_slots (doctor_id, day_of_week, time_slot, is_available, duration)
            VALUES (?, ?, ?, TRUE, 30)
          `, [doctorId, day, timeSlot]);
        } catch (error) {
          // Ignore duplicate key errors
          if (error.code !== 'ER_DUP_ENTRY') {
            console.error(`Error inserting ${day} ${timeSlot}:`, error.message);
          }
        }
      }
    }

    console.log('✅ Sample time slots inserted successfully');

    // Show inserted slots
    const [slots] = await connection.execute(`
      SELECT day_of_week, time_slot, is_available 
      FROM doctor_time_slots 
      WHERE doctor_id = ? 
      ORDER BY day_of_week, time_slot 
      LIMIT 10
    `, [doctorId]);

    console.log('Sample time slots:');
    slots.forEach(slot => {
      const [hour, minute] = slot.time_slot.split(':');
      const hourNum = parseInt(hour);
      const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
      const ampm = hourNum < 12 ? 'AM' : 'PM';
      const formatted = `${hour12.toString().padStart(2, '0')}:${minute}${ampm}`;
      console.log(`- ${slot.day_of_week}: ${formatted} (Available: ${slot.is_available})`);
    });

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createTimeSlotsTable()
  .then(() => {
    console.log('Time slots table creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Time slots table creation failed:', error);
    process.exit(1);
  });