const FOLDER_CATEGORY_MAP = {
  'sai-photo/album/house-work': 'filter-app',
  'sai-photo/album/customized-work': 'filter-product',
  'sai-photo/album/construction-work': 'filter-branding',
  'sai-photo/album/hotel-apartments': 'filter-books',
  'sai-photo/album/mansion-builders': 'filter-mansion'
};

async function fetchCloudinaryResources(cloudName, apiKey, apiSecret, prefix) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?prefix=${encodeURIComponent(prefix)}&max_results=500&type=upload`;
  
  const auth = btoa(`${apiKey}:${apiSecret}`);
  const response = await fetch(url, {
    headers: {
      'Authorization': `Basic ${auth}`
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}

export async function onRequest(context) {
  try {
    const { searchParams } = new URL(context.request.url);
    const limit = parseInt(searchParams.get('limit')) || 20;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const categoryFilter = searchParams.get('category');

    const cloudName = context.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = context.env.CLOUDINARY_API_KEY;
    const apiSecret = context.env.CLOUDINARY_API_SECRET;

    const folders = Object.keys(FOLDER_CATEGORY_MAP);
    let allImages = [];
    const categoryFolderMap = {};

    const folderPromises = folders.map(async (folder) => {
      try {
        const result = await fetchCloudinaryResources(cloudName, apiKey, apiSecret, folder);
        return { folder, resources: result.resources };
      } catch (error) {
        console.error(`Error fetching folder ${folder}:`, error.message);
        return { folder, resources: [] };
      }
    });

    const results = await Promise.all(folderPromises);

    results.forEach(({ folder, resources }) => {
      const category = FOLDER_CATEGORY_MAP[folder];
      const folderName = folder.split('/').pop();
      
      if (categoryFilter && category !== categoryFilter) {
        return;
      }

      const folderImages = resources.map(resource => ({
        src: resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto/'),
        public_id: resource.public_id,
        width: resource.width,
        height: resource.height,
        format: resource.format
      }));

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

    const paginatedImages = allImages.slice(offset, offset + limit);
    const hasMore = (offset + limit) < allImages.length;

    return new Response(JSON.stringify({
      images: paginatedImages,
      total: allImages.length,
      offset: offset,
      limit: limit,
      hasMore: hasMore,
      folders: folders.length,
      categoryFolderMap: categoryFolderMap
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return new Response(JSON.stringify({
      error: 'Failed to fetch gallery',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
