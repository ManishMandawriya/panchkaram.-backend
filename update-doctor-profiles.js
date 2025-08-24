const { User } = require('./src/models/User');
const { sequelize } = require('./src/config/database');

const mockProfileImages = [
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop'
];

async function updateDoctorProfiles() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    // Get all doctors
    const doctors = await User.findAll({
      where: {
        role: 'doctor',
        isActive: true,
        isApproved: true
      }
    });

    console.log(`Found ${doctors.length} doctors to update.`);

    // Update each doctor with a random profile image
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      const randomImage = mockProfileImages[i % mockProfileImages.length];
      
      await doctor.update({
        profileImage: randomImage
      });
      
      console.log(`Updated doctor ${doctor.fullName} with profile image.`);
    }

    console.log('All doctors updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating doctor profiles:', error);
    process.exit(1);
  }
}

updateDoctorProfiles(); 