const mysql = require('mysql2/promise');
const config = require('../src/config/database');

async function createChatTables() {
  let connection;

  try {
    console.log('🔧 Creating chat tables...');

    // Create database connection
    connection = await mysql.createConnection({
      host: config.host,
      user: config.username,
      password: config.password,
      database: config.database,
    });

    // Create chat_sessions table
    console.log('📋 Creating chat_sessions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        patient_id INT NOT NULL,
        doctor_id INT NOT NULL,
        session_type ENUM('chat', 'audio_call', 'video_call') NOT NULL DEFAULT 'chat',
        status ENUM('pending', 'active', 'paused', 'completed', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
        total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        total_duration INT NOT NULL DEFAULT 0,
        total_messages INT NOT NULL DEFAULT 0,
        started_at DATETIME NULL,
        ended_at DATETIME NULL,
        expires_at DATETIME NULL,
        notes TEXT NULL,
        is_paid BOOLEAN NOT NULL DEFAULT FALSE,
        payment_transaction_id VARCHAR(255) NULL,
        paid_at DATETIME NULL,
        is_rated BOOLEAN NOT NULL DEFAULT FALSE,
        rating INT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_patient_id (patient_id),
        INDEX idx_doctor_id (doctor_id),
        INDEX idx_status (status),
        INDEX idx_session_type (session_type),
        INDEX idx_created_at (created_at),
        INDEX idx_expires_at (expires_at),
        INDEX idx_is_active (is_active),
        
        FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create chat_messages table
    console.log('📋 Creating chat_messages table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
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
        
        INDEX idx_session_id (session_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_message_type (message_type),
        INDEX idx_direction (direction),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        INDEX idx_message_id (message_id),
        INDEX idx_reply_to_message_id (reply_to_message_id),
        INDEX idx_is_active (is_active),
        
        FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Create additional indexes for better performance
    console.log('🔍 Creating additional indexes...');
    
    // Composite indexes for common queries
    await connection.execute(`
      CREATE INDEX idx_chat_sessions_patient_status ON chat_sessions(patient_id, status)
    `);

    await connection.execute(`
      CREATE INDEX idx_chat_sessions_doctor_status ON chat_sessions(doctor_id, status)
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

    console.log('✅ Chat tables created successfully!');
    console.log('');
    console.log('📊 Tables created:');
    console.log('  - chat_sessions');
    console.log('  - chat_messages');
    console.log('');
    console.log('🔍 Indexes created:');
    console.log('  - Primary keys and foreign keys');
    console.log('  - Status and type indexes');
    console.log('  - Timestamp indexes');
    console.log('  - Composite indexes for performance');
    console.log('');
    console.log('🎯 Ready for chat functionality!');

  } catch (error) {
    console.error('❌ Error creating chat tables:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
createChatTables()
  .then(() => {
    console.log('🎉 Chat tables migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Chat tables migration failed:', error);
    process.exit(1);
  });
