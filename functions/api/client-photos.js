import { v2 as cloudinary } from 'cloudinary';

export async function onRequest(context) {
  try {
    cloudinary.config({
      cloud_name: context.env.CLOUDINARY_CLOUD_NAME,
      api_key: context.env.CLOUDINARY_API_KEY,
      api_secret: context.env.CLOUDINARY_API_SECRET
    });

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
