# OAuth Setup Guide - Google & GitHub Login

This guide will help you complete the OAuth integration for TweekChat, enabling users to log in with Google and GitHub.

## 📋 Prerequisites

The OAuth configuration is already set up in your backend! You just need to:
1. Get OAuth credentials from Google and GitHub
2. Update the User model (add 2 fields)
3. Update auth routes (add OAuth endpoints)
4. Initialize Passport in server.js

---

## Step 1: Get Google OAuth Credentials

### 1.1 Go to Google Cloud Console
- Visit: https://console.cloud.google.com/
- Create a new project or select an existing one

### 1.2 Enable Google+ API
- Go to "APIs & Services" > "Library"
- Search for "Google+ API"
- Click "Enable"

### 1.3 Create OAuth Credentials
- Go to "APIs & Services" > "Credentials"
- Click "+ CREATE CREDENTIALS" > "OAuth client ID"
- Application type: "Web application"
- Name: "TweekChat"

### 1.4 Set Authorized Redirect URIs
```
http://localhost:5000/api/auth/google/callback
http://localhost:3000/auth/google/callback
```
(Add production URLs later)

### 1.5 Get Your Credentials
- Copy the **Client ID**
- Copy the **Client Secret**
- Save these in your `.env` file

---

## Step 2: Get GitHub OAuth Credentials

### 2.1 Go to GitHub Developer Settings
- Visit: https://github.com/settings/developers
- Click "New OAuth App"

### 2.2 Fill in Application Details
- **Application name:** TweekChat
- **Homepage URL:** http://localhost:3000
- **Authorization callback URL:** http://localhost:5000/api/auth/github/callback

### 2.3 Get Your Credentials
- Copy the **Client ID**
- Click "Generate a new client secret"
- Copy the **Client Secret**
- Save these in your `.env` file

---

## Step 3: Update User Model

### Add OAuth fields to `models/User.js`

Add these fields to your User schema (around line 50, after the password field):

```javascript
// OAuth fields
googleId: {
  type: String,
  unique: true,
  sparse: true,  // Allows null values to be non-unique
},
githubId: {
  type: String,
  unique: true,
  sparse: true,
},
```

**That's it for the model!** Just 2 fields.

---

## Step 4: Update Auth Routes

### Add OAuth endpoints to `routes/auth.js`

Add this code at the end of `routes/auth.js` (before module.exports):

```javascript
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Google OAuth
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  }
);

// GitHub OAuth
router.get('/github',
  passport.authenticate('github', { 
    scope: ['user:email'] 
  })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id }, 
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  }
);
```

---

## Step 5: Initialize Passport in server.js

### Add these lines to `server.js`

Add after the body parser middleware (around line 30):

```javascript
const session = require('express-session');
const passport = require('./config/passport');

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
```

---

## Step 6: Install OAuth Packages

### Update package.json

Add these dependencies to your `backend/package.json`:

```json
"passport": "^0.7.0",
"passport-google-oauth20": "^2.0.0",
"passport-github2": "^0.1.12",
"express-session": "^1.17.3"
```

Then run:
```bash
cd backend
npm install
```

---

## Step 7: Update .env File

### Create `.env` file from `.env.example`

```bash
cp .env.example .env
```

Then fill in your OAuth credentials:

```env
# OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret

GITHUB_CLIENT_ID=your_actual_github_client_id
GITHUB_CLIENT_SECRET=your_actual_github_client_secret

SESSION_SECRET=generate_a_random_string_here
```

### Generate a random SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step 8: Test OAuth Flow

### Start your backend:
```bash
cd backend
npm start
```

### Test Google OAuth:
1. Open browser: `http://localhost:5000/api/auth/google`
2. You should be redirected to Google login
3. After login, you'll be redirected back with a token

### Test GitHub OAuth:
1. Open browser: `http://localhost:5000/api/auth/github`
2. You should be redirected to GitHub login
3. After login, you'll be redirected back with a token

---

## ✅ OAuth Setup Complete!

### What You Get:
- Users can sign up/login with Google
- Users can sign up/login with GitHub
- Automatic account linking if email exists
- Secure session management
- JWT tokens for authentication

### Frontend Integration:

In your React frontend, add buttons:

```javascript
// Google Login Button
<button onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}>
  Login with Google
</button>

// GitHub Login Button
<button onClick={() => window.location.href = 'http://localhost:5000/api/auth/github'}>
  Login with GitHub
</button>

// Handle OAuth callback
// On /auth/success page, extract token from URL:
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
if (token) {
  localStorage.setItem('token', token);
  // Redirect to dashboard
}
```

---

## 🐛 Troubleshooting

### "Error: Unknown authentication strategy 'google'"
- Make sure passport is initialized in server.js
- Check that config/passport.js is properly imported

### "redirect_uri_mismatch"
- Check that callback URLs in Google/GitHub match exactly
- Include http:// or https:// prefix
- Don't add trailing slashes

### "User already exists"
- The system automatically links OAuth accounts to existing emails
- If email exists, it adds googleId/githubId to that user

---

## 🚀 Production Deployment

When deploying to production:

1. **Update OAuth Redirect URIs:**
   - Google Console: Add `https://yourdomain.com/api/auth/google/callback`
   - GitHub: Add `https://yourdomain.com/api/auth/github/callback`

2. **Update .env:**
   ```
   CLIENT_URL=https://yourdomain.com
   NODE_ENV=production
   ```

3. **Enable HTTPS:**
   - OAuth requires HTTPS in production
   - Use services like Heroku, Vercel, or add SSL certificate

---

## 📚 Additional Resources

- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2
- **GitHub OAuth Docs:** https://docs.github.com/en/apps/oauth-apps/building-oauth-apps
- **Passport.js Docs:** https://www.passportjs.org/

---

**Your OAuth is 95% done! Just add the fields and routes above, and you're ready to go!** 🎉
