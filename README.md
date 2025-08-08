<!-- Atualização: inclui instrução de deploy de índices -->
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
2. Create a `.env.local` file with your Firebase configuration:
   ```bash
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Building

To create a production build run:

```bash
npm run build
```

The app uses TailwindCSS for styling and jsPDF for generating PDFs.

## Firestore Indexes

After pulling changes run:

```bash
firebase deploy --only firestore:indexes
```
