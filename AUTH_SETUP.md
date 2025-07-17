# Authentication Setup Guide

AudioChat supports both Supabase and Firebase for authentication and data storage. This guide will help you set up authentication for your AudioChat application.

## Setting Up Authentication

### Option 1: Supabase Authentication

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Authentication → Settings → Auth Providers
4. Enable Email/Password authentication
5. Enable Google authentication:
   - Create a Google OAuth application in the [Google Cloud Console](https://console.cloud.google.com/)
   - Add the authorized redirect URI from Supabase
   - Copy the Client ID and Client Secret to Supabase
6. Get your Supabase URL and Anon Key from the API settings
7. Enter these credentials in the Database Configuration page in AudioChat

### Option 2: Firebase Authentication

1. Create a Firebase account at [firebase.google.com](https://firebase.google.com)
2. Create a new project
3. Add a web app to your project
4. Enable Authentication in the Firebase console
5. Enable Email/Password authentication
6. Enable Google authentication
7. Get your Firebase configuration from Project Settings → Your Apps → SDK setup and configuration
8. Enter these credentials in the Database Configuration page in AudioChat

## Using Authentication in AudioChat

Once you've set up authentication, you can:

1. Sign up with email and password
2. Sign in with email and password
3. Sign in with Google (recommended for simplicity)
4. Your authentication state will be preserved across sessions

## Troubleshooting

- If you encounter issues with Google authentication, make sure your OAuth configuration is correct
- For Supabase, ensure the redirect URI is properly set
- For Firebase, ensure the authorized domains include your app's domain
- Check the browser console for any authentication errors

## Security Notes

- API keys are stored locally in your browser's localStorage
- For production use, consider implementing additional security measures
- Never share your API keys or include them in public repositories