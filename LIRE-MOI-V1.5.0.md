# Beer Road V1.5.0 — contenus d'abord

## Installation (depuis V1.4.0)

1. Arrêter le serveur local (Ctrl+C).
2. Extraire cette mise à jour dans le dossier EXISTANT `C:\Techtune\Devt\Beer Road`, en acceptant les remplacements. Ne pas déplacer .git et ne pas modifier .env.local.
3. Dans Supabase > SQL Editor, exécuter `supabase/simplification-v1.5.0.sql`. Ce script ajoute uniquement les liens administrables des applications. Il ne modifie ni ne supprime les médias ou contributions existants. Les droits administrateur V1.4.0 sont conservés.
4. Dans CMD :

```cmd
cd /d "C:\Techtune\Devt\Beer Road"
npm ci
npm run build
```

Si le build réussit :

```cmd
git add -A
git commit -m "Beer Road V1.5.0 : simplification des univers"
git push
```

Après déploiement, vérifier V1.5.0 et actualiser la page. Pour un essai local : npm run dev.

## Les sept univers

- Bobine des origines : médiathèque visible immédiatement, puis livret et paroles Beer Road. Suppression des blocs redondants film, quatre soifs, coulisses, chansons WAV et archives globales.
- Mots qui restent : les deux livres et les podcasts, sans « Autres livres et ressources ».
- Atelier : quatre cartes (CookiWiki, Frosti, Cellio, Mealio), chacune avec accès en ligne et téléchargement lorsqu'ils sont renseignés. Les médias déjà publiés dans Atelier restent visibles en dessous.
- Grenier : site officiel, Linktree, paroles Drive. Les médias propres au Grenier restent affichés s'il y en a. Pas de répétition du livret Beer Road.
- Maison : guides PDF et vidéos de la collection Ker Huon, puis contributions.
- Cabinet : films et podcasts recommandés (deux filtres), puis boîte à anecdotes. Les médias officiels déjà publiés dans Légendes restent dans cette boîte.
- Route : accès à l'agenda et publications « Projets communs ». Les médias officiels déjà publiés dans Avenir restent associés aux projets.

Une seule phrase d'introduction et un seul espace « À plusieurs, c'est mieux » par univers. Le sélecteur « À propos de » permet de choisir la rubrique avant d'ajouter une publication ou de consulter ses contributions. Le choix « Contributions générales » avec « Voir les contributions » affiche TOUTES les contributions de l'univers, y compris les anciennes rubriques retirées de l'interface. Aucune publication ancienne n'est perdue. Leur rubrique d'origine est conservée ; on peut la modifier depuis le carnet.

## Films et podcasts qu'on aime

Dans le Cabinet, aller au bloc de contributions en bas. Choisir « Films qu’on aime » ou « Podcasts qu’on aime », puis Ajouter une contribution. Renseigner le titre et un petit commentaire (obligatoire pour ces recommandations) ; le lien reste facultatif. Le type Film/Podcast correspond à la rubrique sélectionnée. Les recommandations sont ensuite visibles directement dans le Cabinet. La lecture directe de ces œuvres n'est pas fournie : il s'agit de recommandations avec un lien facultatif.

Pour une photo, une vidéo ou une histoire familiale, choisir « La boîte à anecdotes ». Les pièces jointes utilisent toujours le stockage privé des contributions.

Les listes intégrées montrent jusqu'à 12 publications par rubrique ; le bouton « Voir la suite dans le carnet » permet d'accéder à la pagination existante. Chacun conserve la modification et la suppression de ses propres publications depuis le carnet.

## Liens de l'Atelier

En administrateur : ouvrir « Gérer les médias », puis « Liens des applications de l’Atelier ».
Pour chaque application :
- Ouvrir l'application : son adresse HTTPS en ligne.
- Télécharger : le lien HTTPS du fichier (archive/installation), d'un partage Drive ou d'une page de téléchargement.
- Enregistrer les liens de cette application.

Aucune adresse d'application ou de téléchargement n'a été inventée. Tant qu'un lien n'est pas renseigné, la carte indique « à venir » pour cet accès. L'app ne crée pas d'installateur et ne charge pas les archives d'applications dans Supabase. Les fichiers restent chez leur hébergeur ; ses permissions et éventuelles confirmations de téléchargement s'appliquent.

Les membres peuvent consulter ces liens. Seuls les administrateurs peuvent les modifier, avec contrôle côté Supabase. Aucun nouveau déploiement n'est nécessaire après modification des liens. Fermer et rouvrir l'univers Atelier pour voir les modifications.

Le lien paroles du Grenier conserve le dossier Drive qui était déjà configuré. Si ce dossier ne contient que les paroles Beer Road, remplacer cette URL par le dossier général des paroles du Grenier dans `src/data/beerRoadData.ts`.

## Vérifications

Build de production avec TypeScript et tests automatisés exécutés. Les tests de sections vérifient l'ordre contenu/contributions, l'unicité du bloc d'ajout, les trois collections des livres/podcasts et la suppression des doublons. Les tests de l'Atelier vérifient les deux liens et l'absence de requête sans connexion. Les tests SQL locaux vérifient la migration répétable et les droits membre/administrateur/non-membre.

La migration reste à exécuter dans votre Supabase. Aucun test navigateur réel PC/smartphone ni aucun accès à votre base de production n'a été effectué ici. Après déploiement : vérifier une recommandation de film, une anecdote avec photo, un projet et les liens de l'Atelier avec un compte membre.
