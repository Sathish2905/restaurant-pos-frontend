# Restaurant POS System

A modern, production-ready Restaurant Point of Sale system built with Next.js 14, React, TypeScript, and Tailwind CSS.

## Features

### Authentication
- Role-based access control (Admin, Cashier, Kitchen Staff)
- Secure login system with session management
- Automatic routing based on user role

### POS Dashboard (Cashier)
- Intuitive menu grid with category filters
- Real-time search functionality
- Shopping cart with quantity controls
- Tax calculation and discount support
- Touch-friendly interface optimized for tablets
- Complete checkout flow

### Kitchen Display System
- Kanban-style order board (New, Preparing, Ready)
- Visual alerts for new orders
- One-click status updates
- Large, readable cards optimized for kitchen use
- Real-time order tracking

### Admin Dashboard
- Overview with key metrics and analytics
- Complete menu management (CRUD operations)
- Staff management with role assignment
- System settings and configuration
- Revenue and order tracking

### Design Features
- Light/Dark mode toggle
- Responsive layout (tablet & desktop)
- Modern, clean POS-style interface
- Emerald green primary color with orange accents
- Touch-optimized buttons and controls

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **State Management:** React Hooks & Context API
- **Icons:** Lucide React

## Demo Accounts

### Admin
- Email: admin@restaurant.com
- Password: admin123

### Cashier
- Email: cashier@restaurant.com
- Password: cashier123

### Kitchen Staff
- Email: kitchen@restaurant.com
- Password: kitchen123

## Project Structure

```
├── app/                      # Next.js app directory
│   ├── dashboard/           # Admin dashboard pages
│   │   ├── menu/           # Menu management
│   │   ├── staff/          # Staff management
│   │   └── settings/       # System settings
│   ├── pos/                # Cashier POS interface
│   ├── kitchen/            # Kitchen display system
│   └── login/              # Authentication page
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── pos/                # POS-specific components
│   ├── kitchen/            # Kitchen-specific components
│   ├── sidebar.tsx         # Navigation sidebar
│   ├── navbar.tsx          # Top navigation bar
│   └── theme-toggle.tsx    # Theme switcher
├── lib/                     # Utility functions
│   ├── mock-data.ts        # Mock data for development
│   ├── auth-context.tsx    # Authentication context
│   ├── theme-provider.tsx  # Theme management
│   └── utils.ts            # Helper functions
└── public/                  # Static assets
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

4. Login with one of the demo accounts above

## State & Data Management

The application currently uses mock data stored in `lib/mock-data.ts`. The architecture is designed to easily integrate with a real backend:

### To Add a Real Database:
1. Replace mock data with API calls in components
2. Update the authentication context to use a real auth service (e.g., Supabase Auth)
3. Implement WebSocket connections for real-time order updates in the Kitchen Display

### To Add WebSocket Support:
The kitchen display and POS are structured to easily integrate real-time updates:
- Add a WebSocket provider in `lib/websocket-context.tsx`
- Subscribe to order events in the Kitchen Display
- Emit order creation events from the POS checkout

## Customization

### Theme Colors
Edit the color tokens in `app/globals.css`:
- `--primary`: Main brand color (currently emerald green)
- `--accent`: Secondary color (currently orange)

### Tax Rate
Update the `TAX_RATE` constant in `components/pos/cart.tsx`

### Menu Categories
Modify `mockCategories` in `lib/mock-data.ts`

## Deployment

This app is optimized for deployment on Vercel:

```bash
npm run build
```

The application will be built and ready for production deployment.

## Future Enhancements

- [ ] Real database integration (Supabase/PostgreSQL)
- [ ] WebSocket support for real-time updates
- [ ] Receipt printing functionality
- [ ] Email receipt delivery
- [ ] Advanced reporting and analytics
- [ ] Inventory management
- [ ] Table management for dine-in orders
- [ ] Multiple payment methods
- [ ] Order history and search

## License

This is a demonstration project built with v0.
