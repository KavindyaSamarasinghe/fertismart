const User = require("../models/User");

exports.listUsers = async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const users = await User.find(filter).sort({ createdAt: -1 });
  res.json({ users });
};

exports.createStaffUser = async (req, res) => {
  try {
    const { name, email, password, role, assignedRegions } = req.body;
    if (!["officer", "admin"].includes(role)) {
      return res.status(400).json({ message: "role must be 'officer' or 'admin'" });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    const user = await User.create({ name, email, password, role, assignedRegions });
    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(400).json({ message: "Failed to create staff user", error: err.message });
  }
};

exports.setUserStatus = async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: { id: user._id, name: user.name, isActive: user.isActive } });
};
