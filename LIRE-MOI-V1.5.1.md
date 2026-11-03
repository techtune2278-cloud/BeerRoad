# Beer Road V1.5.1

## Installation depuis V1.5.0

1. Arrêter le serveur local. Extraire cette archive dans le dossier existant C:\Techtune\Devt\Beer Road en remplaçant les fichiers. Ne pas déplacer .git ni modifier .env.local.
2. Supabase > SQL Editor : exécuter le contenu de `supabase/recherche-v1.5.1.sql`. Cette étape est nécessaire à la recherche des contenus privés. Elle ajoute des fonctions sans modifier vos publications ni fichiers.
3. Dans CMD :

```cmd
cd /d "C:\Techtune\Devt\Beer Road"
npm ci
npm run build
```

Après réussite du build :

```cmd
git add -A
git commit -m "Beer Road V1.5.1 : recherche globale et titres des pas"
git push
```

## Changements

- Recherche dans tous les médias publiés : titre et description (tutos, livres, chansons, podcasts, films), toutes les contributions : titre, texte et rubrique, ainsi que l'agenda : titre, détails et lieu. Les noms et textes des univers et des applications restent recherchables.
- La recherche interroge la base, pas seulement la première page des contenus. Résultats paginés par 30, bouton Voir plus. Accès direct à la ressource avec lecteur/téléchargement ou au texte de la contribution.
- Deux caractères minimum pour les contenus privés, saisie limitée à 160 caractères. Mots combinés, accents et apostrophes pris en charge. Exemple : eau, couper eau, electricite.
- Protection contre les réponses périmées pendant la frappe. Les données privées ne sont recherchées que pour les membres autorisés, sans mise en cache persistante. Les ressources masquées sont exclues même pour l'administrateur. Les résultats disparaissent à la déconnexion.
- Sept étiquettes permanentes, numérotées, cliquables, reliées aux empreintes sur l'image, sur PC comme sur smartphone.
- Suppression de « nos codes » dans l'introduction.
- Suppression du bouton « Les paroles sur Drive » dans le Grenier seulement. Le lien des paroles de Beer Road reste dans la Bobine des origines.

La recherche porte sur les textes renseignés dans l'application, pas sur le texte à l'intérieur des PDF ni sur le son des films/podcasts. Pour un tuto intitulé « Arrivée », écrire dans sa description les mots utiles : « ouvrir l'eau, vanne, compteur, chauffage ». Il sera alors retrouvé avec ces mots.

## Atelier : quoi fournir ?

Pour CookiWiki, Frosti, Cellio et Mealio, deux liens facultatifs peuvent être renseignés dans Gérer les médias > Liens des applications de l'Atelier :

- Ouvrir : l'adresse HTTPS stable de production (Vercel ou domaine personnel), pas une adresse localhost ni une URL temporaire de preview.
- Télécharger : l'adresse HTTPS d'un fichier déjà hébergé (Drive avec les droits adaptés, release GitHub, etc.) ou d'une page de téléchargement.

Un ZIP du code source est destiné à une personne capable d'installer/démarrer le projet ; ce n'est pas un installateur pour la famille. Pour une application web, le lien en ligne suffit pour commencer. Si vous disposez d'une vraie version installable, utilisez son fichier ; sinon vous pouvez laisser le téléchargement vide. Beer Road n'ajoute pas de capacité d'installation aux applications liées.

Vous pouvez saisir ces liens vous-même, sans nouveau déploiement. Si vous souhaitez nous les transmettre : nom de l'application + URL de production + éventuel lien de téléchargement + nature du fichier (installateur ou sources).

## Vérifications

Tests applicatifs existants et nouveaux tests de recherche (réponse ancienne, pagination, ouverture, déconnexion), build de production TypeScript. Tests SQL en PostgreSQL local PGlite : eau dans un tuto et une contribution, description accentuée d'un podcast, agenda, recherche multi-mots, pagination, masquage et refus pour un non-membre. HTTP 200 de l'accueil, version et sept étiquettes vérifiées dans le HTML de production.

La migration n'a pas été exécutée dans votre Supabase et aucun test visuel sur votre smartphone n'a été effectué ici. Après déploiement et connexion : chercher un mot présent dans une description réelle, ouvrir le résultat, puis vérifier les étiquettes sur téléphone.
