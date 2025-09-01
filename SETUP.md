# RCC Kit Sales App - React Native Frontend

A React Native mobile application for managing RCC Kit sales orders, built with Expo and styled using NativeWind (Tailwind CSS).

## Features

- **Black and Yellow Theme**: Professional black and yellow color scheme
- **Navigation Drawer**: Easy navigation between different sections
- **Create Sales Orders**: Form to create new enquiries with all necessary fields
- **Orders Tracker**: View and search through confirmed orders
- **Backend Integration**: Connected to Django REST API
- **Responsive Design**: Works on both iOS and Android devices

## Tech Stack

- React Native with Expo
- TypeScript
- NativeWind (Tailwind CSS for React Native)
- React Navigation (Drawer Navigation)
- Axios for API calls
- AsyncStorage for local data storage

## Project Structure

```
rcckit_sales_frontend/
├── app/                          # Screens using Expo Router
│   ├── _layout.tsx              # Root layout with drawer navigation
│   ├── index.tsx                # Home screen
│   ├── create-enquiry.tsx       # Create sales order form
│   └── confirmed-orders.tsx     # Orders tracker
├── components/                   # Reusable components (if needed)
├── services/                    # API services
│   └── api.ts                   # Axios configuration and API functions
├── config/                      # Configuration files
│   └── env.ts                   # Environment variables
├── assets/                      # Images, icons, fonts
├── global.css                   # Global Tailwind CSS imports
└── tailwind.config.js          # Tailwind configuration with custom theme
```

## Setup Instructions

### Prerequisites

1. Node.js (v16 or newer)
2. npm or yarn
3. Expo CLI: `npm install -g @expo/cli`
4. Your Django backend should be running

### Installation

1. Navigate to the project directory:
   ```bash
   cd rcckit_sales_frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Update the API configuration:
   - Open `config/env.ts`
   - Update `API_BASE_URL` with your Django backend URL
   - For development, ensure your Django server is running on `http://127.0.0.1:8000`

### Running the App

1. Start the Expo development server:
   ```bash
   npm start
   ```

2. Run on specific platform:
   ```bash
   npm run android  # For Android
   npm run ios      # For iOS
   npm run web      # For Web
   ```

3. For physical device testing:
   - Install Expo Go app from App Store/Play Store
   - Scan the QR code displayed in terminal

## Backend Configuration

Make sure your Django backend is properly configured:

1. **CORS Settings**: Add your mobile app's origin to CORS allowed origins
2. **API Endpoints**: Ensure all required endpoints are available:
   - `GET /api/enquiry/` - List all enquiries
   - `POST /api/enquiry/` - Create new enquiry
   - `GET /api/enquiry/{id}/` - Get specific enquiry
   - `POST /api/login/` - User authentication
   - `POST /api/token/refresh/` - Token refresh

3. **Authentication**: The app uses JWT tokens for authentication

## Key Features Implemented

### 1. Navigation Drawer
- Black background with yellow accents
- Company logo and name
- Menu items: Home, Create Sales Order, Orders Tracker, Logout
- Consistent across all screens

### 2. Home Screen
- Welcome dashboard with feature overview
- Black and yellow themed cards
- Quick access to main features

### 3. Create Sales Order
- Comprehensive form matching your Vue.js web app
- Customer type selection (New/Old)
- Existing client dropdown for returning customers
- Kit quantity table with 8 different kit types
- Form validation and loading states
- API integration for creating orders

### 4. Orders Tracker
- List of all confirmed orders
- Search functionality by client name or project ID
- Refresh to pull latest data
- Detailed order information display
- Status badges for payment and production status

### 5. API Integration
- Complete REST API integration
- JWT token management with automatic refresh
- Error handling and user feedback
- AsyncStorage for token persistence

## Customization

### Theme Colors
The app uses a custom color palette defined in `tailwind.config.js`:

- **Primary (Black)**: Various shades from `#000000` to light grays
- **Secondary (Yellow)**: `#FAD90E` with complementary shades

### Adding New Screens
1. Create new file in `app/` directory
2. Add route to drawer navigation in `app/_layout.tsx`
3. Update drawer content with new menu item

### API Endpoints
Add new API functions in `services/api.ts`:

```typescript
export const newAPI = {
  getData: async () => {
    const response = await api.get('new-endpoint/');
    return response.data;
  },
};
```

## Troubleshooting

### Common Issues

1. **Metro bundler issues**:
   ```bash
   npx expo start --clear
   ```

2. **API connection problems**:
   - Check if Django backend is running
   - Verify API_BASE_URL in config/env.ts
   - Check device/emulator network connectivity

3. **Build issues**:
   ```bash
   rm -rf node_modules
   npm install
   ```

### Network Configuration
- For Android emulator: Use `http://10.0.2.2:8000/api/`
- For iOS simulator: Use `http://127.0.0.1:8000/api/`
- For physical device: Use your computer's IP address

## Deployment

### Building for Production

1. **Android APK**:
   ```bash
   expo build:android
   ```

2. **iOS IPA**:
   ```bash
   expo build:ios
   ```

3. **Using EAS Build** (Recommended):
   ```bash
   npm install -g @expo/eas-cli
   eas build --platform android
   eas build --platform ios
   ```

## Contributing

1. Follow the existing code structure
2. Use TypeScript for type safety
3. Maintain the black and yellow theme consistency
4. Add proper error handling for all API calls
5. Test on both iOS and Android platforms

## Support

For issues related to:
- **Frontend**: Check React Native and Expo documentation
- **Backend**: Ensure Django REST API is properly configured
- **Styling**: Refer to NativeWind/Tailwind CSS documentation