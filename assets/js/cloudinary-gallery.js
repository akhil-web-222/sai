// Client-side Cloudinary Gallery Fetcher
// Fetches images from your local API endpoint

/**
 * Fetch all gallery images from the API
 * @returns {Promise<Array>} Array of formatted image objects
 */
export async function fetchGalleryImages() {
  try {
    const response = await fetch('/api/gallery');
    
    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.images || [];
  } catch (error) {
    console.error('Error fetching gallery:', error);
    return [];
  }
}

/**
 * Initialize gallery with dynamic images
 * Replaces hardcoded images array
 */
export async function initDynamicGallery() {
  try {
    const images = await fetchGalleryImages();
    console.log(`Loaded ${images.length} images from Cloudinary`);
    return images;
  } catch (error) {
    console.error('Failed to initialize gallery:', error);
    return [];
  }
}

// Export for use in HTML pages (for non-module scripts)
if (typeof window !== 'undefined') {
  window.fetchGalleryImages = fetchGalleryImages;
  window.initDynamicGallery = initDynamicGallery;
}

