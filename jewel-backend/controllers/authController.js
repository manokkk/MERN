const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
// const admin = require('firebase-admin');
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
const admin = require("../config/firebase");
const passport = require("passport");



const register = async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'User already exists' });
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create new user without profile picture
      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      });
  
      // Generate JWT token (30-day expiration)
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
  
      // Respond with user info and token
      res.status(201).json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
        token,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
// Login Controller
const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'User not found' });

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate JWT token (30-day expiration)
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        // Respond with user info and token
        res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,  // Ensure 'role' exists in your model
                profilePicture: user.profilePicture,
            },
            token,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const user = async (req, res) => {
    try {
        // Retrieve token directly from the request body
        const { token } = req.body;
        if (!token) return res.status(401).json({ message: 'No token provided' });

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user by ID and exclude the password
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Send user information
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.params.id;

        // Find the user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Update profile picture if provided
        let profilePicture = user.profilePicture;

        if (req.file) {
            // Convert buffer to base64 for Cloudinary
            const base64File = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

            // Delete old image if exists
            if (profilePicture?.public_id) {
                await cloudinary.uploader.destroy(profilePicture.public_id);
            }

            // Upload new image
            const result = await cloudinary.uploader.upload(base64File, {
                folder: "profile",
                width: 150,
                crop: "scale",
            });

            profilePicture = { public_id: result.public_id, url: result.secure_url };
        }

        // Update user fields
        user.username = username || user.username;
        user.email = email || user.email;
        user.profilePicture = profilePicture;

        // Save updated user
        await user.save();

        res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("❌ Error during user profile update:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// passport.use(
//     new GoogleStrategy(
//       {
//         clientID: process.env.GOOGLE_CLIENT_ID,
//         clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//         callbackURL: "/api/auth/google/callback",
//       },
//       async (accessToken, refreshToken, profile, done) => {
//         try {
//           let user = await User.findOne({ email: profile.emails[0].value });
  
//           if (!user) {
//             user = await User.create({
//               username: profile.displayName,
//               email: profile.emails[0].value,
//               profilePicture: {
//                 url: profile.photos[0].value,
//               },
//               provider: "google",
//             });
//           }
  
//           const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
//           done(null, { user, token });
//         } catch (error) {
//           done(error, null);
//         }
//       }
//     )
//   );
  
//   // Facebook OAuth Strategy
//   passport.use(
//     new FacebookStrategy(
//       {
//         clientID: process.env.FACEBOOK_APP_ID,
//         clientSecret: process.env.FACEBOOK_APP_SECRET,
//         callbackURL: "/api/auth/facebook/callback",
//         profileFields: ["id", "displayName", "email", "photos"],
//       },
//       async (accessToken, refreshToken, profile, done) => {
//         try {
//             const email = profile.emails?.[0]?.value || `${profile.id}@facebook.com`;
//             let user = await User.findOne({ email });
            
  
//           if (!user) {
//             user = await User.create({
//               username: profile.displayName,
//               email: profile.emails?.[0]?.value,
//               profilePicture: {
//                 url: profile.photos[0].value,
//               },
//               provider: "facebook",
//             });
//           }
  
//           const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
//           done(null, { user, token });
//         } catch (error) {
//           done(error, null);
//         }
//       }
//     )
//   );



module.exports = { register, login, user, updateProfile};
