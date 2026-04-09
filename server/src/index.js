require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(cors()); 
app.use(express.json()); 

const UID = process.env.UID_42;
const SECRET = process.env.SECRET_42;
const REDIRECT_URI = 'http://localhost:3000/auth/42/callback';

// --- ROUTE : USERS ---
app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les utilisateurs" });
  }
});

// --- ROUTES : AUTH API 42 ---

app.get('/auth/42', (req, res) => {
  const url = `https://api.intra.42.fr/oauth/authorize?client_id=${UID}&redirect_uri=${REDIRECT_URI}&response_type=code`;
  res.redirect(url);
});

app.get('/auth/42/callback', async (req, res) => {
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
    
    if (!tokenResponse.ok) {
      return res.send("Le code a expiré ! Repars de ton site React (localhost:5173) et reclique sur le bouton.");
    }

    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://api.intra.42.fr/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const userData = await userResponse.json();
    const login = userData.login;
    const campus = userData.campus[0]?.name || 'Inconnu';

    let user = await prisma.user.findFirst({ where: { login: login } });

    // CREATION USER ADMIN
    if (!user) {
      const isMe = (login === process.env.ADMIN_LOGIN); 
      user = await prisma.user.create({
        data: { login: login, campus: campus, isAdmin: isMe }
      });
    }
    
    res.redirect(`http://localhost:5173?userId=${user.id}`);

  } catch (error) {
    console.error(error);
    res.send("Erreur lors de l'authentification avec 42");
  }
});

// --- ROUTES ADMIN ---

// Ajouter un user a la mano
app.post('/admin/add-user', async (req, res) => {
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

// Supprimer un user
app.delete('/admin/delete-user/:id', async (req, res) => {
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(` YEAAAAH ! Tellement une badass meuf ! Serveur running on port ${PORT}`);
});