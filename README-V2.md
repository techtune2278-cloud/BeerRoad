# La Beer Road — V2 familiale

## Ce que contient cette version

La page d'accueil conserve la photo du chemin de Ker Huon et ses sept empreintes. L'ordre physique est maintenant **du bas vers le haut** : 1. La Bobine des origines, 2. Les Mots qui restent, 3. L'Atelier des possibles, 4. Le Grenier d'Elwood, 5. La Maison apprivoisée, 6. Le Cabinet des légendes, 7. La Route des lendemains.

Chaque fiche présente des textes et un bloc **Accès et ressources**. Les liens déjà renseignés sont cliquables ; les autres portent clairement la mention **URL à ajouter**. Les boutons « Ajouter au… » ouvrent le carnet sur le bon univers, sélectionnent cet univers et filtrent les contributions pour éviter que la publication soit perdue dans un carnet indistinct. Le bouton de La Route des lendemains ouvre directement l'agenda.

## Où modifier les contenus et les libellés des univers

Le fichier à modifier le plus souvent est `src/data/beerRoadData.ts`. Il est le **catalogue éditorial du site**, pas une table Supabase.

Dans ce fichier, chaque bloc `id: "origines"`, `id: "transmission"`, etc. contient :

- `name` : le titre affiché de l'univers ;
- `tagline` : la courte phrase sous le titre ;
- `position` : l'emplacement de l'empreinte sur la photo (coordonnées en pourcentage) ;
- `content.intro` : paragraphes d'introduction ;
- `content.highlights` : les blocs explicatifs ;
- `content.video.embedUrl` : l'URL d'intégration vidéo, par exemple une URL YouTube de type `https://www.youtube.com/embed/ID_VIDEO` ;
- `content.albums` : pochette, titre, description et ressources d'un album ;
- `content.books` : titres, description, couverture et PDF des livres ;
- `content.links` : les raccourcis affichés dans « Accès et ressources ».

Pour rendre un raccourci actif, ajoute sa vraie URL au champ `url`. Exemple :

```ts
{ label: "Écouter sur Spotify", url: "https://open.spotify.com/...", kind: "music" }
```

Pour un fichier léger livré avec le site, place-le dans `public/` puis utilise son chemin depuis la racine : `url: "/mon-document.pdf"` ou `pdf: "/mon-document.pdf"`. Le livret Beer Road est déjà disponible dans `public/Livret_de_la_Beer_Road.pdf`.

**Ne place pas le film, les gros MP3 ou les longues vidéos dans le dossier du site ou dans Supabase.** Pour le film, utilise un hébergement vidéo approprié et renseigne le lien de visionnage dans `content.links`; si tu veux l'afficher dans le lecteur intégré, renseigne aussi `content.video.embedUrl`. Pour les albums, renseigne les liens des plateformes. Pour les livres, dépose un PDF seulement si tu disposes des droits et que sa taille reste adaptée, sinon crée un raccourci vers son hébergement.

### Autres emplacements des libellés

- `components/beer-road.tsx` : titre principal de la page, texte d'accueil, recherche, libellés autour du chemin et pied de page.
- `components/plaque-modal.tsx` : présentation d'une fiche, titre « Accès et ressources », libellés des boutons dans les fenêtres d'univers.
- `components/community-hub.tsx` : connexion, carnet vivant, publication de contenu, agenda, formulaires et messages de confirmation.
- `app/layout.tsx` : titre de l'onglet du navigateur et description générale du site.
- `app/globals.css` : style général, couleurs, polices, espacements.

Les valeurs de `universe` et les identifiants (`origines`, `transmission`, etc.) sont utilisés aussi par la base de données. Pour renommer un titre, modifie simplement `name`; pour modifier un identifiant technique, il faudra aussi mettre à jour `supabase/schema.sql`.

## Que mettre dans Supabase — et quoi ne pas y mettre

Supabase n'est pas la médiathèque centrale de la Beer Road. Il sert à stocker les petites données structurées nécessaires à la collaboration :

- la liste blanche des adresses familiales et les noms affichés ;
- les textes et les titres des contributions, avec l'univers, la date et l'auteur ;
- les détails des rendez-vous de l'agenda ;
- les liens vers des médias hébergés ailleurs ;
- éventuellement les petits fichiers familiaux privés téléversés dans le bucket `family-media`.

Les fichiers audio/vidéo/photo téléversés sont gardés dans un bucket Supabase privé, pas dans les tables SQL. Cependant, ce stockage et les téléchargements consomment le quota du forfait. Le forfait gratuit Supabase indique actuellement 500 Mo de base de données, 1 Go de stockage fichier, et des quotas de transfert de données ; vérifie la page de tarification pour les valeurs les plus récentes : https://supabase.com/pricing. Pour rester prudent, l'interface conseille des petits fichiers (photo/PDF 10 Mo, MP3 20 Mo, vidéo courte 25 Mo), et propose un champ de lien externe pour les médias plus lourds.

Pour de longs médias privés, héberge-les dans un espace approprié partagé uniquement avec les adresses concernées, puis colle le lien dans le carnet. Attention : un lien « non répertorié » ou transférable ne garantit pas la confidentialité à lui seul ; règle les droits d'accès chez l'hébergeur. Une URL stockée dans Supabase n'y copie pas le fichier : seule l'adresse est enregistrée.

Les contenus fixes que tu configures dans `src/data/beerRoadData.ts` restent dans le code du site et non dans Supabase. Le livret PDF dans `public/` fait partie des ressources du site. Garde par ailleurs une copie indépendante de sauvegarde des œuvres importantes : un site n'est pas, à lui seul, une archive garantie pour plusieurs décennies.

## Les neuf adresses autorisées

Le SQL les inscrit automatiquement dans `public.family_members`. Les noms affichés sont des prénoms préremplis ; tu peux les corriger directement dans le bloc final du fichier `supabase/schema.sql` avant de l'exécuter.

Ces adresses n'ont pas besoin d'être « créées » à nouveau dans Supabase Auth à la main. Chaque personne utilise sa boîte e-mail habituelle. L'envoi d'un lien/code de connexion sert à vérifier qu'elle contrôle bien cette boîte ; la table `family_members` autorise ensuite l'accès aux données familiales. Une personne qui n'est pas dans cette liste ne peut pas consulter ou publier le contenu partagé, même si elle reçoit un e-mail de connexion.

## Configurer la connexion par e-mail

Le bouton de connexion n'est pas une invitation à créer une nouvelle adresse e-mail. C'est l'étape qui prouve l'identité du membre de la famille à chaque première connexion (et quand la session expire).

1. Dans Supabase, ouvre **Authentication → URL Configuration**.
2. Dans **Site URL**, mets l'adresse publique principale du site, pas l'adresse `supabase.co`. Tu la trouves dans Vercel, dans le projet Beer Road, sous **Settings → Domains** ou dans la liste des déploiements. Exemple fictif : `https://beer-road-famille.vercel.app`.
3. Dans **Redirect URLs**, ajoute l'adresse exacte de production avec un joker de chemin (`https://beer-road-famille.vercel.app/**`). Ajoute `http://localhost:3000/**` uniquement si tu veux tester sur ton ordinateur. Si tu as un nom de domaine personnalisé, ajoute aussi `https://ton-domaine.fr/**`.
4. Dans **Authentication → Email Templates**, vérifie que le modèle de Magic Link contient un lien de confirmation valide. L'interface accepte également un code à 6 chiffres si le modèle du courriel montre `{{ .Token }}`. Si seul un lien est fourni, clique dessus dans la boîte e-mail ; le site doit alors revenir sur le domaine autorisé.

Pourquoi autoriser ces URL ? Le lien reçu par e-mail doit savoir vers quel site revenir après vérification. Supabase n'accepte pas toute adresse de retour : la destination doit figurer dans cette liste. La `Site URL` est l'adresse par défaut, et `Redirect URLs` contient les destinations autorisées. Documentation officielle : https://supabase.com/docs/guides/auth/redirect-urls.

## Installer/configurer le projet

1. Ouvre `supabase/schema.sql`, relis le bloc des neuf adresses et exécute le script dans Supabase → **SQL Editor**. Il crée les tables, les règles d'accès et le bucket privé. Si le schéma avait déjà été appliqué, le script ajoute aussi les colonnes `external_url` et `event_type` sans recréer les tables.
2. Copie `.env.example` en `.env.local` sur ton ordinateur et renseigne `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` à partir des paramètres API de ton projet Supabase. La clé `service_role` ne doit jamais être ajoutée au navigateur ni à une variable `NEXT_PUBLIC_…`.
3. Dans Vercel → projet Beer Road → **Settings → Environment Variables**, ajoute les mêmes deux variables, puis redéploie.
4. Vérifie un login avec l'une des neuf adresses, une publication test (texte puis lien média), et l'ajout/modification/suppression d'un événement de test.

## Comment fonctionne l'agenda actuellement

L'agenda est volontairement simple pour la première étape : chaque membre connecté peut ajouter un rendez-vous (titre, date, heure, type, lieu, précisions), consulter les événements futurs et modifier ou supprimer les événements qu'il a créés. Les types sont : séjour/retrouvailles, anniversaire/fête, Ker Huon/travaux, projet commun ou autre. Les événements passés restent en base mais ne sont plus dans la liste « prochains rendez-vous ».

La prochaine évolution utile serait d'ajouter la vue mensuelle, puis un bouton « Je viens / peut-être / absent » pour chaque membre. Je ne l'ai pas simulée dans cette version : ces deux éléments nécessitent une décision sur le fonctionnement souhaité.

## Attention avant le déploiement

Le ZIP contient le code, mais n'a pas été déployé en production depuis cet environnement. Il faut exécuter `npm install` puis `npm run build` dans ton environnement habituel, résoudre toute erreur éventuelle, ensuite tester les parcours sur un déploiement de prévisualisation avant de pousser en production.
