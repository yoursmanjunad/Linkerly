# Collections API

This document covers all collection management endpoints for organizing and grouping URLs.

## Endpoints

### Create Collection

Create a new collection to organize your URLs.

**Endpoint:** `POST /api/collections`

**Authentication:** 🔒 Required

**Request Body:**

```json
{
  "name": "My Favorite Links",
  "description": "A collection of my favorite resources", // Optional
  "image": "https://example.com/collection-cover.jpg", // Optional
  "isPublic": true, // Optional, default: false
  "collectionShortUrl": "my-favorites" // Optional
}
```

**Validation Rules:**
- `name`: Required, 1-100 characters
- `description`: Optional, max 500 characters
- `image`: Optional, must be a valid URL
- `isPublic`: Optional, boolean
- `collectionShortUrl`: Optional, 3-50 characters, alphanumeric and hyphens

**Success Response (201):**

```json
{
  "success": true,
  "message": "Collection created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Favorite Links",
    "slug": "my-favorite-links",
    "description": "A collection of my favorite resources",
    "image": "https://example.com/collection-cover.jpg",
    "collectionShortUrl": "my-favorites",
    "isPublic": true,
    "owner": "507f1f77bcf86cd799439012",
    "links": [],
    "linkCount": 0,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Get User Collections

Get all collections for the authenticated user.

**Endpoint:** `GET /api/collections`

**Authentication:** 🔒 Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sortBy` (optional): Sort field (default: "createdAt")

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "collections": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "My Favorite Links",
        "slug": "my-favorite-links",
        "description": "A collection of my favorite resources",
        "image": "https://example.com/collection-cover.jpg",
        "collectionShortUrl": "my-favorites",
        "isPublic": true,
        "linkCount": 15,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCollections": 25
    }
  }
}
```

---

### Get Collection by ID

Get a specific collection with all its URLs.

**Endpoint:** `GET /api/collections/:id`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: Collection document ID

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Favorite Links",
    "slug": "my-favorite-links",
    "description": "A collection of my favorite resources",
    "image": "https://example.com/collection-cover.jpg",
    "collectionShortUrl": "my-favorites",
    "isPublic": true,
    "owner": {
      "_id": "507f1f77bcf86cd799439012",
      "userName": "johndoe",
      "displayName": "John Doe"
    },
    "links": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "originalUrl": "https://example.com/page",
        "shortUrl": "abc123",
        "title": "Example Page",
        "description": "An example page",
        "image": "https://example.com/image.jpg",
        "clicks": 42
      }
    ],
    "linkCount": 15,
    "totalClicks": 1247,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### Update Collection

Update collection metadata.

**Endpoint:** `PUT /api/collections/:id`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: Collection document ID

**Request Body:**

```json
{
  "name": "Updated Collection Name",
  "description": "Updated description",
  "image": "https://example.com/new-cover.jpg",
  "isPublic": false,
  "collectionShortUrl": "updated-url"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Collection updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Updated Collection Name",
    "description": "Updated description",
    "image": "https://example.com/new-cover.jpg",
    "isPublic": false,
    "collectionShortUrl": "updated-url",
    "updatedAt": "2024-01-20T15:45:00.000Z"
  }
}
```

---

### Delete Collection

Delete a collection permanently.

**Endpoint:** `DELETE /api/collections/:id`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: Collection document ID

**Success Response (200):**

```json
{
  "success": true,
  "message": "Collection deleted successfully"
}
```

**Note:** Deleting a collection does NOT delete the URLs within it. URLs will remain in your account.

---

### Add URL to Collection

Add an existing URL to a collection.

**Endpoint:** `POST /api/collections/:id/urls`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: Collection document ID

**Request Body:**

```json
{
  "urlId": "507f1f77bcf86cd799439013"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "URL added to collection",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Favorite Links",
    "linkCount": 16,
    "links": ["507f1f77bcf86cd799439013", "..."]
  }
}
```

---

### Bulk Add URLs to Collection

Add multiple URLs to a collection at once.

**Endpoint:** `POST /api/collections/:id/urls/bulk`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: Collection document ID

**Request Body:**

```json
{
  "urlIds": [
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439015"
  ]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "3 URLs added to collection",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Favorite Links",
    "linkCount": 18,
    "addedCount": 3
  }
}
```

---

### Remove URL from Collection

Remove a URL from a collection.

**Endpoint:** `DELETE /api/collections/:id/urls/:urlId`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: Collection document ID
- `urlId`: URL document ID to remove

**Success Response (200):**

```json
{
  "success": true,
  "message": "URL removed from collection",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Favorite Links",
    "linkCount": 14
  }
}
```

**Note:** Removing a URL from a collection does NOT delete the URL itself.

---

### Move URL to Different Collection

Move a URL from one collection to another.

**Endpoint:** `PUT /api/collections/:id/urls/move`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: Source collection ID

**Request Body:**

```json
{
  "urlId": "507f1f77bcf86cd799439013",
  "targetCollectionId": "507f1f77bcf86cd799439020"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "URL moved successfully",
  "data": {
    "sourceCollection": {
      "_id": "507f1f77bcf86cd799439011",
      "linkCount": 14
    },
    "targetCollection": {
      "_id": "507f1f77bcf86cd799439020",
      "linkCount": 8
    }
  }
}
```

---

### Get Collection Analytics

Get analytics data for all URLs in a collection.

**Endpoint:** `GET /api/collections/:id/analytics`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: Collection document ID

**Query Parameters:**
- `period` (optional): "7d", "30d", "90d", "all" (default: "30d")

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "collectionId": "507f1f77bcf86cd799439011",
    "collectionName": "My Favorite Links",
    "totalLinks": 15,
    "totalClicks": 3456,
    "uniqueVisitors": 2134,
    "averageClicksPerLink": 230.4,
    "topPerformingLinks": [
      {
        "urlId": "507f1f77bcf86cd799439013",
        "title": "Popular Link",
        "clicks": 892
      }
    ],
    "clicksByDate": [
      {
        "date": "2024-01-15",
        "clicks": 145
      }
    ],
    "deviceBreakdown": {
      "mobile": 1890,
      "desktop": 1234,
      "tablet": 332
    }
  }
}
```

---

## Collection Model Schema

```javascript
{
  name: String,              // Collection name
  slug: String,             // URL-friendly slug
  description: String,      // Collection description
  image: String,           // Cover image URL
  collectionShortUrl: String, // Custom short URL
  isPublic: Boolean,       // Public visibility
  owner: ObjectId,         // Owner user ID
  links: [ObjectId],       // Array of URL IDs
  linkCount: Number,       // Virtual field - count of links
  createdAt: Date,
  updatedAt: Date
}
```

---

## Examples

### JavaScript/Fetch Examples

**Create Collection:**
```javascript
const token = localStorage.getItem('token');
const response = await fetch('http://localhost:5000/api/collections', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'My Favorite Links',
    description: 'A collection of my favorite resources',
    isPublic: true,
    collectionShortUrl: 'my-favorites'
  })
});

const data = await response.json();
if (data.success) {
  console.log('Collection created:', data.data);
}
```

**Add URL to Collection:**
```javascript
const token = localStorage.getItem('token');
const collectionId = '507f1f77bcf86cd799439011';
const urlId = '507f1f77bcf86cd799439013';

const response = await fetch(
  `http://localhost:5000/api/collections/${collectionId}/urls`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ urlId })
  }
);

const data = await response.json();
if (data.success) {
  console.log('URL added to collection');
}
```

**Bulk Add URLs:**
```javascript
const token = localStorage.getItem('token');
const collectionId = '507f1f77bcf86cd799439011';
const urlIds = ['id1', 'id2', 'id3'];

const response = await fetch(
  `http://localhost:5000/api/collections/${collectionId}/urls/bulk`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ urlIds })
  }
);

const data = await response.json();
if (data.success) {
  console.log(`${data.data.addedCount} URLs added`);
}
```

---

## Best Practices

1. **Public Collections**: Set `isPublic: true` for collections you want to share
2. **Custom URLs**: Use memorable custom short URLs for easy sharing
3. **Organization**: Use descriptive names and descriptions
4. **Bulk Operations**: Use bulk add for adding multiple URLs efficiently
5. **Analytics**: Regularly check collection analytics to understand performance
6. **Images**: Use high-quality cover images for better visual appeal

---

## Common Issues

### Issue: "Collection not found"
**Solution**: Verify the collection ID is correct and belongs to your account

### Issue: "URL already in collection"
**Solution**: The URL is already part of this collection

### Issue: "Custom short URL already taken"
**Solution**: Choose a different custom short URL

### Issue: "Cannot delete collection"
**Solution**: Ensure you own the collection and have proper permissions
