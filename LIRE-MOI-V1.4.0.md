# Beer Road V1.4.0 — médiathèque et administration

## 1. Mettre à jour le dossier EXISTANT

Arrêter le serveur local (Ctrl+C). Extraire le contenu de cette archive directement dans :

C:\Techtune\Devt\Beer Road

Accepter le remplacement des fichiers. Ne pas créer un nouveau dossier de projet, ne pas déplacer .git et ne pas modifier .env.local. Cette archive est une mise à jour de V1.3.2, pas un projet indépendant.

## 2. Préparer Supabase (une seule fois)

Dans votre projet Supabase, ouvrir SQL Editor, créer une requête, copier tout le fichier `supabase/mediatheque-v1.4.0.sql`, puis Run. Ne pas relancer schema.sql : la migration utilise les membres existants.

Ensuite, exécuter cette requête en remplaçant l'adresse par votre adresse exacte de connexion à Beer Road, en minuscules :

```sql
insert into public.media_admins(email)
values ('votre-adresse@example.com')
on conflict do nothing;
```

Cette adresse doit déjà exister dans family_members. Pour retrouver les adresses autorisées :

```sql
select email, display_name from public.family_members order by display_name;
```

Aucun rôle administrateur n'est attribué automatiquement. Ne jamais mettre la clé service_role dans le navigateur ou les variables NEXT_PUBLIC.

## 3. Installer et déployer — commandes CMD

```cmd
cd /d "C:\Techtune\Devt\Beer Road"
npm ci
npm run build
```

Si le build réussit :

```cmd
git add -A
git commit -m "Beer Road V1.4.0 : mediatheque et administration"
git push
```

Vercel utilise le dépôt existant. Après déploiement, vérifier l'affichage V1.4.0. Pour un essai local : npm run dev.

## 4. Ajouter les deux livres et les douze podcasts

Se connecter avec le compte déclaré administrateur. Dans le carnet, sous la ligne Bonjour / Déconnexion, ouvrir « Gérer les médias ».

- Premier livre : emplacement « Lettres à mes filles », titre, fichier PDF, Publier.
- Second livre : emplacement « Lettres à mes gendres », titre, fichier PDF, Publier.
- Podcasts : emplacement « Les podcasts — 12 épisodes », titre de l'épisode, numéro de 1 à 12, fichier MP3, Publier. Répéter pour les 12 épisodes.

Chaque carte de « Les Mots qui restent » affiche automatiquement ses ressources. Les podcasts sont triés par numéro, avec un compteur X sur 12. Un emplacement de livre accepte un seul livre : utiliser Modifier pour le remplacer. Deux épisodes ne peuvent pas porter le même numéro, même s'ils sont masqués.

Les fichiers et les titres des 12 épisodes n'ont pas été inventés : ils restent à charger. Les boutons de contributions restent disponibles sous les ressources officielles.

Pour une nouvelle chanson : choisir l'univers (par exemple Le Grenier — musiques), Audio MP3, puis charger le fichier. Elle apparaît dans « La médiathèque » de cet univers.

## 5. Lecture et téléchargement

- Audio : lecteur intégré et bouton Télécharger.
- Film MP4 : lecteur intégré et bouton Télécharger.
- Livre PDF : lecteur PDF.js, pages précédente/suivante, zoom, ouverture en grand et téléchargement séparé. Les fichiers techniques PDF.js sont préparés automatiquement avant dev et build.
- Image : affichage dans la fiche et téléchargement.
- Film volumineux : choisir « Relier un fichier Google Drive » et coller son lien de partage (fichier précis, pas dossier). L'app construit le lecteur et le lien de téléchargement. Drive peut demander une connexion Google, une autorisation ou une confirmation avant le téléchargement. Le bouton « Ouvrir dans Drive » sert de repli.

Les fichiers chargés dans l'app sont limités à 50 Mo : PDF, MP3, MP4, JPEG, PNG, WebP. Pour des fichiers plus gros, utiliser Drive. Les films et musiques doivent utiliser des codecs compatibles avec les appareils de la famille.

## 6. Administrer

Modifier permet de changer le titre, la description, l'emplacement, l'ordre, la visibilité, le lien ou le fichier. Décocher « Visible pour la famille » masque la ressource. Supprimer retire la fiche et tente de supprimer le fichier associé ; les fichiers Drive ne sont jamais supprimés par l'app.

En cas d'interruption réseau après l'envoi, un fichier non référencé peut subsister. Il n'est pas lisible par les membres et peut être nettoyé dans le bucket official-media. Après une erreur de publication, actualiser la liste avant de réessayer : l'enregistrement a pu réussir malgré la coupure.

## 7. Où sont les fichiers et quels sont les droits ?

- public : éléments visuels de l'interface et ressources déjà publiques de V1.3.2 (inchangées).
- Supabase / official-media : nouveaux fichiers officiels, bucket privé.
- Supabase / family-media : contributions familiales existantes (inchangées).
- Supabase / media_resources : titres, destinations, ordre et visibilité.
- Supabase / media_admins : comptes autorisés à administrer, gérés uniquement par SQL.
- Drive : gros films et archives externes, autorisations Google indépendantes.

Les membres autorisés lisent uniquement les ressources publiées. L'administrateur est le seul à ajouter, modifier ou supprimer. Les règles sont appliquées côté Supabase et pas seulement dans l'interface. Les liens temporaires Supabase expirent après une heure : un lien déjà émis peut rester utilisable jusqu'à son expiration, même après masquage. Les fichiers téléchargés par quelqu'un ne peuvent pas être révoqués. Aucun média privé n'est ajouté au cache hors connexion.

## 8. Vérifications et limites

- Build de production et TypeScript : réussis.
- 39 tests automatisés API et composants : réussis.
- `npm run test:media-rls` : vérifie la migration répétable, les droits administrateur/membre/non-membre, le masquage des fichiers, le refus de s'attribuer un rôle et les numéros de podcasts avec un PostgreSQL local PGlite (schéma auth/storage simulé).
- Rendu réel des pages 1 et 24 du livret PDF de 24 pages : réussi avec PDF.js dans l'environnement Node.
- Serveur de production : HTTP 200 sur l'accueil V1.4.0, le service worker, le worker PDF et une police PDF.
- npm audit : 0 vulnérabilité signalée au contrôle.

La migration n'a pas été exécutée dans votre Supabase. Les uploads réels, les droits Drive et le rendu visuel sur vos téléphones restent à tester après installation. Les tests DOM du parcours PDF simulent le composant de rendu ; le test du livret valide séparément le moteur PDF.js, sans constituer un test navigateur de bout en bout.

## Retour arrière

Revenir au code V1.3.2 avec Git si nécessaire. Les nouvelles tables et le bucket peuvent rester : ils n'interfèrent pas avec les contributions ni l'agenda. Ne pas supprimer les tables ou fichiers pour revenir à l'ancienne interface.
