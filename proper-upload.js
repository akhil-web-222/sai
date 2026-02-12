/**
 * Proper folder-based upload that ensures dashboard folder visibility
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

async function properFolderUpload() {
  console.log('🔧 PROPER FOLDER UPLOAD - Fixing Dashboard Visibility\n');
  
  const localFolder = './downloaded_sai_photo';
  
  if (!fs.existsSync(localFolder)) {
    console.error('❌ Local folder not found:', localFolder);
    return;
  }
  
  // Step 1: Clear all existing resources
  console.log('1️⃣ Clearing existing resources...');
  try {
    const allResources = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'sai-photo',
      max_results: 500
    });
    
    const publicIds = allResources.resources.map(r => r.public_id);
    if (publicIds.length > 0) {
      await cloudinary.api.delete_resources(publicIds);
      console.log(`✅ Deleted ${publicIds.length} existing resources`);
    }
  } catch (e) {
    console.log('ℹ️ No existing resources to clear');
  }
  
  // Step 2: Upload with proper folder structure
  console.log('\n2️⃣ Re-uploading with proper folder structure...\n');
  
  let uploadCount = 0;
  
  async function uploadWithProperFolder(localDir, folderPrefix = '') {
    const items = fs.readdirSync(localDir, { withFileTypes: true });
    
    for (const item of items) {
      const localPath = path.join(localDir, item.name);
      
      if (item.isDirectory()) {
        const newFolderPrefix = folderPrefix ? `${folderPrefix}/${item.name}` : item.name;
        await uploadWithProperFolder(localPath, newFolderPrefix);
      } else if (item.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name)) {
        try {
          const fileName = path.basename(item.name, path.extname(item.name));
          const cloudinaryFolder = `sai-photo/${folderPrefix}`;
          
          console.log(`📤 Uploading ${item.name} to folder: ${cloudinaryFolder}`);
          
          // Use folder parameter (not public_id path) for proper dashboard visibility
          const result = await cloudinary.uploader.upload(localPath, {
            folder: cloudinaryFolder,
            public_id: fileName,
            overwrite: true,
            resource_type: 'image',
            tags: ['sai-wood-treats', 'proper-folder']
          });
          
          console.log(`✅ Uploaded: ${result.public_id}`);
          console.log(`📂 Folder: ${result.folder || 'NONE'}`);
          
          uploadCount++;
          
          // Verify folder association
          const verify = await cloudinary.api.resource(result.public_id);
          if (verify.folder) {
            console.log(`✅ Folder verified: ${verify.folder}`);
          } else {
            console.log(`❌ No folder association for: ${result.public_id}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`❌ Upload failed for ${localPath}:`, error.message);
        }
      }
    }
  }
  
  await uploadWithProperFolder(localFolder);
  
  console.log(`\n🎉 Upload complete! Processed ${uploadCount} images`);
  
  // Step 3: Verify folder structure in dashboard
  console.log('\n3️⃣ Verifying dashboard folder structure...');
  try {
    const rootFolders = await cloudinary.api.root_folders();
    console.log('Root folders:', rootFolders.folders.map(f => f.name));
    
    if (rootFolders.folders.some(f => f.name === 'sai-photo')) {
      const saiSubfolders = await cloudinary.api.sub_folders('sai-photo');
      console.log('Sai-photo subfolders:', saiSubfolders.folders.map(f => f.name));
    }
  } catch (e) {
    console.error('Error verifying folders:', e.message);
  }
}

properFolderUpload();