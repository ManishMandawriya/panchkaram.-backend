const fs = require('fs');
const path = require('path');

// Files to update
const filesToUpdate = [
  'src/services/reviewService.ts',
  'src/services/appointmentService.ts',
  'src/services/doctorService.ts'
];

filesToUpdate.forEach(filePath => {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace department with departmentId in attributes arrays
    content = content.replace(
      /attributes:\s*\[\s*['"`]id['"`],\s*['"`]fullName['"`],\s*['"`]doctorId['"`],\s*['"`]department['"`],\s*['"`]specialization['"`]\s*\]/g,
      "attributes: ['id', 'fullName', 'doctorId', 'departmentId', 'specialization']"
    );
    
    // Replace department with departmentId in where clauses
    content = content.replace(
      /whereClause\.department\s*=\s*categoryId/g,
      'whereClause.departmentId = categoryId'
    );
    
    // Replace department with departmentId in search conditions
    content = content.replace(
      /\{\s*department:\s*\{\s*\[Op\.like\]:\s*`%\${\s*search\s*}%`\s*\}\s*\}/g,
      '{ departmentId: { [Op.like]: `%${search}%` } }'
    );
    
    // Replace department with departmentId in category filters
    content = content.replace(
      /whereClause\.department\s*=\s*\{\s*\[Op\.in\]:\s*categoryIds\s*\}/g,
      'whereClause.departmentId = { [Op.in]: categoryIds }'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('🎉 Department references updated successfully!'); 