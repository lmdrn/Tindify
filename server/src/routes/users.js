const express = require('express');
const router = express.Router();
const prisma = require('../db');
const jwt = require('jsonwebtoken');
const { decrypt } = require('../crypto');

// --- MIDDLEWARE ---
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Non authentifié" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide" });
  }
};

// --- GET ALL USERS ---
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les utilisateurs" });
  }
});

// --- GET CURRENT USER ---
router.get('/me', authMiddleware, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  res.json(user);
});

// --- ADMIN : ADD USER ---
router.post('/admin/add-user', authMiddleware, async (req, res) => {
  const { login, campus } = req.body;
  const admin = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!admin || !admin.isAdmin) return res.status(403).json({ error: "ACCESS DENIED" });
  try {
    const newUser = await prisma.user.create({ data: { login, campus } });
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création" });
  }
});

// --- ADMIN : DELETE USER ---
router.delete('/admin/delete-user/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const admin = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!admin || !admin.isAdmin) return res.status(403).json({ error: "ACCESS DENIED !" });
  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// --- TOP ARTISTS ---
router.get('/:id/top-artists', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
  if (!user?.spotifyToken) return res.status(400).json({ error: "Pas de token Spotify" });
  const decryptedToken = decrypt(user.spotifyToken);
  const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
    headers: { 'Authorization': `Bearer ${decryptedToken}` }
  });
  const data = await response.json();
  res.json(data.items);
});

// --- GET USER BY ID ---
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Utilisateur introuvable" });
  }
});

module.exports = router;