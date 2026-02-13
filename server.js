// Combined Vite Dev Server + API Server
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Mapping of Cloudinary folders to filter categories
const FOLDER_CATEGORY_MAP = {
  'sai-photo/album/house-work': 'filter-app',
  'sai-photo/album/customized-work': 'filter-product',
  'sai-photo/album/construction-work': 'filter-branding',
  'sai-photo/album/hotel-apartments': 'filter-books',
  'sai-photo/album/mansion-builders': 'filter-mansion',
};

async function fetchCloudinaryFolder(folder) {
  try {
    console.log(`Fetching folder: ${folder}`);
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 500,
      resource_type: 'image'
    });

    console.log(`Found ${result.resources.length} images in ${folder}`);
    
    return result.resources.map(resource => ({
      src: resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto/'),
      public_id: resource.public_id,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      folder: folder
    }));
  } catch (error) {
    console.error(`Error fetching folder ${folder}:`, error.message);
    return [];
  }
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API endpoint for gallery
  app.get('/api/gallery', async (req, res) => {
    try {
      const folders = Object.keys(FOLDER_CATEGORY_MAP);
      
      // Fetch all folders in parallel
      const results = await Promise.all(
        folders.map(folder => fetchCloudinaryFolder(folder))
      );

      // Combine and map to categories
      const images = [];
      const folderDisplayNames = {
        'sai-photo/album/house-work': 'House Work',
        'sai-photo/album/customized-work': 'Customized Work',
        'sai-photo/album/construction-work': 'Construction',
        'sai-photo/album/hotel-apartments': 'Hotel and Apartments',
        'sai-photo/album/mansion-builders': 'Mansion Builders',
      };
      
      folders.forEach((folder, index) => {
        const category = FOLDER_CATEGORY_MAP[folder];
        const folderImages = results[index];
        const displayName = folderDisplayNames[folder] || folder;
        
        folderImages.forEach((img, idx) => {
          images.push({
            src: img.src,
            category: category,
            title: `${displayName} ${idx + 1}`,
            public_id: img.public_id,
            width: img.width,
            height: img.height,
            format: img.format
          });
        });
      });

      return res.status(200).json({
        images,
        total: images.length,
        folders: folders.length
      });
    } catch (error) {
      console.error('Error fetching gallery:', error);
      return res.status(500).json({
        error: 'Failed to fetch gallery',
        message: error.message
      });
    }
  });

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'mpa'
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`\n  Server running at http://localhost:${PORT}\n`);
  });
}

startServer().catch(err => {
  console.error('Error starting server:', err);
  process.exit(1);
});
