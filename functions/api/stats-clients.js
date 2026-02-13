import { v2 as cloudinary } from 'cloudinary';

export async function onRequest(context) {
  try {
    cloudinary.config({
      cloud_name: context.env.CLOUDINARY_CLOUD_NAME,
      api_key: context.env.CLOUDINARY_API_KEY,
      api_secret: context.env.CLOUDINARY_API_SECRET
    });

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

    return new Response(JSON.stringify({ image }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching stats client image:', error.message);
    return new Response(JSON.stringify({ 
      image: null, 
      error: error.message 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
