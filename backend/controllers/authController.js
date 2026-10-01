const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    region: user.region,
    phone: user.phone,
  };
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, region, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "farmer",
      region: region || "Nuwara Eliya",
      phone,
    });

    const token = signToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "This account has been deactivated" });
    }

    const token = signToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

exports.getProfile = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

// ---------- Password reset ----------

exports.forgotPassword = async (req, res) => {
  // Same response whether or not the email exists, to prevent account enumeration
  const generic = {
    message: "If an account with that email exists, a reset link has been sent.",
  };

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) return res.json(generic);

    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const link = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password/${rawToken}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset your FertiSmart SL password",
        text: `Reset your password (valid for 15 minutes): ${link}`,
        html: `<p>Hi ${user.name},</p>
               <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
               <p><a href="${link}">Reset password</a></p>
               <p>If you didn't request this, you can ignore this email.</p>`,
      });
    } catch (mailErr) {
      // Don't leave a usable token behind if the email couldn't be sent
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error("[forgotPassword] email failed:", mailErr.message);
    }

    res.json(generic);
  } catch (err) {
    res.status(500).json({ message: "Could not process request", error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired" });
    }

    user.password = password; // pre-save hook hashes it
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: "Password updated. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Password reset failed", error: err.message });
  }
};