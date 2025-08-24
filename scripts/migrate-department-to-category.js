const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateDepartmentToCategory() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma'
  });

  try {
    console.log('🔧 Migrating department enum to category foreign key...');

    // First, let's create some default categories if they don't exist
    const defaultCategories = [
      { name: 'Cardiology', description: 'Heart and cardiovascular system' },
      { name: 'Neurology', description: 'Brain and nervous system' },
      { name: 'Orthopedics', description: 'Bones and joints' },
      { name: 'Dermatology', description: 'Skin conditions' },
      { name: 'Pediatrics', description: 'Child healthcare' },
      { name: 'General Medicine', description: 'General healthcare' },
      { name: 'Surgery', description: 'Surgical procedures' },
      { name: 'Psychiatry', description: 'Mental health' },
      { name: 'Oncology', description: 'Cancer treatment' },
      { name: 'Gynecology', description: 'Women health' },
    ];

    console.log('📋 Creating default categories...');
    for (const category of defaultCategories) {
      try {
        await connection.execute(`
          INSERT INTO categories (name, description, status, is_active, created_at, updated_at)
          VALUES (?, ?, 'active', true, NOW(), NOW())
          ON DUPLICATE KEY UPDATE updated_at = NOW()
        `, [category.name, category.description]);
        console.log(`✅ Created/Updated category: ${category.name}`);
      } catch (error) {
        console.log(`ℹ️ Category ${category.name} already exists or error: ${error.message}`);
      }
    }

    // Get category mappings
    const [categories] = await connection.execute(`
      SELECT id, name FROM categories WHERE status = 'active' AND is_active = true
    `);

    console.log('📊 Available categories:');
    categories.forEach(cat => {
      console.log(`  - ${cat.id}: ${cat.name}`);
    });

    // Add departmentId column if it doesn't exist
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN department_id INTEGER NULL
      `);
      console.log('✅ Added department_id column to users table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ department_id column already exists');
      } else {
        console.error('❌ Error adding department_id column:', error.message);
      }
    }

    // Map old department enum values to category IDs
    const departmentMapping = {
      'cardiology': 'Cardiology',
      'neurology': 'Neurology', 
      'orthopedics': 'Orthopedics',
      'dermatology': 'Dermatology',
      'pediatrics': 'Pediatrics',
      'general_medicine': 'General Medicine',
      'surgery': 'Surgery',
      'psychiatry': 'Psychiatry',
      'oncology': 'Oncology',
      'gynecology': 'Gynecology'
    };

    // Update users with department enum to use category foreign key
    console.log('🔄 Updating users with department mapping...');
    
    for (const [oldDepartment, categoryName] of Object.entries(departmentMapping)) {
      const category = categories.find(cat => cat.name === categoryName);
      if (category) {
        try {
          const [result] = await connection.execute(`
            UPDATE users 
            SET department_id = ? 
            WHERE department = ? AND role = 'doctor'
          `, [category.id, oldDepartment]);
          
          if (result.affectedRows > 0) {
            console.log(`✅ Updated ${result.affectedRows} doctors from ${oldDepartment} to ${categoryName}`);
          }
        } catch (error) {
          console.log(`ℹ️ No doctors found with department ${oldDepartment} or error: ${error.message}`);
        }
      }
    }

    // Remove the old department enum column
    try {
      await connection.execute(`
        ALTER TABLE users DROP COLUMN department
      `);
      console.log('✅ Removed old department enum column');
    } catch (error) {
      console.log(`ℹ️ Old department column doesn't exist or error: ${error.message}`);
    }

    console.log('🎉 Department migration completed!');
  } catch (error) {
    console.error('❌ Department migration failed:', error);
  } finally {
    await connection.end();
  }
}

// Run the migration
migrateDepartmentToCategory().catch(console.error); 