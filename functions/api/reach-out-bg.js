async function fetchCloudinaryResources(cloudName, apiKey, apiSecret, prefix, maxResults = 1) {
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

    const reachOutFolder = 'sai-photo/reach-out';
    const result = await fetchCloudinaryResources(cloudName, apiKey, apiSecret, reachOutFolder, 1);

    const image = result.resources.length > 0 ? {
      src: result.resources[0].secure_url.replace('/upload/', '/upload/f_auto,q_auto/')
    } : null;

    return new Response(JSON.stringify({ image }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching reach-out image:', error.message);
    return new Response(JSON.stringify({ 
      image: null, 
      error: error.message 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
