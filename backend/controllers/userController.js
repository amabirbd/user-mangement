const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const prisma = require("../../prisma");

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
    res.status(500).json({ message: "Error creating user" });
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

// // Generate JWT
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, {
//     expiresIn: "30d",
//   });
// };

module.exports = {
  createUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  signUp,
  signIn,
};
