// Client-side Cloudinary Gallery Fetcher with Lazy Loading & CLS Prevention

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
 * Create optimized image element with lazy loading and CLS prevention
 * @param {Object} image - Image data object
 * @returns {HTMLElement} Image element
 */
function createOptimizedImage(image) {
  const imgContainer = document.createElement('div');
  imgContainer.className = 'gallery-image-container';
  imgContainer.style.aspectRatio = '16/9'; // Prevent CLS
  imgContainer.style.position = 'relative';
  imgContainer.style.overflow = 'hidden';
  
  const img = document.createElement('img');
  img.src = image.url;
  img.alt = image.alt || `Sai Wood Treats - ${image.title || 'Wood Interior Project'}`;
  img.loading = 'lazy'; // Native lazy loading
  img.decoding = 'async'; // Async image decode
  img.width = image.width || 1200;
  img.height = image.height || 675;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  
  // Fallback for older browsers using Intersection Observer
  if ('IntersectionObserver' in window) {
    img.dataset.src = img.src;
    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675"%3E%3Crect fill="%23f0f0f0" width="1200" height="675"/%3E%3C/svg%3E';
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const lazyImg = entry.target;
          lazyImg.src = lazyImg.dataset.src;
          lazyImg.classList.add('loaded');
          observer.unobserve(lazyImg);
        }
      });
    }, { 
      rootMargin: '50px',
      threshold: 0.01
    });
    
    observer.observe(img);
  }
  
  imgContainer.appendChild(img);
  return imgContainer;
}

/**
 * Initialize gallery with dynamic images
 */
export async function initDynamicGallery() {
  try {
    const images = await fetchGalleryImages();
    console.log(`Loaded ${images.length} images from Cloudinary`);
    
    // Render optimized images
    const galleryContainer = document.getElementById('gallery-container');
    if (galleryContainer) {
      images.forEach(image => {
        const imgElement = createOptimizedImage(image);
        galleryContainer.appendChild(imgElement);
      });
    }
    
    return images;
  } catch (error) {
    console.error('Failed to initialize gallery:', error);
    return [];
  }
}

// Export for use in HTML pages
if (typeof window !== 'undefined') {
  window.fetchGalleryImages = fetchGalleryImages;
  window.initDynamicGallery = initDynamicGallery;
}

