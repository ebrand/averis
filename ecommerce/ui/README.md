# E-commerce Frontend

A modern React 19 + TailwindCSS e-commerce application that integrates with the pricing-mdm API to provide region-specific catalogs and dynamic pricing.

## 🚀 Quick Start

```bash
npm install
npm run dev
```

The application will start on **http://localhost:3002**

## Features

### 🌐 Multi-Region Support
- **Default Region**: Americas (AMER) with English language
- **Planned**: France (EMEA) with French language support
- **Cookie-based Persistence**: User preferences saved across sessions
- **Automatic Detection**: Falls back to AMER/Direct for new visitors

### 🏪 Catalog Integration
- **Dynamic Catalog Loading**: Fetches default catalog based on user's region and channel
- **Real-time API Integration**: Connects to pricing-mdm API for catalog data
- **Fallback Logic**: Graceful handling when catalogs are unavailable

### 💰 Dynamic Pricing
- **Catalog-based Pricing**: Prices calculated from catalog metadata
- **Discount Support**: Automatic discount calculation and display
- **Multiple Currencies**: Support for USD, EUR, and other currencies
- **Price Formatting**: Locale-aware currency formatting

### 🛍️ Shopping Experience
- **Product Grid**: Responsive product display with pagination
- **Search Functionality**: Real-time product search
- **Product Details**: Rich product information with ratings and descriptions
- **Shopping Cart**: Add to cart functionality (UI ready)
- **Region Selector**: Easy switching between regions and channels

### 🎨 Modern UI/UX
- **TailwindCSS**: Modern, responsive design system
- **React 19**: Latest React features and performance
- **Heroicons**: Beautiful icon library
- **Loading States**: Proper loading and error handling
- **Mobile Responsive**: Works great on all device sizes

## Architecture

### Components Structure
```
src/
├── components/
│   ├── layout/
│   │   └── Header.jsx          # Main navigation with region selector
│   └── product/
│       └── ProductGrid.jsx     # Product listing and cards
├── contexts/
│   └── ShopContext.jsx         # Global state management
├── pages/
│   └── ShopPage.jsx           # Main shopping page
├── services/
│   └── catalogService.js      # API integration layer
└── utils/
    └── cookies.js             # Cookie management utilities
```

### State Management
- **ShopContext**: Centralized state using React's useReducer
- **Cookie Persistence**: User preferences saved in browser cookies
- **API Integration**: Seamless integration with pricing-mdm backend

### Key Services
- **catalogService**: Handles all catalog API calls
- **Cookie utilities**: Manages user preferences and session data
- **Price calculation**: Dynamic pricing based on catalog rules

## API Integration

The application integrates with the pricing-mdm API running on port 5001:

### Endpoints Used
- `GET /api/catalogs?region={region}` - Get catalogs by region
- `GET /api/catalogs/{id}/products` - Get products in catalog
- `GET /api/catalogs/regions` - Get available regions
- `GET /api/catalogs/channels` - Get available channels

### Data Flow
1. **Initialization**: Load user preferences from cookies
2. **Catalog Selection**: Fetch default catalog for user's region/channel
3. **Product Loading**: Load products from selected catalog
4. **Price Calculation**: Calculate final prices with discounts
5. **Region Switching**: Update catalog when user changes region

## Port Configuration

- **E-commerce Frontend**: http://localhost:3002
- **Product MDM**: http://localhost:3000  
- **Pricing MDM**: http://localhost:3001
- **Pricing MDM API**: http://localhost:5001

## Default Settings
- **Region**: AMER (Americas)
- **Channel**: DIRECT (Direct Sales)
- **Language**: English (en)
- **Currency**: USD

## User Experience

### First Visit
1. User lands on the site
2. System defaults to AMER/Direct
3. Default catalog is fetched automatically
4. Products are displayed with calculated prices
5. Preferences are saved in cookies

### Returning Visitors
1. Preferences loaded from cookies
2. Last selected region/channel restored
3. Appropriate catalog loaded
4. Seamless continuation of shopping experience

### Region Switching
1. User clicks region selector in header
2. Available regions displayed (US, France)
3. New region/channel selected
4. Catalog updated automatically
5. Products refreshed with new pricing
6. Preferences saved for future visits

## Development

### Prerequisites
- Node.js 18+ 
- pricing-mdm API running on port 5001
- Database with catalog and product data

### Scripts
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run preview # Preview production build
npm run lint    # Run ESLint
```

### Environment
The app uses Vite with proxy configuration to route `/api` calls to the pricing-mdm API.

## Tech Stack

- **React 19**: Latest React with new features
- **TailwindCSS 4**: Modern utility-first CSS framework
- **Vite**: Fast build tool and dev server
- **React Router**: Client-side routing
- **Heroicons**: Beautiful SVG icons
- **js-cookie**: Cookie management library

## Future Enhancements

- [ ] Shopping cart functionality
- [ ] User authentication
- [ ] Order management
- [ ] Wishlist support
- [ ] French language implementation
- [ ] Additional regions (APJ, LA)
- [ ] Advanced filtering and sorting
- [ ] Product recommendations
- [ ] Checkout process