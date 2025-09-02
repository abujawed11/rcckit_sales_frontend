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

## How it works

The app uses a centralized configuration system:

1. **Environment Variables** (`.env` file) - Contains the actual configuration values
2. **ENV Configuration** (`config/env.ts`) - Reads from environment variables with fallbacks
3. **API Configuration** (`config/api.ts`) - Provides centralized API configuration and helper functions
4. **Service Layer** (`services/api.ts`) - Uses the configuration for all API calls

## Usage in Code

```typescript
// Using ENV configuration
import { ENV } from '@/config/env';
console.log(ENV.API_BASE_URL);

// Using API configuration helpers
import { getApiUrl, API_CONFIG } from '@/config/api';
const loginUrl = getApiUrl(API_CONFIG.ENDPOINTS.LOGIN);
```

## Important Notes

- Never commit the `.env` file to version control
- Use `.env.example` to document required environment variables
- The `EXPO_PUBLIC_` prefix makes variables available in the client-side code
- Always provide fallback values in the configuration files