# Bookmarks API

This document covers the bookmarks feature for saving favorite collections.

## Endpoints

### Toggle Bookmark

Add or remove a collection from your bookmarks.

**Endpoint:** `POST /api/collections/:id/bookmark`

**Authentication:** 🔒 Required

**URL Parameters:**
- `id`: Collection document ID to bookmark/unbookmark

**Success Response (200):**

```json
{
  "success": true,
  "bookmarked": true,
  "message": "Collection bookmarked successfully"
}
```

**Response when removing bookmark:**

```json
{
  "success": true,
  "bookmarked": false,
  "message": "Bookmark removed successfully"
}
```

**Error Responses:**

```json
// 404 - Collection not found
{
  "success": false,
  "message": "Collection not found"
}

// 401 - Not authenticated
{
  "success": false,
  "message": "Authentication required"
}
```

**Behavior:**
- If the collection is not bookmarked, it will be added to bookmarks
- If the collection is already bookmarked, it will be removed from bookmarks
- The `bookmarked` field in the response indicates the new state

---

### Get User Bookmarks

Get all collections bookmarked by the authenticated user.

**Endpoint:** `GET /api/users/bookmarks`

**Authentication:** 🔒 Required

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Awesome Resources",
      "slug": "awesome-resources",
      "description": "A collection of awesome resources",
      "image": "https://example.com/cover.jpg",
      "collectionShortUrl": "awesome",
      "owner": {
        "_id": "507f1f77bcf86cd799439012",
        "userName": "johndoe",
        "displayName": "John Doe",
        "profilePicUrl": "https://example.com/pic.jpg"
      },
      "linkCount": 25,
      "isPublic": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Design Inspiration",
      "slug": "design-inspiration",
      "description": "Beautiful design examples",
      "image": "https://example.com/design-cover.jpg",
      "collectionShortUrl": "design-inspo",
      "owner": {
        "_id": "507f1f77bcf86cd799439021",
        "userName": "janedoe",
        "displayName": "Jane Doe",
        "profilePicUrl": "https://example.com/jane.jpg"
      },
      "linkCount": 42,
      "isPublic": true,
      "createdAt": "2024-01-10T08:20:00.000Z"
    }
  ]
}
```

**Empty Bookmarks Response:**

```json
{
  "success": true,
  "data": []
}
```

---

## Bookmark Model

Bookmarks are stored as an array of Collection ObjectIds in the User model:

```javascript
// User Model
{
  // ... other user fields
  bookmarks: [ObjectId], // Array of bookmarked collection IDs
  // ... other user fields
}
```

---

## Examples

### cURL Examples

**Toggle Bookmark:**
```bash
curl -X POST http://localhost:5000/api/collections/507f1f77bcf86cd799439011/bookmark \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Bookmarks:**
```bash
curl -X GET http://localhost:5000/api/users/bookmarks \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### JavaScript/Fetch Examples

**Toggle Bookmark:**
```javascript
const token = localStorage.getItem('token');
const collectionId = '507f1f77bcf86cd799439011';

const response = await fetch(
  `http://localhost:5000/api/collections/${collectionId}/bookmark`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const data = await response.json();
if (data.success) {
  if (data.bookmarked) {
    console.log('Collection bookmarked!');
  } else {
    console.log('Bookmark removed!');
  }
}
```

**Get All Bookmarks:**
```javascript
const token = localStorage.getItem('token');

const response = await fetch('http://localhost:5000/api/users/bookmarks', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
if (data.success) {
  console.log('Bookmarked collections:', data.data);
  console.log('Total bookmarks:', data.data.length);
}
```

**Check if Collection is Bookmarked:**
```javascript
const token = localStorage.getItem('token');
const collectionId = '507f1f77bcf86cd799439011';

// Get all bookmarks
const response = await fetch('http://localhost:5000/api/users/bookmarks', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
if (data.success) {
  const isBookmarked = data.data.some(
    collection => collection._id === collectionId
  );
  console.log('Is bookmarked:', isBookmarked);
}
```

---

## React Hook Example

Here's a custom React hook for managing bookmarks:

```javascript
import { useState, useEffect } from 'react';

function useBookmark(collectionId) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if bookmarked on mount
  useEffect(() => {
    const checkBookmark = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await fetch(
          'http://localhost:5000/api/users/bookmarks',
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
        );
        const data = await response.json();
        if (data.success) {
          const bookmarked = data.data.some(c => c._id === collectionId);
          setIsBookmarked(bookmarked);
        }
      } catch (error) {
        console.error('Error checking bookmark:', error);
      }
    };

    checkBookmark();
  }, [collectionId]);

  const toggleBookmark = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to bookmark collections');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/collections/${collectionId}/bookmark`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (data.success) {
        setIsBookmarked(data.bookmarked);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  return { isBookmarked, toggleBookmark, loading };
}

// Usage in component
function CollectionCard({ collectionId }) {
  const { isBookmarked, toggleBookmark, loading } = useBookmark(collectionId);

  return (
    <button onClick={toggleBookmark} disabled={loading}>
      {loading ? 'Loading...' : isBookmarked ? '❤️ Bookmarked' : '🤍 Bookmark'}
    </button>
  );
}
```

---

## Best Practices

1. **Authentication Check**: Always verify user is logged in before allowing bookmarks
2. **UI Feedback**: Show visual feedback when toggling bookmarks (heart icon, animation)
3. **Optimistic Updates**: Update UI immediately, then sync with server
4. **Error Handling**: Handle cases where user is not authenticated
5. **Caching**: Cache bookmark status to reduce API calls
6. **Sync on Login**: Refresh bookmark status when user logs in

---

## Use Cases

### 1. Save Favorite Collections
Users can bookmark collections they find interesting to access them later.

### 2. Build a Reading List
Create a personal reading list by bookmarking collections of articles or resources.

### 3. Curate Inspiration
Bookmark design, development, or other inspirational collections.

### 4. Quick Access
Access frequently used collections quickly from a bookmarks page.

---

## Common Issues

### Issue: "Authentication required"
**Solution**: User must be logged in to bookmark collections

### Issue: "Collection not found"
**Solution**: Verify the collection ID is correct and the collection exists

### Issue: Bookmark state not updating
**Solution**: Ensure you're checking the `bookmarked` field in the response

### Issue: Cannot bookmark own collection
**Solution**: This is allowed - users can bookmark their own collections for quick access
