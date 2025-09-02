# Environment Configuration

This project uses environment variables to manage configuration across different environments (development, staging, production).

## Setup Instructions

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the environment variables:**
   - Open `.env` file
   - Update `EXPO_PUBLIC_API_BASE_URL` with your actual backend API URL

## Environment Variables

### `EXPO_PUBLIC_API_BASE_URL`
The base URL for your Django backend API.

**Examples:**
- Production: `https://rcckitportal.sun-rack.com/api/`
- Development (Android Emulator): `http://10.0.2.2:8000/api/`
- Development (iOS Simulator): `http://127.0.0.1:8000/api/`
- Development (Physical Device): `http://YOUR_COMPUTER_IP:8000/api/`

## Centralized API Configuration

The app uses a **single, centralized API configuration system** located in `services/api.ts`:

### Features:
1. **Environment Variables** (`.env` file) - Contains the actual configuration values
2. **API Configuration** - Centralized config with all endpoints and settings
3. **Axios Instance** - Pre-configured with interceptors for authentication
4. **API Functions** - Ready-to-use functions for all backend operations
5. **Utility Functions** - Helper functions for authentication and data management

### Usage in Code

```typescript
// Import from the centralized API service
import { API_CONFIG, getApiUrl, enquiryAPI, authAPI } from '@/services/api';

// Using configuration
console.log(API_CONFIG.BASE_URL);
const loginUrl = getApiUrl(API_CONFIG.ENDPOINTS.LOGIN);

// Using API functions
const enquiries = await enquiryAPI.getAll();
const loginResult = await authAPI.login(username, password);
```

### Available API Functions:
- **authAPI** - Login, logout, register
- **enquiryAPI** - CRUD operations for enquiries
- **orderAPI** - Order management
- **kitAPI** - Kit information
- **clientAPI** - Client data
- **locationAPI** - Location data

## Important Notes

- **All API configuration is in one place**: `services/api.ts`
- Never commit the `.env` file to version control
- Use `.env.example` to document required environment variables
- The `EXPO_PUBLIC_` prefix makes variables available in the client-side code
- All API calls automatically include authentication headers
- Token refresh is handled automatically