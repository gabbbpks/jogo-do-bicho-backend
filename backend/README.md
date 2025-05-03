
# Jogo do Bicho Backend

This is the backend API for the Jogo do Bicho application, built with Express.js and designed to be deployed on Vercel.

## Deployment Instructions

1. Create a Vercel account if you don't have one: https://vercel.com/signup
2. Install the Vercel CLI: `npm i -g vercel`
3. Login to Vercel: `vercel login`
4. Navigate to the backend directory: `cd backend`
5. Deploy to Vercel: `vercel`
6. Follow the interactive prompts
7. Once deployed, copy the production URL
8. Update the `baseURL` in `src/services/api.ts` with your Vercel deployment URL

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`

## Environment Variables

No environment variables are required for basic functionality as the app uses JSON files for storage.

## Available Endpoints

- Auth: `/auth/*`
- Users: `/usuarios/*`
- Bets: `/apostas/*`
- Results: `/resultados/*`
- Payments: `/pagamentos/*`
