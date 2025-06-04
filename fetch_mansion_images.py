import requests
import json
import base64
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Your Cloudinary credentials from environment variables
CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME')
API_KEY = os.getenv('CLOUDINARY_API_KEY')
API_SECRET = os.getenv('CLOUDINARY_API_SECRET')

# Validate that all required environment variables are set
if not all([CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET]):
    raise ValueError("Missing required environment variables. Please check your .env file.")

def fetch_mansion_images():
    # Create authorization header
    credentials = f"{API_KEY}:{API_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        'Authorization': f'Basic {encoded_credentials}',
        'Content-Type': 'application/json'
    }
    
    url = f"https://api.cloudinary.com/v1_1/{CLOUDINARY_CLOUD_NAME}/resources/image"
    
    all_images = []
    mansion_images = []
    next_cursor = None
    
    print("🔍 Scanning ALL images in your Cloudinary account to find mansion images...")
    
    # Search keywords that might indicate mansion images
    mansion_keywords = [
        'mansion', 'luxury', 'villa', 'premium', 'high', 'elite', 
        'whatsapp', 'WhatsApp', 'WHATSAPP'  # Added WhatsApp patterns
    ]
    
    while True:
        params = {
            'type': 'upload',
            'max_results': 500
        }
        
        if next_cursor:
            params['next_cursor'] = next_cursor
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            if 'resources' in data and data['resources']:
                batch_size = len(data['resources'])
                all_images.extend(data['resources'])
                
                # Check each image for mansion-related keywords
                for resource in data['resources']:
                    public_id = resource['public_id'].lower()
                    # Check if any mansion keyword is in the public_id
                    if any(keyword.lower() in public_id for keyword in mansion_keywords):
                        mansion_images.append(resource)
                
                print(f"   📦 Scanned {batch_size} images | Total: {len(all_images)} | Mansion candidates: {len(mansion_images)}")
            
            # Check if there are more results
            if 'next_cursor' in data and data['next_cursor']:
                next_cursor = data['next_cursor']
            else:
                break
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Error: {e}")
            break
    
    print(f"\n🎯 Found {len(mansion_images)} potential mansion images out of {len(all_images)} total images")
    
    if mansion_images:
        # Show found images for confirmation
        print(f"\n📸 Mansion images found:")
        for i, resource in enumerate(mansion_images[:10], 1):  # Show first 10
            print(f"   {i}. {resource['public_id']}")
        
        if len(mansion_images) > 10:
            print(f"   ... and {len(mansion_images) - 10} more")
        
        # Save to files
        save_images_to_files(mansion_images)
        
    else:
        print("\n❌ No mansion images found. Let me show you all image names to help identify the pattern...")
        
        # Show some sample image names
        print(f"\n📋 Sample image names (first 20):")
        for i, resource in enumerate(all_images[:20], 1):
            print(f"   {i:2d}. {resource['public_id']}")
        
        if len(all_images) > 20:
            print(f"   ... and {len(all_images) - 20} more")
        
        print(f"\n💡 Please check the names above and update the mansion_keywords list in the script")

def save_images_to_files(images):
    """Save images to text files"""
    if not images:
        print("❌ No images to save")
        return
    
    print(f"\n💾 Saving {len(images)} mansion images to files...")
    
    # Generate JavaScript array format
    js_lines = []
    url_lines = []
    
    for index, resource in enumerate(images):
        public_id = resource['public_id']
        js_line = f'      {{ src: "https://res.cloudinary.com/{CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/v1/{public_id}", category: "filter-mansion", title: "Luxury Mansion Project {index + 1}" }},'
        js_lines.append(js_line)
        
        url_line = f"https://res.cloudinary.com/{CLOUDINARY_CLOUD_NAME}/image/upload/f_auto,q_auto/v1/{public_id}"
        url_lines.append(url_line)
    
    # Save JavaScript format
    js_content = f"""// Mansion Builder Images - Add these to your images array
const mansionImages = [
{chr(10).join(js_lines)}
];

// To add to your existing array:
// images = [...images, ...mansionImages];"""
    
    with open('mansion-images-js.txt', 'w') as f:
        f.write(js_content)
    print("✅ JavaScript format saved to: mansion-images-js.txt")
    
    # Save URLs list
    with open('mansion-images-urls.txt', 'w') as f:
        f.write('\n'.join(url_lines))
    print("✅ URLs list saved to: mansion-images-urls.txt")
    
    # Save full JSON
    with open('mansion-images-full.json', 'w') as f:
        json.dump({'total_images': len(images), 'resources': images}, f, indent=2)
    print("✅ Full JSON data saved to: mansion-images-full.json")
    
    print(f"\n🎉 SUCCESS! Files created:")
    print(f"- mansion-images-js.txt (ready to copy-paste into your code)")
    print(f"- mansion-images-urls.txt (simple URLs list)")
    print(f"- mansion-images-full.json (complete data)")

if __name__ == "__main__":
    fetch_mansion_images()