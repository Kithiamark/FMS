# FMS Web CDN & Edge Caching Architecture

This document describes the Content Delivery Network (CDN) and edge caching architecture engineered to maximize web performance, minimize Latency / Largest Contentful Paint (LCP), and deliver near-instantaneous page loads across Kenyan smallholder farming regions (2G, 3G, and 4G networks).

---

## 1. Core Architecture Overview

```
                      +------------------------------------------+
                      |         Anycast Edge CDN                 |
                      |   (Cloudflare / Fastly / CloudFront)     |
                      |   - Global & Nairobi Edge PoP (NBO)      |
                      |   - TLS 1.3 / HTTP/3 (QUIC)               |
                      |   - Brotli & Gzip Compression            |
                      +--------------------+---------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
            Cache HIT (92%+)                               Cache MISS
                    |                                             |
            +-------v--------+                            +-------v--------+
            |  Sub-25ms Edge |                            | Origin Ingress |
            |    Delivery    |                            |  Nginx Gateway |
            +----------------+                            +-------+--------+
                                                                  |
                                                          +-------v--------+
                                                          | Static Volume  |
                                                          |  /staticfiles  |
                                                          |  /media        |
                                                          +----------------+
```

---

## 2. Key Components Implemented

### A. Dynamic CDN Asset Prefixing (`frontend/vite.config.js`)
* **Base Asset URL**: Configured with `base: process.env.VITE_CDN_URL || '/'`.
  - In local development: Serves assets locally from root (`/`).
  - In production builds: Assets resolve directly to the CDN edge domain (e.g. `https://cdn.fms.co.ke/assets/...`).
* **Granular Rollup Vendor Chunking**:
  Assets are partitioned into long-lived cacheable bundles:
  - `vendor-react`: React, React-DOM, React-Router-DOM core runtime.
  - `vendor-charts`: Recharts charting engine (isolated from regular UI chunks).
  - `vendor-query`: TanStack React Query and Axios networking client.
  - `vendor-ui`: Lucide-React icons, `clsx`, and `tailwind-merge`.
  - `vendor-i18n`: i18next translation bundles.

### B. Nginx Edge & Client Caching Gateway (`backend/nginx/nginx.conf`)
* **Gzip Compression**: Activated for all text, stylesheet, JavaScript, JSON, SVG, and Woff2 formats with compression level 6.
* **1-Year Immutable Caching**: Static bundles under `/static/` include:
  ```nginx
  expires 365d;
  add_header Cache-Control "public, max-age=31536000, immutable";
  add_header Access-Control-Allow-Origin "*";
  add_header X-Content-Type-Options "nosniff";
  ```
* **Media Assets**: 30-day cache control with CORS headers enabled.

### C. PWA Offline CacheFirst Fallback (`vite-plugin-pwa`)
* **Workbox Rule**: CDN static assets (`.js`, `.css`, `.woff2`, `.png`, `.svg`) are cached using a `CacheFirst` strategy with a 1-year expiration policy.
* Repeat visits load immediately from the local device storage in under 50ms, even when completely offline in the farm paddock.

---

## 3. Cloudflare / Edge CDN Production Setup

### Step 1: DNS Configuration
Add a CNAME record pointing your CDN subdomain to your origin gateway:
* **Type**: `CNAME`
* **Name**: `cdn`
* **Target**: `origin.fms.co.ke` (or load balancer IP / AWS ALB)
* **Proxy Status**: `Proxied` (Orange Cloud enabled)

### Step 2: Edge Cache Rules
Create a Cloudflare Cache Rule for `cdn.fms.co.ke/*`:
1. **Edge Cache TTL**: `1 year` (Override origin)
2. **Browser Cache TTL**: `1 year`
3. **Cache Key**: Include Query String (ignoring marketing UTM parameters)
4. **Auto Minify**: HTML, CSS, JS enabled
5. **Brotli**: Enabled

### Step 3: Cache Invalidation on Deployment
Upon every frontend production release, purge the CDN edge cache via CI/CD:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
     -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
     -H "Content-Type: application/json" \
     --data '{"purge_everything":true}'
```
