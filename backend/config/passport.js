const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

function configurePassport() {
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      'google',
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:
            process.env.GOOGLE_CALLBACK_URL ||
            `http://localhost:${process.env.PORT || 3000}/api/auth/google/callback`
        },
        function (_accessToken, _refreshToken, profile, done) {
          done(null, { provider: 'google', profile: profile });
        }
      )
    );
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(
      'github',
      new GitHubStrategy(
        {
          clientID: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
          callbackURL:
            process.env.GITHUB_CALLBACK_URL ||
            `http://localhost:${process.env.PORT || 3000}/api/auth/github/callback`,
          scope: ['user:email']
        },
        function (_accessToken, _refreshToken, profile, done) {
          done(null, { provider: 'github', profile: profile });
        }
      )
    );
  }
}

module.exports = {
  configurePassport
};
