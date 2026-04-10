const express = require('express');
const router = express.Router();
const prisma = require('../db');

const UID_SPOTI = process.env.UID_SPOTI;
const SECRET_SPOTI = process.env.SECRET_SPOTI;
const REDIRECT_URI_SPOTI = process.env.REDIRECT_URI_SPOTI;

router.get('/spotify', (req, res) => {
  const userId = req.query.userId;
  const scope = 'user-read-private user-top-read';
  
  const url = `https://accounts.spotify.com/authorize?client_id=${UID_SPOTI}&response_type=code&redirect_uri=${REDIRECT_URI_SPOTI}&scope=${scope}&state=${userId}`;
  
  res.redirect(url);
});

router.get('/spotify/callback', async (req, res) => {
  const { code, state: userId } = req.query;
  try {
    const authHeader = 'Basic ' + Buffer.from(UID_SPOTI + ':' + SECRET_SPOTI).toString('base64');
    
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': authHeader },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI_SPOTI })
    });
    const tokenData = await tokenResponse.json();
    
    const spotifyRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const spotifyData = await spotifyRes.json();

    if (userId && userId !== 'null') {
        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { 
              spotifyId: spotifyData.id,
              spotifyToken: tokenData.access_token
            }
        });
    }
    res.redirect('http://localhost:5173');
} catch (error) {
    console.error("Erreur Spotify callback:", error);
    res.status(500).send("Erreur Spotify");
  }
});

module.exports = router;