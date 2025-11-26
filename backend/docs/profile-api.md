# Profile API

This document covers public profile and profile management endpoints.

## Endpoints

### Get Public Profile

Get a user's public profile with their collections.

**Endpoint:** `GET /api/profiles/:username`

**Authentication:** Not required

**URL Parameters:**
- `username`: The user's username

**Query Parameters:**
- `page` (optional): Page number for collections (default: 1)
- `limit` (optional): Collections per page (default: 12)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "userName": "johndoe",
      "displayName": "John Doe",
      "bio": "Software developer and link curator",
      "profilePicUrl": "https://example.com/profile.jpg",
      "coverImage": "https://example.com/cover.jpg",
      "isVerified": true,
      "isPremium": false,
      "socialLinks": [
        {
          "platform": "twitter",
          "url": "https://twitter.com/johndoe"
        },
        {
          "platform": "github",
          "url": "https://github.com/johndoe"
        },
        {
          "platform": "website",
          "url": "https://johndoe.com"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "collections": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Web Development Resources",
        "slug": "web-dev-resources",
        "description": "Curated list of web development tools and tutorials",
        "image": "https://example.com/collection1.jpg",
        "collectionShortUrl": "webdev",
        "isPublic": true,
        "linkCount": 25,
        "links": [
          {
            "_id": "507f1f77bcf86cd799439013",
            "title": "React Documentation",
            "shortUrl": "abc123"
          }
        ],
        "createdAt": "2024-01-16T12:00:00.000Z"
      }
    ],
    "stats": {
      "totalCollections": 15,
      "totalPublicCollections": 12,
      "totalLinks": 234,
      "totalViews": 5678
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "hasMore": true
    }
  }
}
```

**Error Responses:**

```json
// 404 - User not found
{
  "success": false,
  "message": "User not found"
}
```

---

### Get Public Collections

Get only the public collections for a user (without user details).

**Endpoint:** `GET /api/profiles/:username/collections`

**Authentication:** Not required

**URL Parameters:**
- `username`: The user's username

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Web Development Resources",
        "slug": "web-dev-resources",
        "description": "Curated list of web development tools",
        "image": "https://example.com/collection1.jpg",
        "collectionShortUrl": "webdev",
        "linkCount": 25,
        "owner": {
          "_id": "507f1f77bcf86cd799439011",
          "userName": "johndoe",
          "displayName": "John Doe",
          "profilePicUrl": "https://example.com/profile.jpg"
        },
        "createdAt": "2024-01-16T12:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalCollections": 12
    }
  }
}
```

---

### Update My Profile

Update the authenticated user's profile information.

**Endpoint:** `PUT /api/profiles/me`

**Authentication:** 🔒 Required

**Request Body:**

```json
{
  "displayName": "John Doe",
  "bio": "Software developer, designer, and link curator",
  "profilePicUrl": "https://example.com/new-profile.jpg",
  "coverImage": "https://example.com/new-cover.jpg",
  "socialLinks": [
    {
      "platform": "twitter",
      "url": "https://twitter.com/johndoe"
    },
    {
      "platform": "github",
      "url": "https://github.com/johndoe"
    },
    {
      "platform": "linkedin",
      "url": "https://linkedin.com/in/johndoe"
    },
    {
      "platform": "website",
      "url": "https://johndoe.com"
    }
  ]
}
```

**Validation Rules:**
- `displayName`: Optional, max 50 characters
- `bio`: Optional, max 500 characters
- `profilePicUrl`: Optional, must be valid URL
- `coverImage`: Optional, must be valid URL
- `socialLinks`: Optional, array of social link objects
  - `platform`: Required, string (e.g., "twitter", "github", "linkedin")
  - `url`: Required, must be valid URL

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userName": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "bio": "Software developer, designer, and link curator",
    "profilePicUrl": "https://example.com/new-profile.jpg",
    "coverImage": "https://example.com/new-cover.jpg",
    "socialLinks": [
      {
        "platform": "twitter",
        "url": "https://twitter.com/johndoe"
      },
      {
        "platform": "github",
        "url": "https://github.com/johndoe"
      }
    ],
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

**Error Responses:**

```json
// 400 - Validation error
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "bio": "Bio must be less than 500 characters",
    "profilePicUrl": "Invalid URL format"
  }
}

// 401 - Unauthorized
{
  "success": false,
  "message": "Authentication required"
}
```

---

### Get My Profile

Get the authenticated user's own profile (same as GET /api/users/profile).

**Endpoint:** `GET /api/profiles/me`

**Authentication:** 🔒 Required

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "userName": "johndoe",
    "email": "john@example.com",
    "displayName": "John Doe",
    "bio": "Software developer and link curator",
    "profilePicUrl": "https://example.com/profile.jpg",
    "coverImage": "https://example.com/cover.jpg",
    "isVerified": true,
    "isPremium": false,
    "socialLinks": [
      {
        "platform": "twitter",
        "url": "https://twitter.com/johndoe"
      }
    ],
    "bookmarks": ["collection_id_1", "collection_id_2"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

---

## Profile Features

### Social Links

Supported social platforms:
- `twitter` / `x`
- `github`
- `linkedin`
- `instagram`
- `facebook`
- `youtube`
- `website`
- `email`

Each social link should have:
```json
{
  "platform": "twitter",
  "url": "https://twitter.com/username"
}
```

### Profile Images

**Profile Picture:**
- Recommended size: 400x400px
- Format: JPG, PNG, WebP
- Max file size: 2MB

**Cover Image:**
- Recommended size: 1500x500px
- Format: JPG, PNG, WebP
- Max file size: 5MB

---

## Examples

### cURL Examples

**Get Public Profile:**
```bash
curl -X GET "http://localhost:5000/api/profiles/johndoe?page=1&limit=12"
```

**Update Profile:**
```bash
curl -X PUT http://localhost:5000/api/profiles/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "John Doe",
    "bio": "Software developer and link curator",
    "socialLinks": [
      {
        "platform": "twitter",
        "url": "https://twitter.com/johndoe"
      }
    ]
  }'
```

### JavaScript/Fetch Examples

**Get Public Profile:**
```javascript
const username = 'johndoe';
const response = await fetch(
  `http://localhost:5000/api/profiles/${username}?page=1&limit=12`
);

const data = await response.json();
if (data.success) {
  console.log('User:', data.data.user);
  console.log('Collections:', data.data.collections);
  console.log('Stats:', data.data.stats);
}
```

**Update Profile:**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/profiles/me', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    displayName: 'John Doe',
    bio: 'Software developer and link curator',
    profilePicUrl: 'https://example.com/profile.jpg',
    socialLinks: [
      {
        platform: 'twitter',
        url: 'https://twitter.com/johndoe'
      },
      {
        platform: 'github',
        url: 'https://github.com/johndoe'
      }
    ]
  })
});

const data = await response.json();
if (data.success) {
  console.log('Profile updated!', data.data);
}
```

**Get Public Collections Only:**
```javascript
const username = 'johndoe';
const page = 1;

const response = await fetch(
  `http://localhost:5000/api/profiles/${username}/collections?page=${page}&limit=12`
);

const data = await response.json();
if (data.success) {
  console.log('Collections:', data.data.collections);
  console.log('Has more:', data.data.pagination.hasMore);
}
```

---

## React Component Example

```javascript
import { useState, useEffect } from 'react';

function PublicProfile({ username }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/profiles/${username}`
        );
        const data = await response.json();
        
        if (data.success) {
          setProfile(data.data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!profile) return <div>Profile not found</div>;

  return (
    <div>
      <img src={profile.user.coverImage} alt="Cover" />
      <img src={profile.user.profilePicUrl} alt="Profile" />
      <h1>{profile.user.displayName}</h1>
      <p>@{profile.user.userName}</p>
      <p>{profile.user.bio}</p>
      
      <div>
        {profile.user.socialLinks.map((link, i) => (
          <a key={i} href={link.url} target="_blank">
            {link.platform}
          </a>
        ))}
      </div>

      <h2>Collections ({profile.stats.totalPublicCollections})</h2>
      {profile.collections.map(collection => (
        <div key={collection._id}>
          <h3>{collection.name}</h3>
          <p>{collection.description}</p>
          <span>{collection.linkCount} links</span>
        </div>
      ))}
    </div>
  );
}
```

---

## Best Practices

1. **Public Profiles**: Make profiles SEO-friendly with proper meta tags
2. **Image Optimization**: Compress images before uploading
3. **Social Links**: Validate URLs before saving
4. **Privacy**: Only show public collections on public profiles
5. **Caching**: Cache public profile data to reduce server load
6. **Pagination**: Use pagination for users with many collections

---

## Common Issues

### Issue: "User not found"
**Solution**: Verify the username is correct and the user exists

### Issue: "Validation failed"
**Solution**: Check that all fields meet the validation requirements

### Issue: Profile images not loading
**Solution**: Ensure image URLs are publicly accessible and use HTTPS

### Issue: Social links not saving
**Solution**: Verify each social link has both `platform` and `url` fields
