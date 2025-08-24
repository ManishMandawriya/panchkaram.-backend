const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting Panchakarma API with fixes...');

// First run the database fix
console.log('🔧 Running database schema fix...');
exec('node scripts/fix-database-schema.js', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Database fix failed:', error);
    return;
  }
  console.log('✅ Database schema fixed');
  
  // Then start the application
  console.log('🚀 Starting the application...');
  exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Application start failed:', error);
      return;
    }
    console.log('✅ Application started successfully');
  });
}); 