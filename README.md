# Linkerly  — Smart Link Management & Analytics Platform (Prototype)

Linkerly is a modern, full-featured **link management and analytics SaaS** designed for creators, marketers, startups, and businesses who rely on links to drive traffic, conversions, and growth.

In today’s digital world, links are shared everywhere — across social media, ads, emails, websites, and marketing campaigns. However, traditional links and basic URL shorteners fail to provide meaningful insights, control, and scalability.

Linkerly transforms links into **powerful, trackable, and manageable marketing assets**.

## Screenshots

This is how the application looks and works:

- Home Page (Create Collections and URLs)  
  ![Home Page](./Assets/Create%20Collection%20and%20URLs.png)

- URL Creation on Home  
  ![Create URL on Home](./Assets/Create%20URL%20on%20Home.png)

- Collection Creation  
  ![Collection Creation](./Assets/Create%20Collection%20on%20Home.png)

- Collection Preview  
  ![Collection Preview](./Assets/Collection%20Preview.png)

- Collections Page  
  ![Collections Page](./Assets/Collections%20Page.png)

- Create URL on URLs Page  
  ![Create URL on URLs Page](./Assets/Create%20URL%20on%20URLs%20Page.png)

- Creating Collection and Adding a URL  
  ![Add URL to Collection](./Assets/Home%20Create%20and%20Add%20URL%20to%20Collection.png)

- Added New URL to Collection  
  ![Added URL](./Assets/Added%20New%20URL%20to%20Collection.png)

- Bulk URL Creation  
  ![Bulk URL Creation](./Assets/Bulk%20URL%20Creation.png)

- Saved Collections by User  
  ![Saved Collections](./Assets/Saved%20Collections%20by%20User.png)

- URLs Page  
  ![URLs Page](./Assets/URLs%20Page.png)

- URLs Page After Bulk Creation  
  ![URLs Page After Bulk](./Assets/URLs%20Page%20after%20Bulk%20Creation.png)

- User Profile Settings  
  ![Profile Settings](./Assets/User%20Profile%20Settings.png)

- User Profile  
  ![User Profile](./Assets/User%20Profile.png)



## The Problem

Most teams today face serious limitations when working with links:

- Links are hard to track beyond basic click counts  
- There is no deep insight into user behavior, location, device, or traffic source  
- Changing or fixing broken links requires updating them everywhere  
- Campaign performance is difficult to measure accurately  
- Links are scattered across tools, documents, and platforms  
- There is no centralized system for link governance and analytics  

This results in:

- Poor attribution  
- Wasted ad spend  
- Broken or outdated links  
- No data-driven decision making  
- Loss of control over marketing assets  


## The Solution

Linkerly provides a **centralized, intelligent, and scalable platform** to:

- Create smart, branded short links  
- Track detailed real-time analytics  
- Manage, organize, and update links without breaking them  
- Run campaigns with proper attribution  
- Treat links as first-class growth and marketing assets  


## What is Linkerly?

Linkerly is a **URL shortening, link management, and analytics SaaS platform** that allows users to:

- Create clean and branded short URLs  
- Track every click with rich analytics  
- Edit destinations without changing the shared link  
- Organize links into collections and campaigns  
- Monitor performance across platforms, devices, and regions  
- Use links for serious marketing, not just redirection  


## Core Features

### 1. Smart Link Shortening

- Create short, clean, branded URLs  
- Custom aliases (example: yourbrand.com/launch)  
- Automatic unique link generation  
- Redirect to any destination URL  


### 2. Real-Time Analytics Dashboard

For every link, track:

- Total clicks  
- Unique visitors  
- Time-based traffic (hour, day, week, month)  
- Country, city, and region  
- Device type (mobile, desktop, tablet)  
- Browser and operating system  
- Referrer source (Instagram, Twitter, Ads, Direct, etc.)  


### 3. Editable Destination URLs

- Change the destination without changing the short link  
- Useful for:
  - Campaign updates  
  - Fixing broken links  
  - A/B testing landing pages  
  - Rotating offers and promotions  


### 4. Link Organization & Collections

- Group links into collections or campaigns  
- Search and filter links  
- Tag links for easy categorization  
- Archive or disable links anytime  


### 5. Link Expiry & Access Control

- Set expiration date and time for links  
- Automatically disable expired links  
- Enable or disable links manually  
- Optional access restrictions  

### 6. Branded Domains

- Use your own custom domain for links  
- Example: go.yourbrand.com/product  
- Improves trust, CTR, and brand recognition  


### 7. QR Code Generation

- Generate QR codes for every short link  
- Download and use for:
  - Posters  
  - Flyers  
  - Product packaging  
  - Offline marketing campaigns  


### 8. Campaign & Conversion Tracking

- Track which campaigns perform best  
- Compare performance across:
  - Platforms  
  - Influencers  
  - Ads  
  - Content pieces  
- Identify high-converting traffic sources  


### 9. Secure Authentication & User Accounts

- User accounts and dashboards  
- Private link management  
- Data isolation per user  
- Secure APIs and protected routes  


### 10. High-Performance Redirect System

- Extremely fast redirects  
- Low-latency performance  
- Designed to scale for high traffic  


## Who is it For?

- Content creators  
- Marketing teams  
- SaaS companies  
- Startups  
- Influencers  
- E-commerce brands  
- Agencies  
- Anyone who shares links seriously  


## Why Linkerly is Better Than Basic URL Shorteners

Unlike simple URL shorteners, Linkerly is:

- An analytics platform, not just a redirect tool  
- A link management system, not just a link generator  
- A marketing optimization platform, not just a utility  

## Use Cases

- Track Instagram bio and social media links  
- Measure ad campaign conversions  
- Manage affiliate links  
- Run influencer campaigns  
- Rotate landing pages without changing links  
- Centralize all company links in one dashboard  


## Tech Stack

- Next.js  
- Tailwind CSS  
- Node.js  
- Express  
- MongoDB  
- Mongoose  
- JWT Authentication  
- bcrypt Password Hashing  
- QR Code Generator  
- Analytics Engine  



## Usage

- Create a short URL  
- Share the short URL  
- Track analytics in the dashboard  
- Organize links into collections  
- Manage user profile and settings  

## Docker (Full Stack)

1. Copy the environment template and fill in secrets as needed:

```bash
cp .env.example .env
```

2. Build and start the stack:

```bash
docker compose up --build
```

This will start:

- Backend API on http://localhost:5000  
- Frontend on http://localhost:3000  
- MongoDB on localhost:27017  


## License

MIT License
