async function fetchCloudinaryResources(cloudName, apiKey, apiSecret, prefix, maxResults = 20) {
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

export async function onRequest(context) {
  try {
    const cloudName = context.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = context.env.CLOUDINARY_API_KEY;
    const apiSecret = context.env.CLOUDINARY_API_SECRET;

    const clientFolder = 'sai-photo/testimonials/clients';
    const result = await fetchCloudinaryResources(cloudName, apiKey, apiSecret, clientFolder, 20);

    const images = result.resources.map(resource => ({
      src: resource.secure_url.replace('/upload/', '/upload/f_auto,q_auto/'),
      public_id: resource.public_id
    }));

    return new Response(JSON.stringify({
      images: images,
      total: images.length
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching client photos:', error.message);
    return new Response(JSON.stringify({
      images: [],
      total: 0,
      error: error.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
