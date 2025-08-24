const { Sequelize } = require('sequelize');

// Database connection
const sequelize = new Sequelize('panchakarma', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

async function recreateChatTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');

    console.log('🗑️  Dropping existing chat tables...');
    
    // Drop existing tables in correct order (due to foreign key constraints)
    try {
      await sequelize.query('DROP TABLE IF EXISTS chat_messages');
      console.log('✅ Dropped chat_messages table');
    } catch (error) {
      console.log('⚠️  chat_messages table already dropped or doesn\'t exist');
    }

    try {
      await sequelize.query('DROP TABLE IF EXISTS chat_sessions');
      console.log('✅ Dropped chat_sessions table');
    } catch (error) {
      console.log('⚠️  chat_sessions table already dropped or doesn\'t exist');
    }

    try {
      await sequelize.query('DROP TABLE IF EXISTS chats');
      console.log('✅ Dropped chats table');
    } catch (error) {
      console.log('⚠️  chats table already dropped or doesn\'t exist');
    }

    // Force drop chats table if it still exists
    try {
      await sequelize.query('DROP TABLE chats');
      console.log('✅ Force dropped chats table');
    } catch (error) {
      console.log('⚠️  chats table already dropped or doesn\'t exist');
    }

    console.log('\n🔧 Creating new chat tables...');

    // Create chats table first
    await sequelize.query(`
      CREATE TABLE chats (
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
    console.log('✅ Created chats table');

    // Create chat_sessions table
    await sequelize.query(`
      CREATE TABLE chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        doctor_id INT NOT NULL,
        patient_id INT NOT NULL,
        session_type ENUM('chat', 'audioCall', 'videoCall') NOT NULL DEFAULT 'chat',
        session_token VARCHAR(500),
        status ENUM('scheduled', 'ongoing', 'ended', 'canceled') NOT NULL DEFAULT 'scheduled',
        start_time DATETIME,
        end_time DATETIME,
        patient_joined_at DATETIME,
        doctor_joined_at DATETIME,
        duration INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_session_id (session_id),
        INDEX idx_chat_id (chat_id),
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_patient_id (patient_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created chat_sessions table');

    // Create chat_messages table
    await sequelize.query(`
      CREATE TABLE chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        session_id INT NOT NULL,
        sender_id INT NOT NULL,
        message_id VARCHAR(255) UNIQUE,
        message_type ENUM('text', 'image', 'file', 'audio', 'video', 'system') NOT NULL DEFAULT 'text',
        direction ENUM('inbound', 'outbound', 'system') NOT NULL DEFAULT 'inbound',
        content TEXT,
        file_url VARCHAR(500),
        file_name VARCHAR(255),
        file_type VARCHAR(100),
        file_size INT,
        reply_to_message_id VARCHAR(255),
        status ENUM('sent', 'delivered', 'read', 'failed') NOT NULL DEFAULT 'sent',
        sent_at DATETIME,
        delivered_at DATETIME,
        read_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_chat_id (chat_id),
        INDEX idx_session_id (session_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_message_id (message_id),
        INDEX idx_sent_at (sent_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created chat_messages table');

    // Verify table structures
    console.log('\n📋 Verifying table structures...');
    
    const [chatColumns] = await sequelize.query('DESCRIBE chats');
    console.log('\n📋 chats table structure:');
    chatColumns.forEach(row => {
      console.log(`  ${row.Field} - ${row.Type}`);
    });

    const [sessionColumns] = await sequelize.query('DESCRIBE chat_sessions');
    console.log('\n📋 chat_sessions table structure:');
    sessionColumns.forEach(row => {
      console.log(`  ${row.Field} - ${row.Type}`);
    });

    const [messageColumns] = await sequelize.query('DESCRIBE chat_messages');
    console.log('\n📋 chat_messages table structure:');
    messageColumns.forEach(row => {
      console.log(`  ${row.Field} - ${row.Type}`);
    });

    console.log('\n🎉 All chat tables recreated successfully!');

  } catch (error) {
    console.error('❌ Error recreating chat tables:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the script
recreateChatTables()
  .then(() => {
    console.log('\n🎉 Chat tables recreated successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to recreate chat tables:', error);
    process.exit(1);
  });
