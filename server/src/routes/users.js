const express = require('express');
const router = express.Router();
const prisma = require('../db');

// --- ROUTE : GET ALL USERS ---
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les utilisateurs" });
  }
});

// --- ROUTES ADMIN : ADD USERS ---
router.post('/admin/add-user', async (req, res) => {
  const { login, campus, adminId } = req.body;
  
  const admin = await prisma.user.findUnique({ where: { id: parseInt(adminId) } });
  if (!admin || !admin.isAdmin) return res.status(403).json({ error: "ACCESS DENIED" });

  try {
    const newUser = await prisma.user.create({ data: { login, campus } });
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création" });
  }
});

// --- ROUTES ADMIN : DELETE USERS ---
router.delete('/admin/delete-user/:id', async (req, res) => {
  const { id } = req.params;
  const { adminId } = req.body;

  const admin = await prisma.user.findUnique({ where: { id: parseInt(adminId) } });
  if (!admin || !admin.isAdmin) return res.status(403).json({ error: "ACCESS DENIED !" });

  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

router.get('/:id/top-artists', async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!user?.spotifyToken) return res.status(400).json({ error: "Pas de token Spotify" });
  
    const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
      headers: { 'Authorization': `Bearer ${user.spotifyToken}` }
    });
    const data = await response.json();
    res.json(data.items);
});


router.get('/:id', async (req, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Utilisateur introuvable" });
    }
});

module.exports = router;