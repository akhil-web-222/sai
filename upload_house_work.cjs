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

async function renameAndUpload() {
  console.log('Starting rename and upload for "house work - 1"...');
  
  const localFolder = path.join(__dirname, 'photo');
  const categoryFolder = 'sai-photo/album/house work - 1';
  
  if (!fs.existsSync(localFolder)) {
    console.error('Local folder not found:', localFolder);
    return;
  }
  
  const items = fs.readdirSync(localFolder, { withFileTypes: true });
  
  // Filter for image files
  const imageFiles = items
    .filter(item => item.isFile() && /\.(jpg|jpeg|png|gif|webp)$/i.test(item.name))
    .sort((a, b) => {
        // Attempt to sort by birthtime or just alphabetically by name
        return a.name.localeCompare(b.name);
    });
    
  let count = 1;
  let uploadCount = 0;
  
  for (const item of imageFiles) {
    const oldPath = path.join(localFolder, item.name);
    const newFileName = `house work - ${count}.jpeg`;
    const newPath = path.join(localFolder, newFileName);
    
    // Rename locally
    try {
        if (oldPath !== newPath) {
            fs.renameSync(oldPath, newPath);
        }
        console.log(`Renamed: ${item.name} -> ${newFileName}`);
        
        // Upload to Cloudinary
        const publicId = `house work - ${count}`;
        console.log(`📤 Uploading ${newFileName} to folder: ${categoryFolder}`);
        
        const result = await cloudinary.uploader.upload(newPath, {
            folder: categoryFolder,
            public_id: publicId,
            overwrite: true,
            resource_type: 'image',
            tags: ['sai-wood-treats', 'house work - 1']
        });
        
        console.log(`✅ Uploaded: ${result.public_id} (Folder: ${result.folder})`);
        uploadCount++;
        count++;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
    } catch (err) {
        console.error(`❌ Failed to process ${item.name}:`, err.message);
    }
  }
  
  console.log(`\n🎉 Process complete! Renamed and uploaded ${uploadCount} images to ${categoryFolder}.`);
}

renameAndUpload();
