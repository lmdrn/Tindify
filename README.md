# Tindify

Connecte ton compte 42 Lausanne et ton Spotify, passe un quiz qui se moque de tes goûts musicaux, découvre ton type amoureux et les personnes du campus avec qui tu as le plus de chances de finir.

SvelteKit (front et API dans une seule app), SQLite via Drizzle, Three.js pour la piscine et le coeur.

## Lancer en local

```sh
npm install
cp .env.example .env      # remplir les clés (voir plus bas)
npm run seed              # 150 faux profils pour voir le réseau et les matchs
npm run dev -- --host 127.0.0.1
```

Ouvrir http://127.0.0.1:5173.

Sans clés OAuth, `http://127.0.0.1:5173/dev/login` connecte en tant que faux profil (`?as=<login>` pour en choisir un). Cette route n'existe qu'en développement.

`npm run unseed` supprime les faux profils.

## Clés à configurer (`.env`)

| Variable | Où la trouver |
| --- | --- |
| `ORIGIN` | URL publique du site, sans `/` final. En local : `http://127.0.0.1:5173` |
| `ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `UID_42`, `SECRET_42` | intra 42 → Settings → API → nouvelle application. Redirect URI : `$ORIGIN/auth/42/callback` |
| `ALLOWED_CAMPUS` | `Lausanne` |
| `ADMIN_LOGIN` | ton login 42 |
| `UID_SPOTI`, `SECRET_SPOTI` | developer.spotify.com → Dashboard → Create app. Redirect URI : `$ORIGIN/auth/spotify/callback` |

Spotify refuse `localhost` comme redirect URI : utiliser `127.0.0.1` en local.

En mode développement, une app Spotify n'accepte que les comptes ajoutés à la main dans le Dashboard (User Management, 25 personnes max). Au-delà, il faut demander l'accès étendu à Spotify.

Les anciennes clés de la v1 ont été déplacées dans `.env.legacy` (non versionné). Les noms `UID_42`, `SECRET_42`, `UID_SPOTI`, `SECRET_SPOTI` sont les mêmes ; `ENCRYPTION_KEY` change de format (64 caractères hex) et les URI de redirection changent.

## Déployer (VM vod.42lausanne.ch)

Sur la VM, avec Docker installé et un nom de domaine qui pointe dessus :

```sh
git clone <repo> tindify && cd tindify
cp .env.example .env      # remplir, et ajouter DOMAIN=tindify.exemple.ch
docker compose up -d --build
```

Caddy obtient le certificat HTTPS tout seul. La base SQLite vit dans le volume `tindify-data` ; pour la sauvegarder :

```sh
docker compose exec app node -e "require('better-sqlite3')('/data/tindify.db').backup('/data/backup.db')"
docker compose cp app:/data/backup.db ./backup.db
```

## Organisation

```
src/
  lib/
    scene/pool.ts          piscine, coeur, skins et réseau (Three.js)
    i18n/                  tous les textes, FR et EN
    quiz.ts                réponse du quiz → type amoureux trahi
    types.ts               types amoureux, skins, finitions
    server/
      db/                  schéma SQLite (Drizzle) ; migrations dans /drizzle
      fortytwo.ts          OAuth 42 + filtre campus
      spotify.ts           OAuth Spotify, tokens chiffrés, import des tops
      music.ts             statistiques dérivées (mainstream, obsession, genre)
      matching.ts          compatibilité et réseau
      personality.ts       calcul du type et des jauges
      session.ts           sessions (cookie httpOnly, token haché en base)
  routes/
    /                      la piscine
    /quiz /resultat /matchs /moi
    /auth/42, /auth/spotify   OAuth
    /api/network           réseau (anonyme pour les visiteurs)
scripts/seed.ts            faux profils
```

Après un changement de `src/lib/server/db/schema.ts` : `npm run db:generate` crée la migration, appliquée automatiquement au démarrage.

## Sécurité

- Sessions : token aléatoire en cookie `httpOnly`, `SameSite=Lax`, `Secure` en production ; seule son empreinte SHA-256 est en base.
- Tokens Spotify chiffrés en AES-256-GCM.
- OAuth protégé par un `state` vérifié contre un cookie.
- CSP stricte (scripts du site uniquement, avec nonce), aucune ressource externe sauf les pochettes Spotify.
- Les visiteurs non connectés ne reçoivent que des identifiants anonymes pour le réseau.
- Accès réservé au campus de Lausanne (vérifié à chaque connexion 42).
- Suppression de compte complète depuis `/moi`.
