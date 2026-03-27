import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import { Strategy as GitHubStrategy } from 'passport-github2';
import * as userModel from '../models/user.model.js';

// Serialize user vào session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user từ session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userModel.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Hàm quản lý logic đăng nhập chung cho OAuth giúp tuân thủ DRY.
 */
async function handleOAuthCallback(profile, provider, done) {
  try {
    // 1. Kiểm tra xem user đã tồn tại theo provider chưa
    let user = await userModel.findByOAuthProvider(provider, profile.id);
    
    if (user) {
      return done(null, user);
    }
    
    // 2. Kiểm tra email đã tồn tại chưa
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (email) {
      user = await userModel.findByEmail(email);
      if (user) {
        // Cập nhật OAuth provider cho user hiện có
        await userModel.addOAuthProvider(user.id, provider, profile.id);
        return done(null, user);
      }
    }
    
    // 3. Tạo user mới
    const newUser = await userModel.add({
      email: email || `${provider}_${profile.id}@oauth.local`,
      fullname: profile.displayName || profile.username || `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
      password_hash: null, // OAuth users không cần password
      address: '',         // OAuth users chưa có address
      role: 'bidder',
      email_verified: true, // OAuth users đã verify email
      oauth_provider: provider,
      oauth_id: profile.id
    });
    
    done(null, newUser);
  } catch (error) {
    done(error, null);
  }
}

// ===================== GOOGLE STRATEGY =====================
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3005/account/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
  handleOAuthCallback(profile, 'google', done);
}));

// ===================== FACEBOOK STRATEGY =====================
passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3005/account/auth/facebook/callback',
  profileFields: ['id', 'displayName', 'name', 'emails'],
  enableProof: true
}, (accessToken, refreshToken, profile, done) => {
  handleOAuthCallback(profile, 'facebook', done);
}));

// ===================== TWITTER STRATEGY =====================
// DISABLED: Twitter API requires paid subscription ($100/month) for OAuth
// Free tier does not support OAuth since February 2023
/*
passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.TWITTER_CALLBACK_URL || 'http://localhost:3005/account/auth/twitter/callback',
  includeEmail: true
}, (token, tokenSecret, profile, done) => {
  handleOAuthCallback(profile, 'twitter', done);
}));
*/

// ===================== GITHUB STRATEGY =====================
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3005/account/auth/github/callback'
}, (accessToken, refreshToken, profile, done) => {
  handleOAuthCallback(profile, 'github', done);
}));

export default passport;
