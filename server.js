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
      const limit = parseInt(req.query.limit) || 20; // Default 20 images per load
      const offset = parseInt(req.query.offset) || 0;
      const category = req.query.category; // Optional category filter
      
      const folders = category 
        ? Object.keys(FOLDER_CATEGORY_MAP).filter(f => FOLDER_CATEGORY_MAP[f] === category)
        : Object.keys(FOLDER_CATEGORY_MAP);
      
      // Fetch all folders in parallel
      const results = await Promise.all(
        folders.map(folder => fetchCloudinaryFolder(folder))
      );

      // Combine and map to categories
      const allImages = [];
      const categoryFolderMap = {}; // Map category to folder name
      
      folders.forEach((folder, index) => {
        const category = FOLDER_CATEGORY_MAP[folder];
        const folderImages = results[index];
        const folderName = folder.split('/').pop(); // Get last part: "house-work"
        
        // Store folder name for this category
        if (!categoryFolderMap[category]) {
          categoryFolderMap[category] = folderName;
        }
        
        folderImages.forEach((img, idx) => {
          allImages.push({
            src: img.src,
            category: category,
            title: `${folderName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} ${idx + 1}`,
            public_id: img.public_id,
            width: img.width,
            height: img.height,
            format: img.format,
            folderName: folderName
          });
        });
      });

      // Apply pagination
      const paginatedImages = allImages.slice(offset, offset + limit);
      const hasMore = (offset + limit) < allImages.length;

      return res.status(200).json({
        images: paginatedImages,
        total: allImages.length,
        offset: offset,
        limit: limit,
        hasMore: hasMore,
        folders: folders.length,
        categoryFolderMap: categoryFolderMap
      });
    } catch (error) {
      console.error('Error fetching gallery:', error);
      return res.status(500).json({
        error: 'Failed to fetch gallery',
        message: error.message
      });
    }
  });

  // Hero images endpoint
  app.get('/api/hero', async (req, res) => {
    try {
      const heroFolder = 'sai-photo/hero';
      console.log(`Fetching hero images from: ${heroFolder}`);
      
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: heroFolder,
        max_results: 10,
        resource_type: 'image'
      });

      console.log(`Found ${result.resources.length} hero images`);

      const images = result.resources.map(resource => ({
        src: resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto/'),
        public_id: resource.public_id,
        width: resource.width,
        height: resource.height
      }));

      return res.status(200).json({
        images: images,
        total: images.length
      });
    } catch (error) {
      console.error('Error fetching hero images:', error.message);
      // Return empty array instead of error to prevent frontend issues
      return res.status(200).json({
        images: [],
        total: 0,
        error: error.message
      });
    }
  });

  // Create Vite server in middleware mode

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
