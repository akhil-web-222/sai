// Combined Vite Dev Server + API Server
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function toSizedUrl(url, width, quality = 'q_auto:eco') {
  return url.replace('/upload/', `/upload/f_auto,${quality},c_limit,w_${width}/`);
}

function toSrcSet(url, widths, quality = 'q_auto:eco') {
  return widths.map((width) => `${toSizedUrl(url, width, quality)} ${width}w`).join(', ');
}

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

  // Bootstrap endpoint to reduce API chaining for critical homepage assets
  app.get('/api/bootstrap', async (req, res) => {
    try {
      const [heroResult, reachResult, statsResult, clientPhotosResult] = await Promise.all([
        cloudinary.api.resources({
          type: 'upload',
          prefix: 'sai-photo/hero',
          max_results: 10,
          resource_type: 'image'
        }),
        cloudinary.api.resources({
          type: 'upload',
          prefix: 'sai-photo/reach-out',
          max_results: 1,
          resource_type: 'image'
        }),
        cloudinary.api.resources({
          type: 'upload',
          prefix: 'sai-photo/Client Estimation',
          max_results: 1,
          resource_type: 'image'
        }),
        cloudinary.api.resources({
          type: 'upload',
          prefix: 'sai-photo/testimonials/clients',
          max_results: 20,
          resource_type: 'image'
        })
      ]);

      const testimonialsPath = path.join(__dirname, 'testimonials.json');
      const testimonials = JSON.parse(fs.readFileSync(testimonialsPath, 'utf8'));

      const heroImages = (heroResult.resources || []).map(resource => ({
        src: toSizedUrl(resource.secure_url, 1200, 'q_auto:eco'),
        srcset: toSrcSet(resource.secure_url, [480, 800, 1200], 'q_auto:eco'),
        sizes: '100vw',
        public_id: resource.public_id
      }));

      const reachOutImage = (reachResult.resources && reachResult.resources[0])
        ? {
            src: toSizedUrl(reachResult.resources[0].secure_url, 1280, 'q_auto:eco'),
            srcset: toSrcSet(reachResult.resources[0].secure_url, [640, 1280], 'q_auto:eco'),
            sizes: '100vw'
          }
        : null;

      const statsImage = (statsResult.resources && statsResult.resources[0])
        ? {
            src: toSizedUrl(statsResult.resources[0].secure_url, 800, 'q_auto:eco'),
            srcset: toSrcSet(statsResult.resources[0].secure_url, [480, 800], 'q_auto:eco'),
            sizes: '(max-width: 992px) 92vw, 40vw'
          }
        : null;

      const clientPhotos = (clientPhotosResult.resources || []).map(resource => ({
        src: toSizedUrl(resource.secure_url, 160, 'q_auto:eco'),
        public_id: resource.public_id
      }));

      return res.status(200).json({
        heroImages,
        reachOutImage,
        statsImage,
        clientPhotos,
        testimonials,
        fetchedAt: Date.now()
      });
    } catch (error) {
      console.error('Error fetching bootstrap assets:', error.message);
      return res.status(200).json({
        heroImages: [],
        reachOutImage: null,
        statsImage: null,
        clientPhotos: [],
        testimonials: [],
        fetchedAt: Date.now(),
        error: error.message
      });
    }
  });

  // Reach out background image endpoint
  app.get('/api/reach-out-bg', async (req, res) => {
    try {
      const reachOutFolder = 'sai-photo/reach-out';
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: reachOutFolder,
        max_results: 1,
        resource_type: 'image'
      });

      const image = result.resources.length > 0 ? {
        src: result.resources[0].secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
      } : null;

      return res.status(200).json({ image });
    } catch (error) {
      console.error('Error fetching reach-out image:', error.message);
      return res.status(200).json({ image: null, error: error.message });
    }
  });

  // Testimonial client photos endpoint
  app.get('/api/client-photos', async (req, res) => {
    try {
      const clientFolder = 'sai-photo/testimonials/clients';
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: clientFolder,
        max_results: 20,
        resource_type: 'image'
      });

      const images = result.resources.map(resource => ({
        src: resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto/'),
        public_id: resource.public_id
      }));

      return res.status(200).json({
        images: images,
        total: images.length
      });
    } catch (error) {
      console.error('Error fetching client photos:', error.message);
      return res.status(200).json({
        images: [],
        total: 0,
        error: error.message
      });
    }
  });

  // Stats section client image endpoint
  app.get('/api/stats-clients', async (req, res) => {
    try {
      const statsFolder = 'sai-photo/Client Estimation';
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: statsFolder,
        max_results: 1,
        resource_type: 'image'
      });

      const image = result.resources.length > 0 ? {
        src: result.resources[0].secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
      } : null;

      return res.status(200).json({ image });
    } catch (error) {
      console.error('Error fetching stats client image:', error.message);
      return res.status(200).json({ image: null, error: error.message });
    }
  });

  // Testimonials endpoint
  app.get('/api/testimonials', (req, res) => {
    try {
      const testimonialsPath = path.join(__dirname, 'testimonials.json');
      const testimonials = JSON.parse(fs.readFileSync(testimonialsPath, 'utf8'));
      return res.status(200).json({
        testimonials: testimonials,
        total: testimonials.length
      });
    } catch (error) {
      console.error('Error reading testimonials:', error.message);
      return res.status(200).json({
        testimonials: [],
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
