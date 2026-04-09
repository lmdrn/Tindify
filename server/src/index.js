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

// --- ROUTES ---
app.get('/', (req, res) => {
  res.send('Bienvenue sur Tindify ! Regarde avec qui tu matches à 42 Lausanne basé sur tes goûts musicaux...');
});

app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Impossible de récupérer les utilisateurs" });
  }
});

app.post('/add-user', async (req, res) => {
  try {
    const newUser = await prisma.user.create({
      data: { pseudo: 'loana', campus: 'Lausanne' }
    });
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création de l'utilisateur" });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Tellement une badass meuf ! Serveur backend lancé avec succès sur le port ${PORT}`);
  console.log(`👉 Start making magic ici : http://localhost:${PORT}`);
});