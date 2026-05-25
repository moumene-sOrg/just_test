const express = require('express');
const router = express.Router();
const {
  logDemands,
  login,
  registerUser,
  userRole,
  insertUser,
  uploadFields
} = require('./comenUtile');
const { authenticate } = require('../../User-Dashbord/api/utiles');
const jwt = require("jsonwebtoken");
const prisma = require('../../db');
const { sendEmail } = require('../../utils/mailer');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_admin_key_123';

router.get('/getDemands', async (req, res) => {
  try {
    const data = await logDemands();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await login(email, password);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    const token = jwt.sign(
      { id: user.id, userId: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send login notification
    sendEmail(
      email,
      "New Login Detected",
      `Hello ${user.first_name || 'User'}, a new login was detected on your account at ${new Date().toLocaleString()}.`,
      `<h1>Security Alert</h1><p>Hello <b>${user.first_name || 'User'}</b>,</p><p>A new login was detected on your account at <b>${new Date().toLocaleString()}</b>.</p><p>If this wasn't you, please reset your password immediately.</p>`
    );

    res.json({
      message: "Login successful",
      token,
      role: user.role,
      user: { id: user.id, email: user.email, name: `${user.first_name} ${user.last_name}` }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/signup', async (req, res) => {
  const { email, pass_word, first_name, last_name, location } = req.body;
  try {
    const newUser = await registerUser(email, pass_word, first_name, last_name, location);
    const token = jwt.sign(
      { id: newUser.id, userId: newUser.id, role: 'normal', email: newUser.email },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send welcome email
    sendEmail(
      email,
      "Welcome to AdoptMe!",
      `Welcome ${first_name}, thank you for joining our community!`,
      `<h1>Welcome to AdoptMe!</h1><p>Hi <b>${first_name}</b>,</p><p>Thank you for joining our community. We're excited to have you on board!</p><p>Start exploring and find your perfect match today.</p>`
    );

    res.status(201).json({ message: "Basic user created", userId: newUser.id, token });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post('/signup/role', authenticate, async (req, res) => {
  const { role } = req.body;
  try {
    if (!req.userId) return res.status(400).json({ message: "No user in session" });

    await userRole(role, req.userId);
    res.status(200).json({ message: "Role saved successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post('/signup/userInfo', authenticate, uploadFields, async (req, res) => {
  const roleData = req.body;
  try {
    if (!req.userId) return res.status(400).json({ message: "No user in session" });

    const userRecord = await prisma.users.findUnique({ where: { id: req.userId } });
    if (!userRecord) return res.status(404).json({ message: "User not found" });
    const role = userRecord.role;

    if (req.files) {
      if (req.files.diplomat) {
        roleData.diplomat = req.files.diplomat[0].filename;
      }
      if (req.files.photo) {
        roleData.photo = req.files.photo[0].filename;
      }
      if (req.files.facility_photo) {
        roleData.facility_photo = req.files.facility_photo[0].filename;
      }
    }

    await insertUser(req.userId, role, roleData);
    res.status(201).json({ message: "User fully registered" });
  } catch (err) {
    res.status(500).json({ message: "Server error: " + err.message });
  }
});

// PASSORD RESET FLOW
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.users.findFirst({ where: { email } });
    if (!user) {
      // For security, don't reveal if user exists, but here the user wants it to work.
      return res.status(404).json({ message: "User not found" });
    }

    // Create a reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'reset' },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const resetLink = `http://localhost:3000/SignIn/ResetPassword.html?token=${resetToken}`;
    
    // Send reset link email
    sendEmail(
      email,
      "Password Reset Request",
      `Click the following link to reset your password: ${resetLink}. This link expires in 15 minutes.`,
      `<h1>Password Reset</h1><p>You requested a password reset. Click the button below to choose a new password:</p><a href="${resetLink}" style="padding: 10px 20px; background-color: #2563EB; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a><p>If you didn't request this, you can safely ignore this email.</p><p>Link expires in 15 minutes.</p>`
    );

    res.json({ message: "Reset link generated", resetLink });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'reset') {
      return res.status(400).json({ message: "Invalid token type" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.update({
      where: { id: decoded.userId },
      data: { pass_word: hashedPassword }
    });

    // Find the user to get their email
    const user = await prisma.users.findUnique({ where: { id: decoded.userId } });
    if(user) {
        sendEmail(
            user.email,
            "Password Reset Successful",
            "Your password has been successfully reset. If you did not perform this action, please contact support and secure your account.",
            "<h1>Password Reset Successful</h1><p>Your password has been successfully reset.</p><p>If you did not perform this action, please contact support immediately and secure your account.</p>"
        );
    }

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
});

module.exports = router;
