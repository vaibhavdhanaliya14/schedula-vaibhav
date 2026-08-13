# Backend deployment guide

## Recommended platform

- Render
- Railway
- Any Node.js hosting platform with PostgreSQL support

## Required environment variables

- PORT
- JWT_SECRET
- DATABASE_URL

## Production database

Use a hosted PostgreSQL database such as:

- Neon PostgreSQL
- Supabase PostgreSQL
- Railway PostgreSQL

## Render setup

1. Push this branch to GitHub.
2. Create a new Render Web Service from the repository.
3. Choose the Node runtime.
4. Set build command: `npm install && npm run build`
5. Set start command: `npm run start:prod`
6. Add environment variables in Render:
   - NODE_ENV=production
   - PORT=3000
   - JWT_SECRET=<your-secret>
   - DATABASE_URL=<postgres-url>
7. Create or connect a production PostgreSQL instance.
8. Deploy the service and test the public URL.

## Notes

- The app listens on `0.0.0.0` and honors the `PORT` environment variable.
- TypeORM is configured to work with both local DB vars and a hosted `DATABASE_URL`.
- CORS is enabled for deployment-friendly API access.
