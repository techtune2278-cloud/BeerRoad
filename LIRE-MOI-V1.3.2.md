# Beer Road V1.3.2 — validation du projet complet

## Installation sous Windows

Cette archive contient le projet complet. Décompresser dans un NOUVEAU dossier pour éviter de conserver les anciennes copies .tsx et les anciens fichiers générés. Copier votre .env.local depuis votre dossier actuel, sans le partager. Conserver le dossier actuel comme sauvegarde.

Dans le nouveau dossier :

```powershell
npm ci
npm run dev
```

La page affiche V1.3.2. Pour vérifier la production, arrêter le serveur de développement puis exécuter `npm run build` et `npm start`. Le service worker est activé uniquement en production.

## Changements

- Réactivation de la vérification TypeScript lors du build : les erreurs ne sont plus ignorées.
- Quatre anciennes copies inutilisées déplacées sous archives/, avec extension .txt pour les conserver sans les compiler. Le contenu éditorial actif reste dans src/data/beerRoadData.ts.
- Hors connexion, priorité à la dernière page mise en cache après une visite, avant la page précachée à l'installation.
- Exclusion explicite des requêtes portant un en-tête Authorization du cache PWA.
- Nouvelle version du cache et affichage V1.3.2.

## Vérifications effectuées

- Build de production complet avec TypeScript : réussi.
- 26 tests existants authentification/API/composants : réussis, avec Supabase simulé.
- 3 nouveaux tests service worker : réussis (page récente, replis hors ligne, exclusion des requêtes privées).
- Serveur de production : accueil HTTP 200 et version V1.3.2 présente dans le HTML.
- HTTP 200 pour manifest, service worker, page hors ligne, images principales, PDF, audio et trois icônes PWA.

## À vérifier sur votre appareil

Le navigateur automatisé n'a pas pu être installé dans l'environnement de vérification. L'affichage mobile, les interactions des sept univers et l'installation réelle de la PWA ne sont donc pas validés visuellement ici. Tester aussi une connexion familiale, une contribution et un rendez-vous avec votre configuration Supabase. Les accès Google Drive privés n'ont pas été testés. Aucun secret .env.local n'est inclus dans cette archive.
