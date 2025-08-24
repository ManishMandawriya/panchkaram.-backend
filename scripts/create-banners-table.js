const mysql = require('mysql2/promise');
require('dotenv').config();

async function createBannersTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'panchakarma',
  });

  try {
    console.log('Creating banners table...');

    // Create the table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS banners (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        image VARCHAR(500) NOT NULL COMMENT 'URL or path to banner image',
        description TEXT NULL,
        link_url VARCHAR(255) NULL COMMENT 'Link URL when banner is clicked',
        sort_order INT NOT NULL DEFAULT 0 COMMENT 'Display order (lower numbers show first)',
        is_active BOOLEAN DEFAULT TRUE,
        start_date DATETIME NULL COMMENT 'Banner start date (optional)',
        end_date DATETIME NULL COMMENT 'Banner end date (optional)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_banners_active (is_active),
        INDEX idx_banners_slug (slug),
        INDEX idx_banners_sort_order (sort_order),
        INDEX idx_banners_dates (start_date, end_date)
      )
    `);

    console.log('✅ banners table created successfully');

    // Insert sample banner data
    console.log('Inserting sample banner data...');
    
    const sampleBanners = [
      {
        title: 'Welcome to Panchakarma',
        slug: 'welcome-banner',
        image: 'https://via.placeholder.com/1200x400/4F46E5/FFFFFF?text=Welcome+to+Panchakarma',
        description: 'Experience authentic Ayurvedic treatments and holistic healing',
        linkUrl: '/services',
        sortOrder: 1,
        isActive: true,
      },
      {
        title: 'Book Your Consultation',
        slug: 'consultation-banner',
        image: 'https://via.placeholder.com/1200x400/059669/FFFFFF?text=Book+Consultation',
        description: 'Connect with our expert Ayurvedic doctors',
        linkUrl: '/doctors',
        sortOrder: 2,
        isActive: true,
      },
      {
        title: 'Special Offers',
        slug: 'special-offers',
        image: 'https://via.placeholder.com/1200x400/DC2626/FFFFFF?text=Special+Offers',
        description: '20% off on first consultation this month',
        linkUrl: '/offers',
        sortOrder: 3,
        isActive: false, // Disabled by default
      }
    ];

    for (const banner of sampleBanners) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO banners (title, slug, image, description, link_url, sort_order, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          banner.title,
          banner.slug,
          banner.image,
          banner.description,
          banner.linkUrl,
          banner.sortOrder,
          banner.isActive
        ]);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          console.error(`Error inserting banner ${banner.title}:`, error.message);
        }
      }
    }

    console.log('✅ Sample banner data inserted successfully');

    // Show inserted banners
    const [banners] = await connection.execute(`
      SELECT id, title, slug, is_active, sort_order 
      FROM banners 
      ORDER BY sort_order ASC, created_at DESC 
      LIMIT 5
    `);

    console.log('Sample banners:');
    banners.forEach(banner => {
      console.log(`- ID: ${banner.id}, Title: "${banner.title}", Slug: "${banner.slug}", Active: ${banner.is_active}, Order: ${banner.sort_order}`);
    });

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

createBannersTable()
  .then(() => {
    console.log('Banners table creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Banners table creation failed:', error);
    process.exit(1);
  });