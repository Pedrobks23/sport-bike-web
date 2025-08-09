# Sport & Bike Web

A management system for the Sport & Bike bicycle store built with React, Vite and Firebase. It provides tools for creating workshop orders, managing customers and services and issuing receipts with PDF generation.

## Features

- Protected admin area using Firebase Authentication
- Dashboard for tracking workshop orders
- CRUD screens for customers, services and receipts
- PDF export for orders and receipts

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file with your Firebase configuration and Cloudinary vars:
   ```bash
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_CLOUDINARY_UPLOAD_PRESET=your_unsigned_preset
   # optional token used to authorize deletions
   VITE_ADMIN_API_TOKEN=some_strong_token
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### Serverless environment variables (Vercel)

On Vercel (Production + Preview) define these additional variables:
```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=yyyyy
ADMIN_API_TOKEN=some_strong_token
```

## Building

To create a production build run:

```bash
npm run build
```

The app uses TailwindCSS for styling and jsPDF for generating PDFs.
