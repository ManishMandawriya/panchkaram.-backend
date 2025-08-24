const mysql = require('mysql2/promise');
const config = require('../src/config/database');

async function createNewChatTables() {
  let connection;

  try {
    console.log('🔧 Creating new chat tables structure...');

    // Create database connection
    connection = await mysql.createConnection({
      host: config.host,
      user: config.username,
      password: config.password,
      database: config.database,
    });

    // Drop existing tables if they exist
    console.log('🗑️ Dropping existing chat tables...');
    await connection.execute('DROP TABLE IF EXISTS chat_messages');
    await connection.execute('DROP TABLE IF EXISTS chat_sessions');

    // Create chats table (single entry per doctor-patient pair)
    console.log('📋 Creating chats table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        doctor_id INT NOT NULL,
        patient_id INT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_patient_id (patient_id),
        INDEX idx_doctor_patient (doctor_id, patient_id),
        INDEX idx_is_active (is_active),
        INDEX idx_created_at (created_at),
        
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        
        UNIQUE KEY unique_doctor_patient (doctor_id, patient_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create chat_sessions table (multiple sessions per chat)
    console.log('📋 Creating chat_sessions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        doctor_id INT NOT NULL,
        patient_id INT NOT NULL,
        session_type ENUM('chat', 'audioCall', 'videoCall') NOT NULL DEFAULT 'chat',
        session_token VARCHAR(500) NULL,
        status ENUM('scheduled', 'ongoing', 'ended', 'canceled') NOT NULL DEFAULT 'scheduled',
        start_time DATETIME NULL,
        end_time DATETIME NULL,
        patient_joined_at DATETIME NULL,
        doctor_joined_at DATETIME NULL,
        duration INT NOT NULL DEFAULT 0 COMMENT 'Duration in seconds',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_chat_id (chat_id),
        INDEX idx_session_id (session_id),
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_patient_id (patient_id),
        INDEX idx_status (status),
        INDEX idx_session_type (session_type),
        INDEX idx_start_time (start_time),
        INDEX idx_is_active (is_active),
        INDEX idx_created_at (created_at),
        
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create chat_messages table (messages within sessions)
    console.log('📋 Creating chat_messages table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        chat_id INT NOT NULL,
        session_id INT NOT NULL,
        sender_id INT NOT NULL,
        message_type ENUM('text', 'image', 'file', 'audio', 'video', 'system') NOT NULL DEFAULT 'text',
        direction ENUM('inbound', 'outbound', 'system') NOT NULL DEFAULT 'inbound',
        content TEXT NOT NULL,
        file_url VARCHAR(500) NULL,
        file_name VARCHAR(255) NULL,
        file_type VARCHAR(100) NULL,
        file_size INT NULL,
        status ENUM('sent', 'delivered', 'read', 'failed', 'pending') NOT NULL DEFAULT 'pending',
        sent_at DATETIME NULL,
        delivered_at DATETIME NULL,
        read_at DATETIME NULL,
        message_id VARCHAR(36) NULL,
        reply_to_message_id VARCHAR(36) NULL,
        is_edited BOOLEAN NOT NULL DEFAULT FALSE,
        edited_at DATETIME NULL,
        is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
        deleted_at DATETIME NULL,
        metadata JSON NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_chat_id (chat_id),
        INDEX idx_session_id (session_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_message_type (message_type),
        INDEX idx_direction (direction),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_message_id (message_id),
        INDEX idx_reply_to_message_id (reply_to_message_id),
        INDEX idx_is_active (is_active),
        
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create additional indexes for better performance
    console.log('🔍 Creating additional indexes...');
    
    // Composite indexes for common queries
    await connection.execute(`
      CREATE INDEX idx_chat_sessions_chat_status ON chat_sessions(chat_id, status)
    `);

    await connection.execute(`
      CREATE INDEX idx_chat_sessions_doctor_status ON chat_sessions(doctor_id, status)
    `);

    await connection.execute(`
      CREATE INDEX idx_chat_sessions_patient_status ON chat_sessions(patient_id, status)
    `);

    await connection.execute(`
      CREATE INDEX idx_chat_messages_session_created ON chat_messages(session_id, created_at)
    `);

    await connection.execute(`
      CREATE INDEX idx_chat_messages_session_status ON chat_messages(session_id, status)
    `);

    await connection.execute(`
      CREATE INDEX idx_chat_messages_sender_session ON chat_messages(sender_id, session_id)
    `);

    await connection.execute(`
      CREATE INDEX idx_chat_messages_chat_created ON chat_messages(chat_id, created_at)
    `);

    console.log('✅ New chat tables created successfully!');
    console.log('');
    console.log('📊 Tables created:');
    console.log('  - chats (single entry per doctor-patient pair)');
    console.log('  - chat_sessions (multiple sessions per chat)');
    console.log('  - chat_messages (messages within sessions)');
    console.log('');
    console.log('🔍 Indexes created:');
    console.log('  - Primary keys and foreign keys');
    console.log('  - Status and type indexes');
    console.log('  - Timestamp indexes');
    console.log('  - Composite indexes for performance');
    console.log('  - Unique constraint on doctor-patient pair');
    console.log('');
    console.log('🎯 Ready for new chat functionality!');

  } catch (error) {
    console.error('❌ Error creating new chat tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
createNewChatTables()
  .then(() => {
    console.log('🎉 New chat tables migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 New chat tables migration failed:', error);
    process.exit(1);
  });
