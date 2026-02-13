async function fetchCloudinaryResources(cloudName, apiKey, apiSecret, prefix, maxResults = 10) {
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?prefix=${encodeURIComponent(prefix)}&max_results=${maxResults}&type=upload`;

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

function toOptimizedUrl(url) {
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

export async function onRequest(context) {
  try {
    const cloudName = context.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = context.env.CLOUDINARY_API_KEY;
    const apiSecret = context.env.CLOUDINARY_API_SECRET;

    const testimonialsUrl = new URL('/api/testimonials', context.request.url).toString();

    const [heroResult, reachResult, statsResult, clientPhotosResult, testimonialsResponse] = await Promise.all([
      fetchCloudinaryResources(cloudName, apiKey, apiSecret, 'sai-photo/hero', 10),
      fetchCloudinaryResources(cloudName, apiKey, apiSecret, 'sai-photo/contact', 1),
      fetchCloudinaryResources(cloudName, apiKey, apiSecret, 'sai-photo/clients', 1),
      fetchCloudinaryResources(cloudName, apiKey, apiSecret, 'sai-photo/testimonials/clients', 20),
      fetch(testimonialsUrl)
    ]);

    const testimonialsJson = testimonialsResponse.ok
      ? await testimonialsResponse.json()
      : { testimonials: [] };

    const heroImages = (heroResult.resources || []).map((resource) => ({
      src: toOptimizedUrl(resource.secure_url),
      public_id: resource.public_id
    }));

    const reachOutImage = (reachResult.resources || [])[0]
      ? { src: toOptimizedUrl(reachResult.resources[0].secure_url) }
      : null;

    const statsImage = (statsResult.resources || [])[0]
      ? { src: toOptimizedUrl(statsResult.resources[0].secure_url) }
      : null;

    const clientPhotos = (clientPhotosResult.resources || []).map((resource) => ({
      src: toOptimizedUrl(resource.secure_url),
      public_id: resource.public_id
    }));

    const testimonials = Array.isArray(testimonialsJson.testimonials)
      ? testimonialsJson.testimonials
      : [];

    return new Response(JSON.stringify({
      heroImages,
      reachOutImage,
      statsImage,
      clientPhotos,
      testimonials,
      fetchedAt: Date.now()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=120, s-maxage=300, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error fetching bootstrap assets:', error.message);

    return new Response(JSON.stringify({
      heroImages: [],
      reachOutImage: null,
      statsImage: null,
      clientPhotos: [],
      testimonials: [],
      fetchedAt: Date.now(),
      error: error.message
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=60'
      }
    });
  }
}
