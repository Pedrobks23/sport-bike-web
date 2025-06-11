# projeto whitelabel

Um sistema de gestão genérico para lojas de bicicleta, construído com React e Vite. Possibilita abrir ordens de serviço, gerenciar clientes e serviços e emitir recibos em PDF.

## Features

- Protected admin area with local authentication
- Dashboard for tracking workshop orders
- CRUD screens for customers, services and receipts
- PDF export for orders and receipts

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```

## Building

To create a production build run:

```bash
npm run build
```

The app uses TailwindCSS for styling and jsPDF for generating PDFs.
