# Deployment

The subnet calculator is a static single-page application. It has no backend — everything runs in the browser. This makes deployment straightforward: build the app and serve the output files with any static file server.

## Build

```bash
npm run build
```

This outputs production-ready files to the `dist/` directory:

```
dist/
├── index.html
├── favicon.svg
└── assets/
    ├── index-[hash].css    (~22 KB, ~5 KB gzipped)
    └── index-[hash].js     (~215 KB, ~67 KB gzipped)
```

Total bundle size is under 100 KB gzipped.

## Hosting Options

### Static file server (Nginx, Apache)

Copy the `dist/` directory to your web server's document root.

**Nginx example:**

```nginx
server {
    listen 80;
    server_name subnet.internal.ahead.com;
    root /var/www/subnet-calculator/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively (they have content hashes in filenames)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Azure Static Web Apps

```bash
# Install the Azure CLI and SWA CLI
npm install -g @azure/static-web-apps-cli

# Build and deploy
npm run build
swa deploy ./dist --env production
```

Or configure in your Azure portal:
1. Create a new Static Web App resource.
2. Connect it to the GitHub repo.
3. Set the build configuration:
   - **App location:** `/`
   - **Output location:** `dist`
   - **Build command:** `npm run build`

### AWS S3 + CloudFront

```bash
# Build
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### GitHub Pages

Add to `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/subnet-calculator/',
  plugins: [react(), tailwindcss()],
})
```

Then build and deploy:

```bash
npm run build
npx gh-pages -d dist
```

### Docker

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t subnet-calculator .
docker run -p 8080:80 subnet-calculator
```

## Environment Variables

There are none. The app is fully static with no configuration needed at deploy time.

## HTTPS

The app works over both HTTP and HTTPS. No external API calls are made. If hosted internally, HTTPS is recommended but not required for functionality.

## Browser Support

The app uses modern JavaScript features:
- `crypto.randomUUID()` — supported in all modern browsers
- CSS `backdrop-filter` — supported in Chrome, Firefox, Safari, Edge
- ES2020+ syntax — transpiled by Vite for broad compatibility

Minimum browser versions: Chrome 92+, Firefox 90+, Safari 15+, Edge 92+.
