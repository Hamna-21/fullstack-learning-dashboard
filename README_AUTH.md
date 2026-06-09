# JWT Authentication Integration

## Run
1. Create a `.env` file from `.env.example` and set `JWT_SECRET`.
2. Install dependencies: `npm install`
3. Start the app: `npm start`
4. Open `http://localhost:3000`

## API Flow
- `POST /api/auth/register` creates a user with a bcrypt-hashed password.
- `POST /api/auth/login` returns a JWT access token and user profile.
- `GET /api/auth/google` starts Google OAuth login.
- `GET /api/auth/google/callback` completes Google OAuth and redirects with JWT.
- `GET /api/auth/github` starts GitHub OAuth login.
- `GET /api/auth/github/callback` completes GitHub OAuth and redirects with JWT.
- `GET /api/auth/me` verifies the bearer token and returns the current user.
- `GET /api/dashboard` and `GET /api/profile` are protected routes.
- `POST /api/auth/logout` clears the client session.

## Frontend Storage
The browser stores the token in `localStorage` under `decodelabs_token` and sends it as `Authorization: Bearer <token>` on protected requests.

## Google + GitHub OAuth Setup
1. Create OAuth apps in Google Cloud and GitHub Developer Settings.
2. Add keys to `.env` using `.env.example` fields:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
3. Configure callback URLs exactly:
  - `http://localhost:3000/api/auth/google/callback`
  - `http://localhost:3000/api/auth/github/callback`
4. Restart server with `npm start`.
5. Use the Google/GitHub buttons on the auth page.

## Example Requests
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@example.com","password":"Password123"}'

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@example.com","password":"Password123"}'

curl http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```
