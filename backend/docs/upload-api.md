# Upload API

This document covers the image upload functionality using ImageKit.

## Overview

The Linkerly API uses ImageKit for image uploads. This provides:
- Fast CDN delivery
- Automatic image optimization
- Responsive image transformations
- Secure upload authentication

## Endpoints

### Get Upload Signature

Get authentication parameters for uploading images to ImageKit.

**Endpoint:** `GET /api/upload/signature`

**Authentication:** Not required (but recommended to implement in production)

**Success Response (200):**

```json
{
  "token": "unique-token-string",
  "expire": 1705334400,
  "signature": "generated-signature-hash"
}
```

**Response Fields:**
- `token`: Unique token for this upload session
- `expire`: Unix timestamp when the signature expires
- `signature`: HMAC signature for authentication

---

## ImageKit Integration

### Client-Side Upload Flow

1. **Get Upload Signature** from the API
2. **Upload Image** to ImageKit using the signature
3. **Receive Image URL** from ImageKit
4. **Use Image URL** in your API requests (for profile pictures, collection covers, etc.)

### ImageKit Configuration

You need to configure ImageKit credentials in your backend `.env` file:

```env
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

---

## Examples

### JavaScript/Fetch Example

**Step 1: Get Upload Signature**

```javascript
const response = await fetch('http://localhost:5000/api/upload/signature');
const authParams = await response.json();

console.log('Auth params:', authParams);
// { token: "...", expire: 1705334400, signature: "..." }
```

**Step 2: Upload to ImageKit**

```javascript
// Using ImageKit SDK
import ImageKit from 'imagekit-javascript';

const imagekit = new ImageKit({
  publicKey: "your_public_key",
  urlEndpoint: "https://ik.imagekit.io/your_id"
});

// Get signature from your API
const response = await fetch('http://localhost:5000/api/upload/signature');
const authParams = await response.json();

// Upload file
const file = document.getElementById('fileInput').files[0];

imagekit.upload({
  file: file,
  fileName: file.name,
  token: authParams.token,
  signature: authParams.signature,
  expire: authParams.expire,
  folder: '/profile-pictures' // Optional: organize uploads
}, function(err, result) {
  if (err) {
    console.error('Upload failed:', err);
  } else {
    console.log('Upload successful!');
    console.log('Image URL:', result.url);
    // Use result.url in your profile update or collection creation
  }
});
```

---

## React Upload Component Example

```javascript
import { useState } from 'react';
import ImageKit from 'imagekit-javascript';

const imagekit = new ImageKit({
  publicKey: process.env.REACT_APP_IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: process.env.REACT_APP_IMAGEKIT_URL_ENDPOINT
});

function ImageUploader({ onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Get signature from API
      const response = await fetch('http://localhost:5000/api/upload/signature');
      const authParams = await response.json();

      // Upload to ImageKit
      imagekit.upload({
        file: file,
        fileName: file.name,
        token: authParams.token,
        signature: authParams.signature,
        expire: authParams.expire,
        folder: '/uploads',
        useUniqueFileName: true,
        tags: ['user-upload']
      }, function(err, result) {
        setUploading(false);
        
        if (err) {
          console.error('Upload error:', err);
          alert('Upload failed. Please try again.');
        } else {
          console.log('Upload successful:', result);
          onUploadComplete(result.url);
        }
      }, function(progress) {
        // Progress callback
        const percent = Math.round((progress.loaded / progress.total) * 100);
        setProgress(percent);
      });
    } catch (error) {
      console.error('Error:', error);
      setUploading(false);
      alert('Upload failed. Please try again.');
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && (
        <div>
          <p>Uploading... {progress}%</p>
          <progress value={progress} max="100" />
        </div>
      )}
    </div>
  );
}

// Usage
function ProfileEditor() {
  const [profilePicUrl, setProfilePicUrl] = useState('');

  const handleUploadComplete = (url) => {
    console.log('New image URL:', url);
    setProfilePicUrl(url);
    // Now update profile with this URL
  };

  return (
    <div>
      <h2>Upload Profile Picture</h2>
      <ImageUploader onUploadComplete={handleUploadComplete} />
      {profilePicUrl && (
        <img src={profilePicUrl} alt="Preview" style={{ width: 200 }} />
      )}
    </div>
  );
}
```

---

## Complete Upload Flow Example

```javascript
async function uploadAndUpdateProfile(file) {
  try {
    // Step 1: Get upload signature
    const sigResponse = await fetch('http://localhost:5000/api/upload/signature');
    const authParams = await sigResponse.json();

    // Step 2: Upload to ImageKit
    const uploadResult = await new Promise((resolve, reject) => {
      imagekit.upload({
        file: file,
        fileName: file.name,
        token: authParams.token,
        signature: authParams.signature,
        expire: authParams.expire,
        folder: '/profile-pictures',
        useUniqueFileName: true
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    console.log('Image uploaded:', uploadResult.url);

    // Step 3: Update profile with new image URL
    const token = localStorage.getItem('token');
    const profileResponse = await fetch('http://localhost:5000/api/profiles/me', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profilePicUrl: uploadResult.url
      })
    });

    const profileData = await profileResponse.json();
    if (profileData.success) {
      console.log('Profile updated successfully!');
      return profileData.data;
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

---

## Image Transformations

ImageKit provides powerful image transformations. You can modify images on-the-fly by adding parameters to the URL:

### Resize Image

```javascript
// Original URL
const originalUrl = 'https://ik.imagekit.io/your_id/image.jpg';

// Resized to 400x400
const resizedUrl = 'https://ik.imagekit.io/your_id/tr:w-400,h-400/image.jpg';

// Resized with aspect ratio maintained
const aspectUrl = 'https://ik.imagekit.io/your_id/tr:w-400/image.jpg';
```

### Common Transformations

```javascript
// Crop to square
const squareUrl = 'https://ik.imagekit.io/your_id/tr:w-400,h-400,c-at_max/image.jpg';

// Add quality compression
const compressedUrl = 'https://ik.imagekit.io/your_id/tr:q-80/image.jpg';

// Convert to WebP
const webpUrl = 'https://ik.imagekit.io/your_id/tr:f-webp/image.jpg';

// Multiple transformations
const optimizedUrl = 'https://ik.imagekit.io/your_id/tr:w-400,h-400,q-80,f-webp/image.jpg';
```

---

## Best Practices

1. **File Validation**
   - Check file type (accept only images)
   - Limit file size (recommended: 5MB max)
   - Validate dimensions if needed

2. **Security**
   - Implement authentication for signature endpoint in production
   - Use unique filenames to prevent overwrites
   - Sanitize file names

3. **Performance**
   - Use ImageKit transformations for responsive images
   - Implement lazy loading for images
   - Use WebP format for better compression

4. **Organization**
   - Use folders to organize uploads (`/profile-pictures`, `/collection-covers`)
   - Add tags for easier management
   - Use descriptive file names

5. **Error Handling**
   - Show upload progress to users
   - Handle network errors gracefully
   - Provide retry mechanism

---

## Supported Image Formats

- JPEG / JPG
- PNG
- WebP
- GIF
- SVG
- BMP
- TIFF

---

## File Size Limits

- **Profile Pictures**: 2MB recommended
- **Cover Images**: 5MB recommended
- **Collection Images**: 5MB recommended

---

## Common Issues

### Issue: "Upload failed"
**Solution**: 
- Check file size (must be under limit)
- Verify file is a valid image
- Ensure signature hasn't expired

### Issue: "Signature expired"
**Solution**: Get a new signature from the API (signatures expire after a set time)

### Issue: "Invalid file type"
**Solution**: Only image files are supported

### Issue: Image not loading
**Solution**: 
- Verify the ImageKit URL is correct
- Check if the image was successfully uploaded
- Ensure the URL is publicly accessible

---

## ImageKit Dashboard

Access your ImageKit dashboard to:
- View all uploaded images
- Manage storage
- Configure settings
- View usage statistics
- Set up webhooks

Dashboard URL: https://imagekit.io/dashboard

---

## Alternative: Direct Upload

For simple use cases, you can also use direct file upload to your server, but ImageKit is recommended for:
- Better performance (CDN)
- Automatic optimization
- Image transformations
- Reduced server load
