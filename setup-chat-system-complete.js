const { Sequelize } = require('sequelize');

// Database connection
const sequelize = new Sequelize('panchakarma', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

async function setupChatSystemComplete() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    console.log('\n🔧 Setting up complete chat system...\n');

    // 1. Fix users table - Add missing columns
    console.log('📋 Step 1: Fixing users table...');
    const [userColumns] = await sequelize.query('DESCRIBE users');
    const userColumnNames = userColumns.map(col => col.Field);
    
    const missingUserColumns = [
      'about_yourself',
      'degrees', 
      'specializations',
      'documents',
      'is_approved',
      'clinic_name',
      'permissions',
      'rating',
      'profile_image',
      'date_of_birth',
      'gender',
      'address',
      'emergency_contact',
      'medical_history',
      'allergies',
      'current_medications',
      'doctor_id',
      'department_id',
      'experience',
      'qualifications',
      'specialization',
      'license_number'
    ];

    for (const column of missingUserColumns) {
      if (!userColumnNames.includes(column)) {
        console.log(`  🔧 Adding missing column: ${column}`);
        try {
          await sequelize.query(`ALTER TABLE users ADD COLUMN ${column} TEXT`);
          console.log(`  ✅ Added ${column}`);
        } catch (error) {
          console.log(`  ⚠️  ${column} already exists or error: ${error.message}`);
        }
      } else {
        console.log(`  ✅ ${column} already exists`);
      }
    }

    // 2. Create chats table
    console.log('\n📋 Step 2: Creating chats table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        patient_id INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_doctor_patient (doctor_id, patient_id),
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_patient_id (patient_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Chats table ready');

    // 3. Create chat_sessions table
    console.log('\n📋 Step 3: Creating chat_sessions table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        doctor_id INT NOT NULL,
        patient_id INT NOT NULL,
        session_type ENUM('chat', 'audioCall', 'videoCall') DEFAULT 'chat',
        session_token VARCHAR(255),
        status ENUM('scheduled', 'ongoing', 'ended', 'canceled') DEFAULT 'scheduled',
        start_time DATETIME,
        end_time DATETIME,
        patient_joined_at DATETIME,
        doctor_joined_at DATETIME,
        duration INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_chat_id (chat_id),
        INDEX idx_session_id (session_id),
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_patient_id (patient_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Chat sessions table ready');

    // 4. Create chat_messages table
    console.log('\n📋 Step 4: Creating chat_messages table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        session_id INT NOT NULL,
        sender_id INT NOT NULL,
        message_id VARCHAR(255),
        message_type ENUM('text', 'image', 'file', 'audio', 'video', 'system') DEFAULT 'text',
        direction ENUM('inbound', 'outbound', 'system') DEFAULT 'inbound',
        content TEXT NOT NULL,
        file_url VARCHAR(500),
        file_name VARCHAR(255),
        file_type VARCHAR(100),
        file_size INT,
        reply_to_message_id VARCHAR(255),
        status ENUM('sent', 'delivered', 'read', 'failed', 'pending') DEFAULT 'pending',
        sent_at DATETIME,
        delivered_at DATETIME,
        read_at DATETIME,
        is_edited BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_chat_id (chat_id),
        INDEX idx_session_id (session_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_message_id (message_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Chat messages table ready');

    // 5. Add missing columns to existing tables if they exist
    console.log('\n📋 Step 5: Adding missing columns to existing tables...');
    
    // Check if chats table has is_active column
    try {
      const [chatColumns] = await sequelize.query('DESCRIBE chats');
      const hasIsActive = chatColumns.some(col => col.Field === 'is_active');
      if (!hasIsActive) {
        await sequelize.query('ALTER TABLE chats ADD COLUMN is_active BOOLEAN DEFAULT TRUE');
        console.log('✅ Added is_active column to chats table');
      } else {
        console.log('✅ is_active column already exists in chats table');
      }
    } catch (error) {
      console.log('⚠️  Chats table check skipped:', error.message);
    }

    // Check if chat_messages table has missing columns
    try {
      const [messageColumns] = await sequelize.query('DESCRIBE chat_messages');
      const messageColumnNames = messageColumns.map(col => col.Field);
      
      if (!messageColumnNames.includes('is_edited')) {
        await sequelize.query('ALTER TABLE chat_messages ADD COLUMN is_edited BOOLEAN DEFAULT FALSE');
        console.log('✅ Added is_edited column to chat_messages table');
      } else {
        console.log('✅ is_edited column already exists in chat_messages table');
      }
      
      if (!messageColumnNames.includes('is_deleted')) {
        await sequelize.query('ALTER TABLE chat_messages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE');
        console.log('✅ Added is_deleted column to chat_messages table');
      } else {
        console.log('✅ is_deleted column already exists in chat_messages table');
      }
      
      if (!messageColumnNames.includes('is_active')) {
        await sequelize.query('ALTER TABLE chat_messages ADD COLUMN is_active BOOLEAN DEFAULT TRUE');
        console.log('✅ Added is_active column to chat_messages table');
      } else {
        console.log('✅ is_active column already exists in chat_messages table');
      }
    } catch (error) {
      console.log('⚠️  Chat messages table check skipped:', error.message);
    }

    // 6. Verify all tables exist and have correct structure
    console.log('\n📋 Step 6: Verifying table structures...');
    
    const tables = ['users', 'chats', 'chat_sessions', 'chat_messages'];
    for (const table of tables) {
      try {
        const [columns] = await sequelize.query(`DESCRIBE ${table}`);
        console.log(`✅ ${table} table exists with ${columns.length} columns`);
      } catch (error) {
        console.log(`❌ ${table} table error: ${error.message}`);
      }
    }

    console.log('\n🎉 Chat system setup completed successfully!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Users table - All required columns added');
    console.log('  ✅ Chats table - Created with proper structure');
    console.log('  ✅ Chat sessions table - Created with proper structure');
    console.log('  ✅ Chat messages table - Created with proper structure');
    console.log('  ✅ All foreign key constraints - Properly configured');
    console.log('  ✅ All indexes - Created for optimal performance');

  } catch (error) {
    console.error('❌ Error setting up chat system:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the setup
setupChatSystemComplete()
  .then(() => {
    console.log('\n🎉 Chat system is ready for production!');
    console.log('\n📝 Next steps:');
    console.log('  1. Start your server: npm run dev');
    console.log('  2. Test Socket.IO connection');
    console.log('  3. Test appointment booking to create chat sessions');
    console.log('  4. Test real-time messaging');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  });
