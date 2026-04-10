require('dotenv').config();
const express = require('express');
const cors = require('cors');

const auth42Routes = require('./routes/auth42');
const authSpotifyRoutes = require('./routes/authspotify'); 
const usersRoutes = require('./routes/users');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', auth42Routes);
app.use('/auth', authSpotifyRoutes);
app.use('/users', usersRoutes);     

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur opérationnel sur le port ${PORT}`);
});