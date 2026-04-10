const express = require('express');
const router = express.Router();
const prisma = require('../db');
const jwt = require('jsonwebtoken');
const { decrypt } = require('../crypto');

// --- COMPATIBILITE ---
router.get('/:id/compatibility/:otherId', async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const otherId = parseInt(req.params.otherId);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const otherUser = await prisma.user.findUnique({ where: { id: otherId } });
      if (!user?.spotifyToken || !otherUser?.spotifyToken) {
        return res.status(400).json({ error: "Les deux users doivent avoir Spotify lié" });
      }

      const decryptedToken1 = decrypt(user.spotifyToken);
      const decryptedToken2 = decrypt(otherUser.spotifyToken);

      // Fetch top artistes des deux users
      const [res1, res2] = await Promise.all([
        fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
          headers: { 'Authorization': `Bearer ${decryptedToken1}` }
        }),
        fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
          headers: { 'Authorization': `Bearer ${decryptedToken2}` }
        })
      ]);
      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);
      const artists1 = data1.items || [];
      const artists2 = data2.items || [];

      // Artistes en commun
      const artistIds1 = new Set(artists1.map(a => a.id));
      const artistIds2 = new Set(artists2.map(a => a.id));
      const commonArtists = [...artistIds1].filter(id => artistIds2.has(id));
      const artistScore = (commonArtists.length / Math.max(artistIds1.size, artistIds2.size)) * 100;

      // Genres en commun
      const genres1 = new Set(artists1.flatMap(a => a.genres));
      const genres2 = new Set(artists2.flatMap(a => a.genres));
      const commonGenres = [...genres1].filter(g => genres2.has(g));
      const genreScore = (commonGenres.length / Math.max(genres1.size, genres2.size)) * 100;

      // Score final
      const finalScore = Math.round((artistScore * 0.5) + (genreScore * 0.5));

      res.json({
        score: finalScore,
        commonArtists: commonArtists.length,
        commonGenres: commonGenres.length,
        totalArtists: Math.max(artistIds1.size, artistIds2.size),
        totalGenres: Math.max(genres1.size, genres2.size)
      });
    } catch (error) {
      console.error("Erreur compatibilité:", error);
      res.status(500).json({ error: "Erreur lors du calcul de compatibilité" });
    }
  });

  module.exports = router;