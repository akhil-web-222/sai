require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function checkCloudinary() {
    try {
        const searchResult = await cloudinary.search
            .expression('folder:"sai-photo/album/house work - 1"')
            .max_results(5)
            .execute();
            
        console.log(`Found ${searchResult.total_count} images in logical folder sai-photo/album/house work - 1`);
        if (searchResult.resources.length > 0) {
            console.log("Sample resource:");
            console.log("public_id:", searchResult.resources[0].public_id);
            console.log("folder:", searchResult.resources[0].folder);
            console.log("url:", searchResult.resources[0].secure_url);
        }
    } catch(err) {
        console.error(err);
    }
}
checkCloudinary();
