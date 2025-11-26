# Linkerly API Documentation

Welcome to the Linkerly API documentation. This comprehensive guide covers all available endpoints, authentication, request/response formats, and examples.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [User Management](./user-api.md)
   - [URL Shortening](./url-api.md)
   - [Collections](./collections-api.md)
   - [Bookmarks](./bookmarks-api.md)
   - [Profiles](./profile-api.md)
   - [Upload](./upload-api.md)
4. [Error Handling](#error-handling)
5. [Rate Limiting](#rate-limiting)

## Getting Started

### Base URL

```
Development: http://localhost:5000/api
Production: https://api.linkerly.it/api
```

### Content Type

All requests should use `Content-Type: application/json` unless otherwise specified.

### Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": {},
  "message": "Optional message"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Authentication

Most endpoints require authentication using JWT (JSON Web Tokens).

### How to Authenticate

1. **Register or Login** to obtain a JWT token
2. **Include the token** in the `Authorization` header for protected routes:

```
Authorization: Bearer <your-jwt-token>
```

### Token Storage

- Store the token securely (e.g., in localStorage or httpOnly cookies)
- Token expires after a set period (check your backend configuration)
- Refresh tokens when needed

### Protected Routes

Routes marked with 🔒 require authentication.

## API Endpoints

### Quick Reference

| Category | Endpoint | Method | Auth Required |
|----------|----------|--------|---------------|
| **Users** |
| Register | `/api/users/register` | POST | ❌ |
| Login | `/api/users/login` | POST | ❌ |
| Logout | `/api/users/logout` | POST | ❌ |
| Get Profile | `/api/users/profile` | GET | 🔒 |
| **URLs** |
| Create Short URL | `/api/url/shorten` | POST | 🔒 |
| Get User URLs | `/api/url/user/links` | GET | 🔒 |
| Get URL Details | `/api/url/details/:id` | GET | 🔒 |
| Get URL Analytics | `/api/url/analytics/:id` | GET | 🔒 |
| Update URL | `/api/url/update/:id` | PUT | 🔒 |
| Delete URL | `/api/url/delete/:id` | DELETE | 🔒 |
| **Collections** |
| Create Collection | `/api/collections` | POST | 🔒 |
| Get User Collections | `/api/collections` | GET | 🔒 |
| Get Collection | `/api/collections/:id` | GET | 🔒 |
| Update Collection | `/api/collections/:id` | PUT | 🔒 |
| Delete Collection | `/api/collections/:id` | DELETE | 🔒 |
| Add URL to Collection | `/api/collections/:id/urls` | POST | 🔒 |
| Bulk Add URLs | `/api/collections/:id/urls/bulk` | POST | 🔒 |
| Remove URL | `/api/collections/:id/urls/:urlId` | DELETE | 🔒 |
| Move URL | `/api/collections/:id/urls/move` | PUT | 🔒 |
| Get Analytics | `/api/collections/:id/analytics` | GET | 🔒 |
| **Bookmarks** |
| Toggle Bookmark | `/api/collections/:id/bookmark` | POST | 🔒 |
| Get Bookmarks | `/api/users/bookmarks` | GET | 🔒 |
| **Profiles** |
| Get Public Profile | `/api/profiles/:username` | GET | ❌ |
| Get Public Collections | `/api/profiles/:username/collections` | GET | ❌ |
| Update My Profile | `/api/profiles/me` | PUT | 🔒 |
| **Upload** |
| Get Upload Signature | `/api/upload/signature` | GET | ❌ |
| **Public** |
| Get Public Collection | `/c/:slug` | GET | ❌ |
| Redirect Short URL | `/:shortUrl` | GET | ❌ |

## Error Handling

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

### Common Error Responses

**Unauthorized (401)**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Not Found (404)**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**Validation Error (400)**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

## Rate Limiting

- Rate limiting may be applied to prevent abuse
- Default: 100 requests per 15 minutes per IP
- Rate limit headers are included in responses:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets

## Best Practices

1. **Always handle errors** - Check the `success` field in responses
2. **Use HTTPS** in production
3. **Store tokens securely** - Never expose tokens in client-side code
4. **Implement retry logic** for failed requests
5. **Validate input** on the client side before sending requests
6. **Use pagination** for list endpoints to improve performance

## Support

For issues or questions:
- GitHub: [github.com/linkerly/api](https://github.com/linkerly/api)
- Email: support@linkerly.it
- Documentation: [docs.linkerly.it](https://docs.linkerly.it)

## Changelog

### Version 1.0.0 (Current)
- Initial API release
- User authentication
- URL shortening
- Collections management
- Bookmarks feature
- Public profiles
- Analytics tracking
