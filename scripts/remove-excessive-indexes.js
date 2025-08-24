const mysql = require('mysql2/promise');
require('dotenv').config();

async function removeExcessiveIndexes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma'
  });

  try {
    console.log('🔧 Removing excessive indexes from users table...');

    // Get all indexes
    const [indexes] = await connection.execute(`
      SHOW INDEX FROM users
    `);
    
    console.log(`📊 Found ${indexes.length} indexes in users table`);
    
    // Group indexes by name
    const indexGroups = {};
    indexes.forEach(index => {
      if (!indexGroups[index.Key_name]) {
        indexGroups[index.Key_name] = [];
      }
      indexGroups[index.Key_name].push(index);
    });
    
    console.log('📋 Index groups found:');
    Object.keys(indexGroups).forEach(key => {
      console.log(`  - ${key} (${indexGroups[key].length} columns)`);
    });
    
    // Remove non-primary indexes (keep PRIMARY key)
    const indexesToRemove = Object.keys(indexGroups).filter(name => name !== 'PRIMARY');
    
    console.log(`🗑️ Removing ${indexesToRemove.length} indexes...`);
    
    for (const indexName of indexesToRemove) {
      try {
        await connection.execute(`ALTER TABLE users DROP INDEX \`${indexName}\``);
        console.log(`✅ Removed index: ${indexName}`);
      } catch (error) {
        console.log(`❌ Failed to remove index ${indexName}: ${error.message}`);
      }
    }
    
    // Verify the result
    const [remainingIndexes] = await connection.execute(`
      SHOW INDEX FROM users
    `);
    
    console.log(`✅ Remaining indexes: ${remainingIndexes.length}`);
    remainingIndexes.forEach(index => {
      console.log(`  - ${index.Key_name}`);
    });
    
    console.log('🎉 Index removal completed!');
  } catch (error) {
    console.error('❌ Index removal failed:', error);
  } finally {
    await connection.end();
  }
}

// Run the fix
removeExcessiveIndexes().catch(console.error); 