# API Testing Guide

This guide helps you test the Linkerly API using various tools.

## Table of Contents

1. [Postman Collection](#postman-collection)
2. [Testing with cURL](#testing-with-curl)
3. [Testing with JavaScript](#testing-with-javascript)
4. [Environment Variables](#environment-variables)
5. [Common Test Scenarios](#common-test-scenarios)

---

## Postman Collection

### Import Collection

Create a new Postman collection with the following structure:

#### Collection Variables

Set these variables in your Postman collection:

```
base_url: http://localhost:5000/api
token: (will be set after login)
user_id: (will be set after login)
collection_id: (will be set after creating a collection)
url_id: (will be set after creating a URL)
```

### Folder Structure

```
📁 Linkerly API
  📁 Authentication
    ├── Register User
    ├── Login User
    ├── Get Current User
    └── Logout User
  📁 URLs
    ├── Create Short URL
    ├── Get User URLs
    ├── Get URL Details
    ├── Get URL Analytics
    ├── Update URL
    └── Delete URL
  📁 Collections
    ├── Create Collection
    ├── Get User Collections
    ├── Get Collection by ID
    ├── Update Collection
    ├── Delete Collection
    ├── Add URL to Collection
    ├── Bulk Add URLs
    ├── Remove URL from Collection
    ├── Move URL
    └── Get Collection Analytics
  📁 Bookmarks
    ├── Toggle Bookmark
    └── Get Bookmarks
  📁 Profiles
    ├── Get Public Profile
    ├── Get Public Collections
    ├── Update My Profile
    └── Get My Profile
  📁 Upload
    └── Get Upload Signature
  📁 Public
    ├── Get Public Collection
    └── Redirect Short URL
```

### Sample Requests

#### 1. Register User

```
POST {{base_url}}/users/register
Content-Type: application/json

{
  "userName": "testuser",
  "email": "test@example.com",
  "password": "TestPass123!",
  "displayName": "Test User"
}

Tests:
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has token", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data.token).to.exist;
    pm.collectionVariables.set("token", jsonData.data.token);
});
```

#### 2. Login User

```
POST {{base_url}}/users/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "TestPass123!"
}

Tests:
pm.test("Login successful", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.collectionVariables.set("token", jsonData.data.token);
    pm.collectionVariables.set("user_id", jsonData.data.user._id);
});
```

#### 3. Create Short URL

```
POST {{base_url}}/url/shorten
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "originalUrl": "https://example.com/very-long-url",
  "customShortUrl": "test-link",
  "title": "Test Link",
  "description": "A test link"
}

Tests:
pm.test("URL created", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.collectionVariables.set("url_id", jsonData.data._id);
});
```

#### 4. Create Collection

```
POST {{base_url}}/collections
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "name": "Test Collection",
  "description": "A test collection",
  "isPublic": true,
  "collectionShortUrl": "test-collection"
}

Tests:
pm.test("Collection created", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.collectionVariables.set("collection_id", jsonData.data._id);
});
```

---

## Testing with cURL

### Complete Test Flow

```bash
# 1. Register
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "displayName": "Test User"
  }'

# Save the token from response
TOKEN="your-token-here"

# 2. Create URL
curl -X POST http://localhost:5000/api/url/shorten \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "originalUrl": "https://example.com/page",
    "title": "Test Link"
  }'

# Save the URL ID from response
URL_ID="url-id-here"

# 3. Create Collection
curl -X POST http://localhost:5000/api/collections \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Collection",
    "isPublic": true
  }'

# Save the collection ID from response
COLLECTION_ID="collection-id-here"

# 4. Add URL to Collection
curl -X POST http://localhost:5000/api/collections/$COLLECTION_ID/urls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"urlId\": \"$URL_ID\"}"

# 5. Get Collection
curl -X GET http://localhost:5000/api/collections/$COLLECTION_ID \
  -H "Authorization: Bearer $TOKEN"

# 6. Bookmark Collection
curl -X POST http://localhost:5000/api/collections/$COLLECTION_ID/bookmark \
  -H "Authorization: Bearer $TOKEN"

# 7. Get Bookmarks
curl -X GET http://localhost:5000/api/users/bookmarks \
  -H "Authorization: Bearer $TOKEN"
```

---

## Testing with JavaScript

### Test Suite Example

```javascript
// test-api.js
const BASE_URL = 'http://localhost:5000/api';
let token = '';
let userId = '';
let urlId = '';
let collectionId = '';

async function runTests() {
  try {
    console.log('🧪 Starting API Tests...\n');

    // Test 1: Register
    console.log('1️⃣ Testing Registration...');
    const registerData = await testRegister();
    token = registerData.token;
    console.log('✅ Registration successful\n');

    // Test 2: Login
    console.log('2️⃣ Testing Login...');
    const loginData = await testLogin();
    token = loginData.token;
    userId = loginData.user._id;
    console.log('✅ Login successful\n');

    // Test 3: Create URL
    console.log('3️⃣ Testing URL Creation...');
    const urlData = await testCreateUrl();
    urlId = urlData._id;
    console.log('✅ URL created\n');

    // Test 4: Create Collection
    console.log('4️⃣ Testing Collection Creation...');
    const collectionData = await testCreateCollection();
    collectionId = collectionData._id;
    console.log('✅ Collection created\n');

    // Test 5: Add URL to Collection
    console.log('5️⃣ Testing Add URL to Collection...');
    await testAddUrlToCollection();
    console.log('✅ URL added to collection\n');

    // Test 6: Bookmark Collection
    console.log('6️⃣ Testing Bookmark...');
    await testBookmark();
    console.log('✅ Bookmark toggled\n');

    // Test 7: Get Profile
    console.log('7️⃣ Testing Get Profile...');
    await testGetProfile();
    console.log('✅ Profile retrieved\n');

    console.log('🎉 All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testRegister() {
  const response = await fetch(`${BASE_URL}/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: `testuser${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123!',
      displayName: 'Test User'
    })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function testLogin() {
  const response = await fetch(`${BASE_URL}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'TestPass123!'
    })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function testCreateUrl() {
  const response = await fetch(`${BASE_URL}/url/shorten`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      originalUrl: 'https://example.com/test',
      title: 'Test Link'
    })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function testCreateCollection() {
  const response = await fetch(`${BASE_URL}/collections`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Test Collection',
      isPublic: true
    })
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function testAddUrlToCollection() {
  const response = await fetch(
    `${BASE_URL}/collections/${collectionId}/urls`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ urlId })
    }
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

async function testBookmark() {
  const response = await fetch(
    `${BASE_URL}/collections/${collectionId}/bookmark`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data;
}

async function testGetProfile() {
  const response = await fetch(`${BASE_URL}/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.message);
  return data.data;
}

// Run tests
runTests();
```

Run with: `node test-api.js`

---

## Environment Variables

### Development (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/linkerly

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d

# ImageKit
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### Production (.env.production)

```env
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/linkerly

# JWT
JWT_SECRET=strong-production-secret
JWT_EXPIRE=7d

# ImageKit
IMAGEKIT_PUBLIC_KEY=prod_public_key
IMAGEKIT_PRIVATE_KEY=prod_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/prod_id

# Frontend URL
FRONTEND_URL=https://linkerly.it
```

---

## Common Test Scenarios

### Scenario 1: Complete User Journey

1. Register new user
2. Login
3. Create multiple URLs
4. Create a collection
5. Add URLs to collection
6. Update profile
7. Make collection public
8. Bookmark another user's collection
9. View analytics

### Scenario 2: Collection Management

1. Create collection
2. Add 5 URLs
3. Update collection metadata
4. Remove 2 URLs
5. Move 1 URL to another collection
6. Get collection analytics
7. Delete collection

### Scenario 3: URL Management

1. Create URL with custom short code
2. Get URL details
3. Update URL metadata
4. Add to multiple collections
5. Get URL analytics
6. Deactivate URL
7. Delete URL

---

## Automated Testing

### Jest Test Example

```javascript
// __tests__/api.test.js
const request = require('supertest');
const app = require('../app');

describe('API Tests', () => {
  let token;
  let urlId;

  test('POST /api/users/register - should register user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        userName: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    token = res.body.data.token;
  });

  test('POST /api/url/shorten - should create URL', async () => {
    const res = await request(app)
      .post('/api/url/shorten')
      .set('Authorization', `Bearer ${token}`)
      .send({
        originalUrl: 'https://example.com/test'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shortUrl).toBeDefined();
    urlId = res.body.data._id;
  });

  // Add more tests...
});
```

---

## Tips for Testing

1. **Use Collection Variables**: Store IDs and tokens in variables
2. **Test in Order**: Some tests depend on previous test results
3. **Clean Up**: Delete test data after testing
4. **Check Response Times**: Monitor API performance
5. **Test Error Cases**: Don't just test happy paths
6. **Use Pre-request Scripts**: Set up data before requests
7. **Validate Responses**: Check all expected fields exist

---

## Troubleshooting

### Issue: "No token provided"
**Solution**: Ensure Authorization header is set correctly

### Issue: "Invalid token"
**Solution**: Token may have expired, login again

### Issue: "Resource not found"
**Solution**: Verify the ID is correct and resource exists

### Issue: Connection refused
**Solution**: Ensure backend server is running on correct port
