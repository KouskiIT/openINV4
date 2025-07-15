# Système de Gestion d'Inventaire - Architecture Documentation

## Overview

This is a full-stack inventory management system (Système de Gestion d'Inventaire) built with modern web technologies. The application provides comprehensive inventory tracking with advanced features including barcode scanning, mobile optimization, Excel import/export, PDF generation, and real-time search capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Framework**: Radix UI with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Component Library**: Shadcn/ui components with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **File Upload**: Multer for handling Excel imports
- **API Design**: RESTful APIs with comprehensive error handling

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon serverless
- **Schema Management**: Drizzle ORM with TypeScript-first approach
- **Local Storage**: Browser localStorage for offline capabilities and auto-save
- **File Storage**: Memory-based for temporary file processing

## Key Components

### Database Schema
The system uses a single primary table `inventory_items` with the following structure:
- Unique identifiers: `code_barre` (barcode), `num_inventaire` (inventory number)
- Organizational fields: `departement`, `num_bureau`, `beneficiaire`
- Item details: `designation`, `quantite`, `condition`, `prix`, `categorie`
- Metadata: `date_ajouter`, `date_modification`, `custom_fields` (JSONB)

### Core Features
1. **Inventory Management**: Full CRUD operations with bulk actions
2. **Manual Barcode Search**: Text-based barcode search functionality
3. **Search & Filtering**: Advanced search with multiple filter criteria
4. **Import/Export**: Excel file processing with validation
5. **PDF Generation**: Custom PDF reports using jsPDF
6. **Mobile Optimization**: Responsive design with touch-friendly interface
7. **Offline Support**: Local storage with sync capabilities

### Security & Performance
- **Rate Limiting**: Express-rate-limit for API protection
- **Input Validation**: Zod schemas for type-safe validation
- **Error Handling**: Comprehensive error boundaries and logging
- **Performance**: Virtual scrolling for large datasets
- **Caching**: React Query for intelligent data caching

## Data Flow

### Read Operations
1. Client requests data via TanStack Query
2. Express server processes request with filters/pagination
3. Drizzle ORM queries PostgreSQL database
4. Data returned through type-safe interfaces
5. Client caches and displays data with optimistic updates

### Write Operations
1. Client submits data through validated forms
2. Server validates input using Zod schemas
3. Database operations executed with transaction support
4. Audit logging for change tracking
5. Cache invalidation and UI updates

### File Processing
1. Excel files uploaded via Multer
2. XLSX parsing with data validation
3. Batch processing with progress tracking
4. Database insertion with error handling
5. Results summary and error reporting

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/react-***: Accessible UI components
- **tailwindcss**: Utility-first CSS framework
- **zod**: Schema validation
- **jspdf**: PDF generation
- **xlsx**: Excel file processing

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **@testing-library/react**: Component testing
- **jest**: Testing framework

## Deployment Strategy

### Production Builds
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `drizzle-kit push`

### Platform Support
- **Railway**: Primary deployment platform (configured via railway.json)
- **Vercel**: Alternative deployment with custom routing (vercel.json)
- **Health Checks**: `/api/health` endpoint for monitoring

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment mode (development/production)
- **Build Commands**: `npm run build && npm start`

## Changelog

```
Changelog:
- July 04, 2025. Initial setup
- July 08, 2025. Removed tour guide system per user request
- July 08, 2025. Cleaned up project - removed unnecessary files for Replit deployment
- July 08, 2025. Completely removed gamification system from all components
- July 08, 2025. Enhanced navigation menu with premium design, color-coded icons, data count badges, and smooth animations
- July 08, 2025. Updated navigation layout to display text beside icons horizontally
- July 08, 2025. Added copyright footer with developer contact information
- July 14, 2025. Completely removed camera-based barcode scanning functionality per user request
- July 15, 2025. Removed disabled scanner button from interface per user request
- July 15, 2025. Re-added camera-based barcode scanner functionality with modern implementation
- July 15, 2025. Added animated success celebrations with confetti effects and sound for scanner
- July 15, 2025. Configured scanner to detect Code128 barcodes specifically with optimized settings
- July 15, 2025. Implemented advanced barcode type support with comprehensive validation for Code128, EAN, UPC formats
- July 15, 2025. Fixed Railway deployment issues - enhanced health check endpoint, improved nixpacks configuration, increased timeout to 300s
- July 15, 2025. CRITICAL: Fixed production build vite import error by properly externalizing vite dependencies in esbuild configuration
- July 15, 2025. Completed comprehensive Railway deployment testing - validated health check, database connectivity, build process, and API functionality
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```