/**
 * Sai Wood Treats - Cloudinary Folder Creation Script
 * 
 * This script creates folder structure in Cloudinary using the Admin API
 */

require('dotenv').config();

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Define folder structure for Sai Wood Treats
const FOLDER_STRUCTURE = [
  'sai-photo',
  'sai-photo/hero',
  'sai-photo/about',
  'sai-photo/contact',
  'sai-photo/founder',
  'sai-photo/clients',
  'sai-photo/testimonials',
  'sai-photo/testimonials/clients',
  'sai-photo/album',
  'sai-photo/album/house-work',
  'sai-photo/album/customized-work',
  'sai-photo/album/construction-work',
  'sai-photo/album/hotel-apartments',
  'sai-photo/album/mansion-builders'
];

/**
 * Create folders using Cloudinary Admin API
 */
async function createFolders() {
  console.log('🚀 Starting Sai Wood Treats Cloudinary folder creation...\n');
  
  for (const folder of FOLDER_STRUCTURE) {
    try {
      console.log(`📁 Creating folder: ${folder}`);
      
      // Create folder using Admin API
      await cloudinary.api.create_folder(folder);
      
      console.log(`✅ Folder created: ${folder}`);
      
    } catch (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log(`ℹ️  Folder already exists: ${folder}`);
      } else {
        console.error(`❌ Error creating folder ${folder}:`, error.message);
      }
    }
  }
  
  console.log('\n✨ Folder creation complete!\n');
  console.log('📂 Created folders:');
  FOLDER_STRUCTURE.forEach(f => console.log(`   - ${f}`));
  console.log('\n💡 You can now see these folders in Cloudinary dashboard\n');
}

/**
 * Upload a single image to Cloudinary
 */
async function uploadImage(imagePath, folderPath, fileName = null) {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }
    
    const name = fileName || path.basename(imagePath, path.extname(imagePath));
    const publicId = `${folderPath}/${name}`;
    
    console.log(`📤 Uploading ${path.basename(imagePath)} to ${publicId}...`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      resource_type: 'image',
      overwrite: true,
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ],
      tags: ['sai-wood-treats', 'website-image']
    });
    
    console.log(`✅ Uploaded: ${name}`);
    return result;
    
  } catch (error) {
    console.error(`❌ Upload failed for ${imagePath}:`, error.message);
    throw error;
  }
}

/**
 * Upload all images from downloaded_sai_photo folder
 */
async function uploadAllImages() {
  const localFolder = './downloaded_sai_photo';
  
  if (!fs.existsSync(localFolder)) {
    console.error(`❌ Local folder not found: ${localFolder}`);
    console.log('Please ensure the downloaded_sai_photo folder exists in the current directory.');
    return;
  }
  
  console.log('\n🚀 Starting upload of all images to Cloudinary folders...\n');
  
  let uploadCount = 0;
  let failCount = 0;
  
  // Function to recursively upload files
  async function uploadDirectory(localDir, cloudinaryPrefix) {
    const items = fs.readdirSync(localDir, { withFileTypes: true });
    
    for (const item of items) {
      const localPath = path.join(localDir, item.name);
      
      if (item.isDirectory()) {
        // Recursively handle subdirectories
        const newPrefix = cloudinaryPrefix ? `${cloudinaryPrefix}/${item.name}` : item.name;
        await uploadDirectory(localPath, newPrefix);
      } else if (item.isFile() && /\.(jpg|jpeg|png|gif|webp|bmp|tiff)$/i.test(item.name)) {
        // Upload image files
        try {
          const cloudinaryFolder = cloudinaryPrefix ? `sai-photo/${cloudinaryPrefix}` : 'sai-photo';
          
          await uploadImage(localPath, cloudinaryFolder);
          uploadCount++;
          
          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.error(`❌ Failed to upload ${localPath}:`, error.message);
          failCount++;
        }
      }
    }
  }
  
  try {
    await uploadDirectory(localFolder, '');
    
    console.log('\n🎉 Upload Summary:');
    console.log(`   ✅ Successfully uploaded: ${uploadCount} images`);
    console.log(`   ❌ Failed uploads: ${failCount} images`);
    console.log(`   📊 Total processed: ${uploadCount + failCount} images`);
    
    if (uploadCount > 0) {
      console.log('\n💡 All images are now available in your Cloudinary dashboard!');
    }
    
  } catch (error) {
    console.error('❌ Error during batch upload:', error.message);
  }
}

/**
 * List all folders in Cloudinary
 */
async function listFolders() {
  try {
    console.log('\n📋 Listing all folders in Cloudinary...\n');
    
    const result = await cloudinary.api.root_folders();
    
    console.log(`Found ${result.folders.length} root folders:`);
    result.folders.forEach((folder, index) => {
      console.log(`${index + 1}. ${folder.name}`);
    });
    
    // List subfolders for sai-photo if it exists
    try {
      const saiPhotoFolders = await cloudinary.api.sub_folders('sai-photo');
      console.log(`\nSubfolders in sai-photo:`);
      saiPhotoFolders.folders.forEach((folder, index) => {
        console.log(`${index + 1}. sai-photo/${folder.name}`);
      });
    } catch (error) {
      console.log('\nNo sai-photo folder found or no subfolders');
    }
    
  } catch (error) {
    console.error(`❌ Error listing folders:`, error.message);
  }
}

// CLI Interface
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  // Check if credentials are set
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.error('❌ Error: Cloudinary credentials not found in environment variables\n');
    console.log('Please set the following environment variables in .env file:');
    console.log('  - CLOUDINARY_CLOUD_NAME');
    console.log('  - CLOUDINARY_API_KEY');
    console.log('  - CLOUDINARY_API_SECRET\n');
    process.exit(1);
  }
  
  try {
    switch (command) {
      case 'create':
        await createFolders();
        break;
        
      case 'upload':
        await uploadAllImages();
        break;
        
      case 'setup':
        // Complete setup: create folders and upload all images
        console.log('🎯 Starting complete Sai Wood Treats setup...\n');
        await createFolders();
        await uploadAllImages();
        await listFolders();
        console.log('\n🎉 Complete setup finished! Check your Cloudinary dashboard.');
        break;
        
      case 'list':
        await listFolders();
        break;
        
      default:
        console.log('📚 Sai Wood Treats - Cloudinary Management Tool\n');
        console.log('Usage: node cloudinary-setup.js <command>\n');
        console.log('Commands:');
        console.log('  create                   - Create folder structure only');
        console.log('  upload                   - Upload all images to respective folders');
        console.log('  setup                    - Complete setup: create folders + upload images');
        console.log('  list                     - List all folders\n');
        console.log('Examples:');
        console.log('  node cloudinary-setup.js create');
        console.log('  node cloudinary-setup.js upload');
        console.log('  node cloudinary-setup.js setup');
        console.log('  node cloudinary-setup.js list\n');
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  createFolders,
  uploadImage,
  uploadAllImages,
  listFolders
};

// Run if called directly
if (require.main === module) {
  main();
}