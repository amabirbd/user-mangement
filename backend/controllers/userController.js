const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const prisma = require("../../prisma");
const nodemailer = require("nodemailer");
const crypto = require('crypto');

const transporter = nodemailer.createTransport({
  // Specify your email service provider and authentication details
  service: "Gmail",
  auth: {
    user: `${process.env.MAILER_EMAIL}`,
    pass: `${process.env.MAILER_PASSWORD}`,
  },
});


const createUser = asyncHandler(async (req, res) => {
  // Check if the user making the request is authorized to create a new user
  if (req.user.role !== "Admin" && req.user.role !== "Support") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  console.log("user: ", req.user);

  try {
    const { name, email, password, role } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(20).toString("hex");

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        verificationToken
      },
    });

    //send verification mail to user
    const mailOptions = {
      from: "abir4u2011@gmail.com",
      to: user.email,
      subject: "Email Verification",
      html: `<p>Please click the following link to verify your email:</p>
             <p><a href="http://your-app.com/verify_email/${verificationToken}">Verify Email</a></p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending verification email: ", error);
      } else {
        console.log("Verification email sent: ", info.response);
      }
    });

    res.json(newUser);
  } catch (error) {
    res.status(500).json({ message: "Error creating user" });
  }
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  try {
    // Find the user by the verification token
    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the user's verification status in the database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    });

    res.json({ message: "User verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error verifying user" });
  }
});


const getAllUsers = asyncHandler(async (req, res) => {
  // Check if the user making the request is authorized to read all users
  if (req.user.role !== "Admin" && req.user.role !== "Support") {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving users" });
  }
});

const getSingleUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if the user making the request is authorized to read a user
  if (
    req.user.role !== "Admin" &&
    (req.user.role !== "Support" || req.user.id !== Number(id))
  ) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving user" });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if the user making the request is authorized to update users
  if (
    req.user.role !== "Admin" &&
    (req.user.role !== "Support" || req.user.id !== Number(id))
  ) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: req.body,
    });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Error updating user" });
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if the user making the request is authorized to delete users
  if (
    req.user.role !== "Admin" &&
    (req.user.role !== "Support" || req.user.id !== Number(id))
  ) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  try {
    await prisma.user.delete({
      where: { id: Number(id) },
    });
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting user" });
  }
});

const signUp = asyncHandler(async (req, res) => {
  console.log("user signup route called");
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    });

    res.json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error signing up" });
  }
});

const signIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check the password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate a token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    res.json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error signing in" });
  }
});

// const verification = asyncHandler(async (req, res) => {

// })

const reqResetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate a password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Update the user's password reset token and save it to the database
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { resetToken },
    });

    // Send password reset email to the user
    const mailOptions = {
      from: 'abir4u2011@gmail.com',
      to: user.email,
      subject: 'Password Reset',
      html: `<p>Please click the following link to reset your password:</p>
             <p><a href="http://your-app.com/reset-password/${resetToken}">Reset Password</a></p>`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending password reset email:', error);
        return res.status(500).json({ message: 'Error sending password reset email' });
      }
      console.log('Password reset email sent:', info.response);
      res.json({ message: 'Password reset email sent' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Find the user by the reset token
    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);


    // Update the user's password and clear the reset token
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        resetToken: null,
      },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error resetting password' });
  }
});


module.exports = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  signUp,
  signIn,
  reqResetPassword,
  resetPassword,
  verifyEmail
};
