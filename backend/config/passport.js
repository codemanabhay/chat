const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists, update last login
            user.lastSeen = new Date();
            user.isOnline = true;
            await user.save();
            return done(null, user);
          }

          // Check if email already exists
          const existingEmail = await User.findOne({
            email: profile.emails[0].value,
          });

          if (existingEmail) {
            // Link Google account to existing user
            existingEmail.googleId = profile.id;
            existingEmail.profilePicture = profile.photos[0]?.value || existingEmail.profilePicture;
            existingEmail.lastSeen = new Date();
            existingEmail.isOnline = true;
            await existingEmail.save();
            return done(null, existingEmail);
          }

          // Create new user
          const newUser = new User({
            googleId: profile.id,
            email: profile.emails[0].value,
            username: profile.emails[0].value.split('@')[0] + '_' + Date.now(),
            fullName: profile.displayName,
            profilePicture: profile.photos[0]?.value,
            isOnline: true,
          });

          await newUser.save();
          done(null, newUser);
        } catch (error) {
          console.error('Google OAuth error:', error);
          done(error, null);
        }
      }
    )
  );
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: '/api/auth/github/callback',
        scope: ['user:email'],
        proxy: true,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ githubId: profile.id });

          if (user) {
            // User exists, update last login
            user.lastSeen = new Date();
            user.isOnline = true;
            await user.save();
            return done(null, user);
          }

          // Get primary email
          const email = profile.emails?.[0]?.value || `${profile.username}@github.local`;

          // Check if email already exists
          const existingEmail = await User.findOne({ email });

          if (existingEmail) {
            // Link GitHub account to existing user
            existingEmail.githubId = profile.id;
            existingEmail.profilePicture = profile.photos[0]?.value || existingEmail.profilePicture;
            existingEmail.lastSeen = new Date();
            existingEmail.isOnline = true;
            await existingEmail.save();
            return done(null, existingEmail);
          }

          // Create new user
          const newUser = new User({
            githubId: profile.id,
            email,
            username: profile.username || profile.displayName.replace(/\s+/g, '_') + '_' + Date.now(),
            fullName: profile.displayName || profile.username,
            profilePicture: profile.photos[0]?.value,
            bio: profile._json.bio || '',
            website: profile._json.blog || '',
            isOnline: true,
          });

          await newUser.save();
          done(null, newUser);
        } catch (error) {
          console.error('GitHub OAuth error:', error);
          done(error, null);
        }
      }
    )
  );
}

module.exports = passport;
