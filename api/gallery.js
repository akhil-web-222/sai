// API Server for Cloudinary Gallery
import express from 'express';
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

const app = express();
app.use(cors());
app.use(express.json());

// Mapping of Cloudinary folders to filter categories
const FOLDER_CATEGORY_MAP = {
  'House work': 'filter-app',
  'Customized work': 'filter-product',
  'Construction work': 'filter-branding',
  'Resort-Hotel': 'filter-books',
  // Add other folders dynamically
};

async function fetchCloudinaryFolder(folder) {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folder,
      max_results: 500,
      resource_type: 'image'
    });

    return result.resources.map(resource => ({
      src: resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto/'),
      public_id: resource.public_id,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      folder: folder
    }));
  } catch (error) {
    console.error(`Error fetching folder ${folder}:`, error);
    return [];
  }
}

// Gallery endpoint
app.get('/api/gallery', async (req, res) => {
  try {
    const folders = Object.keys(FOLDER_CATEGORY_MAP);
    
    // Fetch all folders in parallel
    const results = await Promise.all(
      folders.map(folder => fetchCloudinaryFolder(folder))
    );

    // Combine and map to categories
    const images = [];
    folders.forEach((folder, index) => {
      const category = FOLDER_CATEGORY_MAP[folder];
      const folderImages = results[index];
      
      folderImages.forEach((img, idx) => {
        images.push({
          src: img.src,
          category: category,
          title: `${folder} ${idx + 1}`,
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

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});

export default app;
