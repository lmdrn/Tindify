const express = require('express');
const router = express.Router();
const prisma = require('../db');

const UID = process.env.UID_42;
const SECRET = process.env.SECRET_42;
const REDIRECT_URI = process.env.REDIRECT_URI_42;

router.get('/42', (req, res) => {
  const url = `https://api.intra.42.fr/oauth/authorize?client_id=${UID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  res.redirect(url);
});

router.get('/42/callback', async (req, res) => {
  const code = req.query.code;
  try {
    const tokenResponse = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: UID,
        client_secret: SECRET,
        code: code,
        redirect_uri: REDIRECT_URI
      })
    });
    const tokenData = await tokenResponse.json();
    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    const userData = await userResponse.json();
    
    let user = await prisma.user.findFirst({ where: { login: userData.login } });
    if (!user) {
      const isMe = (userData.login === process.env.ADMIN_LOGIN);
      user = await prisma.user.create({
        data: { login: userData.login, campus: userData.campus[0]?.name, isAdmin: isMe }
      });
    }
    res.redirect(`http://localhost:5173?userId=${user.id}`);
  } catch (error) {
    res.status(500).send("Erreur Auth 42");
  }
});

module.exports = router;