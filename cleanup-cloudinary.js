/**
 * Delete all images from Cloudinary that have no proper folder metadata
 */

require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function deleteAllSaiPhotoImages() {
  try {
    console.log('🗑️  Deleting all sai-photo images from Cloudinary...\n');
    
    // Get all resources
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'sai-photo/',
      max_results: 500
    });
    
    console.log(`📊 Found ${result.resources.length} images to delete\n`);
    
    if (result.resources.length === 0) {
      console.log('✅ No images found. Cloudinary is already clean.');
      return;
    }
    
    // Delete all resources in batches (Cloudinary limit is 100 per request)
    const publicIds = result.resources.map(r => r.public_id);
    
    console.log('🔥 Deleting images in batches...');
    
    let totalDeleted = 0;
    const batchSize = 100;
    
    for (let i = 0; i < publicIds.length; i += batchSize) {
      const batch = publicIds.slice(i, i + batchSize);
      
      try {
        const deleteResult = await cloudinary.api.delete_resources(batch);
        const deleted = Object.keys(deleteResult.deleted).filter(
          key => deleteResult.deleted[key] === 'deleted'
        ).length;
        
        totalDeleted += deleted;
        console.log(`   Batch ${Math.floor(i / batchSize) + 1}: Deleted ${deleted} images`);
      } catch (error) {
        console.error(`   ❌ Batch failed:`, error.message);
      }
    }
    
    console.log(`\n✅ Total deleted: ${totalDeleted} images`);
    
    // Delete folders
    console.log('\n🗑️  Cleaning up empty folders...');
    
    const foldersToDelete = [
      'sai-photo/testimonials/clients',
      'sai-photo/album/mansion-builders',
      'sai-photo/album/hotel-apartments',
      'sai-photo/album/house-work',
      'sai-photo/album/customized-work',
      'sai-photo/album/construction-work',
      'sai-photo/album',
      'sai-photo/testimonials',
      'sai-photo/hero',
      'sai-photo/founder',
      'sai-photo/contact',
      'sai-photo/clients',
      'sai-photo/about',
      'sai-photo'
    ];
    
    for (const folder of foldersToDelete) {
      try {
        await cloudinary.api.delete_folder(folder);
        console.log(`✅ Deleted folder: ${folder}`);
      } catch (error) {
        // Folder might not exist or already deleted
        if (!error.message.includes('not found')) {
          console.log(`⚠️  ${folder}: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Cloudinary cleanup complete!');
    console.log('You can now upload images with proper folder structure.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

deleteAllSaiPhotoImages();
