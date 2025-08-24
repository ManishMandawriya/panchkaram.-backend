const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkUserFields() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'panchakarma',
    });

    console.log('🔍 Checking User table structure...\n');
    
    const [rows] = await connection.execute('DESCRIBE users');
    
    console.log('📋 User Table Fields:');
    console.log('========================');
    rows.forEach(row => {
      const nullable = row.Null === 'YES' ? '(nullable)' : '(required)';
      const defaultValue = row.Default ? ` [default: ${row.Default}]` : '';
      console.log(`${row.Field.padEnd(25)} ${row.Type.padEnd(20)} ${nullable}${defaultValue}`);
    });

    // Check specifically for location-related fields
    const locationFields = rows.filter(row => 
      ['address', 'city', 'state', 'pincode', 'location'].includes(row.Field.toLowerCase())
    );
    
    console.log('\n🗺️  Location-related fields:');
    console.log('=============================');
    if (locationFields.length > 0) {
      locationFields.forEach(field => {
        console.log(`✅ ${field.Field} (${field.Type})`);
      });
    } else {
      console.log('❌ No specific location fields found');
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkUserFields();