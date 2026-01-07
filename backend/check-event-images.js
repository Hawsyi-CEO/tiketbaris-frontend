require('dotenv').config();
const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

async function checkEventImages() {
  try {
    const conn = await pool.getConnection();
    
    // Get all events
    const [events] = await conn.execute(
      'SELECT id, title, image_url FROM events ORDER BY id'
    );
    
    console.log('📋 Total Events:', events.length);
    console.log('-------------------------------------------\n');
    
    let withImages = 0;
    let withoutImages = 0;
    let missingFiles = 0;
    
    for (const event of events) {
      if (event.image_url) {
        withImages++;
        
        // Check if file exists
        const filePath = path.join(__dirname, 'uploads', path.basename(event.image_url));
        if (!fs.existsSync(filePath)) {
          missingFiles++;
          console.log(`❌ Event #${event.id}: "${event.title}"`);
          console.log(`   Image URL: ${event.image_url}`);
          console.log(`   File path: ${filePath}`);
          console.log(`   Status: FILE NOT FOUND\n`);
        }
      } else {
        withoutImages++;
        console.log(`⚠️  Event #${event.id}: "${event.title}"`);
        console.log(`   Image URL: NULL`);
        console.log(`   Status: NO IMAGE\n`);
      }
    }
    
    console.log('-------------------------------------------');
    console.log('📊 Summary:');
    console.log(`   ✅ With Image URL: ${withImages}`);
    console.log(`   ⚠️  Without Image URL: ${withoutImages}`);
    console.log(`   ❌ Missing Files: ${missingFiles}`);
    
    // List files in uploads folder
    console.log('\n📁 Files in uploads folder:');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir).filter(f => {
        const stat = fs.statSync(path.join(uploadsDir, f));
        return stat.isFile() && (f.match(/\.(jpg|jpeg|png|gif|webp)$/i));
      });
      
      files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
      
      if (files.length === 0) {
        console.log('   (No image files found)');
      }
    } else {
      console.log('   (uploads folder not found!)');
    }
    
    await conn.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEventImages();
