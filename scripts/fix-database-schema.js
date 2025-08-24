const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDatabaseSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma'
  });

  try {
    console.log('🔧 Fixing database schema...');

    // Add missing columns to reviews table
    try {
      await connection.execute(`
        ALTER TABLE reviews 
        ADD COLUMN is_positive BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_positive column to reviews table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ is_positive column already exists in reviews table');
      } else {
        console.error('❌ Error adding is_positive column:', error.message);
      }
    }

    // Add missing columns to appointments table
    try {
      await connection.execute(`
        ALTER TABLE appointments 
        ADD COLUMN is_upcoming BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added is_upcoming column to appointments table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ is_upcoming column already exists in appointments table');
      } else {
        console.error('❌ Error adding is_upcoming column:', error.message);
      }
    }

    // Add missing columns to users table
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN rating DECIMAL(3,2) DEFAULT 0.00
      `);
      console.log('✅ Added rating column to users table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ rating column already exists in users table');
      } else {
        console.error('❌ Error adding rating column:', error.message);
      }
    }

    // Add missing columns to services table
    try {
      await connection.execute(`
        ALTER TABLE services 
        ADD COLUMN to_public_j_s_o_n BOOLEAN DEFAULT TRUE
      `);
      console.log('✅ Added to_public_j_s_o_n column to services table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ to_public_j_s_o_n column already exists in services table');
      } else {
        console.error('❌ Error adding to_public_j_s_o_n column:', error.message);
      }
    }

    // Fix profile_image column name if needed
    try {
      const [columns] = await connection.execute(`
        SHOW COLUMNS FROM users LIKE 'profile_image'
      `);
      
      if (columns.length === 0) {
        await connection.execute(`
          ALTER TABLE users 
          ADD COLUMN profile_image VARCHAR(500)
        `);
        console.log('✅ Added profile_image column to users table');
      } else {
        console.log('ℹ️ profile_image column already exists in users table');
      }
    } catch (error) {
      console.error('❌ Error with profile_image column:', error.message);
    }

    // Remove excessive indexes from users table
    try {
      const [indexes] = await connection.execute(`
        SHOW INDEX FROM users
      `);
      
      console.log(`📊 Found ${indexes.length} indexes in users table`);
      
      if (indexes.length > 50) {
        console.log('⚠️ Users table has too many indexes, removing some...');
        
        // Remove unique constraints and indexes that are causing issues
        const constraintsToRemove = [
          'users_email_unique',
          'users_phone_number_unique',
          'users_email_key',
          'users_phone_number_key'
        ];
        
        for (const constraintName of constraintsToRemove) {
          try {
            await connection.execute(`ALTER TABLE users DROP INDEX ${constraintName}`);
            console.log(`✅ Removed constraint: ${constraintName}`);
          } catch (error) {
            console.log(`ℹ️ Constraint ${constraintName} doesn't exist or already removed`);
          }
        }
        
        // Remove some non-critical indexes
        const indexesToRemove = [
          'idx_users_email',
          'idx_users_phone_number',
          'idx_users_role',
          'idx_users_is_active',
          'idx_users_is_approved'
        ];
        
        for (const indexName of indexesToRemove) {
          try {
            await connection.execute(`DROP INDEX ${indexName} ON users`);
            console.log(`✅ Removed index: ${indexName}`);
          } catch (error) {
            console.log(`ℹ️ Index ${indexName} doesn't exist or already removed`);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error managing indexes:', error.message);
    }

    console.log('🎉 Database schema fix completed!');
  } catch (error) {
    console.error('❌ Database schema fix failed:', error);
  } finally {
    await connection.end();
  }
}

// Run the fix
fixDatabaseSchema().catch(console.error); 