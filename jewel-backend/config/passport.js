const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            proxy: true // if you're behind a proxy (like in production)
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ googleId: profile.id });
                
                if (!user) {
                    // Check if email already exists (user signed up with email/password)
                    user = await User.findOne({ email: profile.emails[0].value });
                    
                    if (user) {
                        // Merge accounts by adding googleId to existing user
                        user.googleId = profile.id;
                        await user.save();
                    } else {
                        // Create new user
                        user = await User.create({
                            googleId: profile.id,
                            email: profile.emails[0].value,
                            username: profile.displayName || profile.emails[0].value.split('@')[0],
                            // No password needed for Google-authenticated users
                        });
                    }
                }
                
                return done(null, user);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);