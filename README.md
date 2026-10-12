# La Beer Road — V4 : connexion par lien e-mail et accès Drive

## Ce que contient cette version

La page d'accueil conserve la photo du chemin de Ker Huon et ses sept empreintes. L'ordre physique est maintenant **du bas vers le haut** : 1. La Bobine des origines, 2. Les Mots qui restent, 3. L'Atelier des possibles, 4. Le Grenier d'Elwood, 5. La Maison apprivoisée, 6. Le Cabinet des légendes, 7. La Route des lendemains.

Chaque fiche présente des textes et un bloc **Accès et ressources**. Les liens renseignés s'ouvrent directement. Les liens encore inconnus proposent désormais un bouton **Ajouter le lien** qui prépare une contribution classée dans l'univers et la rubrique précis. Les blocs thématiques sont eux aussi cliquables : un clic ouvre le formulaire, pré-sélectionne la bonne rubrique et propose son nom comme titre. L'agenda dispose d'un bouton dans l'en-tête et dans le dernier univers, même si la connexion n'est pas encore faite.

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
- `content.links` : les raccourcis affichés dans « Accès et ressources ». Quand `url` est renseignée, le raccourci ouvre directement la ressource. Sans `url`, le bouton **Ajouter le lien** prépare une contribution à cette rubrique.
- `siteMeta.driveFolderUrl` contient le dossier racine **Beer Road** sur Google Drive. Le bouton « Drive familial » est visible en haut de la page et le même accès figure dans les fenêtres des univers. Tu peux créer des sous-dossiers dans Drive au fil du temps sans modifier ce lien racine ; pour les accès directs au film, aux chansons et aux paroles, leurs liens spécifiques sont déjà renseignés ci-dessous.

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


## Liens Google Drive déjà intégrés

- Dossier racine Beer Road : https://drive.google.com/drive/folders/1tn5NZkTjxGQHj_LJC9hVGPtB31Vh-4vq?usp=drive_link
- Dossier des chansons (.wav) : https://drive.google.com/drive/folders/1-LGw_SDDk1QqtPsA8_p9QPgd89zfrIxF?usp=drive_link
- Dossier du film : https://drive.google.com/drive/folders/1_ixkqhZkDROkBlIlgTo5EMO_pjI3oW32?usp=drive_link
- Dossier des paroles : https://drive.google.com/drive/folders/1xcqEB3VeeiV5huZlIpcoAWTsvY27cngD?usp=drive_link

Ces adresses sont configurées dans `src/data/beerRoadData.ts`. Les liens pointent vers des dossiers, pas nécessairement vers un fichier vidéo directement intégrable : le bouton ouvre Google Drive dans un nouvel onglet. Vérifie dans Drive que les membres prévus ont les droits d'accès.

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

Ces adresses n'ont pas besoin d'être « créées » à la main dans Supabase Auth. Chaque personne utilise sa boîte habituelle. La table `family_members` autorise ensuite l'accès aux données familiales. Une personne qui n'est pas dans cette liste ne peut pas consulter ou publier le contenu partagé, même si elle reçoit un e-mail de confirmation.

## Connexion simplifiée : aucun code à saisir

Le site utilise uniquement un lien reçu par e-mail. Le formulaire ne demande plus de code à six chiffres.

1. Saisis l'une des neuf adresses e-mail autorisées, puis clique sur **M'envoyer le courriel de connexion**.
2. Ouvre le courriel envoyé par Supabase. Lors de la première connexion, son sujet peut être **« Confirmer votre email »**. C'est normal.
3. Clique sur le bouton ou le lien **« Confirmer votre email »** dans le message. Ne cherche pas de code.
4. La page La Beer Road doit s'ouvrir dans le navigateur avec lequel tu consultes le site. L'interface affiche alors **« Bonjour [prénom] ! Connecté·e avec [adresse] »**.

Si le message n'arrive pas, vérifie les courriers indésirables. Tu peux revenir au site et cliquer sur **Renvoyer le courriel**. Quand le lien a expiré, demande simplement un nouveau courriel. Après une première confirmation, Supabase peut envoyer un lien de connexion plutôt qu'un message intitulé « Confirmer votre email ».

Le bouton n'est pas une invitation à créer une nouvelle adresse. Le lien prouve que le membre contrôle bien la boîte e-mail. Pour faciliter le retour automatique, ouvre ce lien dans le même navigateur que celui où La Beer Road est affiché.

1. Dans Supabase, ouvre **Authentication → URL Configuration**.
2. Dans **Site URL**, mets l'adresse publique principale du site, pas l'adresse `supabase.co`. Tu la trouves dans Vercel, dans le projet Beer Road, sous **Settings → Domains** ou dans la liste des déploiements. Exemple fictif : `https://beer-road-famille.vercel.app`.
3. Dans **Redirect URLs**, ajoute l'adresse exacte de production avec un joker de chemin (`https://beer-road-famille.vercel.app/**`). Ajoute `http://localhost:3000/**` uniquement si tu veux tester sur ton ordinateur. Si tu as un nom de domaine personnalisé, ajoute aussi `https://ton-domaine.fr/**`.
4. Dans **Authentication → Email Templates**, vérifie que le modèle de confirmation contient un bouton/lien basé sur `{{ .ConfirmationURL }}`. La Beer Road utilise le parcours par lien : aucun code à six chiffres n'est nécessaire dans l'interface.

Pourquoi autoriser ces URL ? Le lien reçu par e-mail doit savoir vers quel site revenir après vérification. Supabase n'accepte pas toute adresse de retour : la destination doit figurer dans cette liste. La `Site URL` est l'adresse par défaut, et `Redirect URLs` contient les destinations autorisées. Documentation officielle : https://supabase.com/docs/guides/auth/redirect-urls.

## Installer/configurer le projet

1. Ouvre `supabase/schema.sql`, relis le bloc des neuf adresses et exécute le script dans Supabase → **SQL Editor**. Il crée les tables, les règles d'accès et le bucket privé. Si le schéma avait déjà été appliqué, le script ajoute aussi les colonnes `external_url`, `section_label` et `event_type` sans recréer les tables. Il faut donc exécuter cette version à jour pour que le carnet classe les publications dans une sous-rubrique.
2. Copie `.env.example` en `.env.local` sur ton ordinateur et renseigne `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` à partir des paramètres API de ton projet Supabase. La clé `service_role` ne doit jamais être ajoutée au navigateur ni à une variable `NEXT_PUBLIC_…`.
3. Dans Vercel → projet Beer Road → **Settings → Environment Variables**, ajoute les mêmes deux variables, puis redéploie.
4. Vérifie un login avec l'une des neuf adresses, une publication test (texte puis lien média), et l'ajout/modification/suppression d'un événement de test.

Si le navigateur tente d'appeler `votre-projet.supabase.co`, les variables d'environnement contiennent encore l'adresse d'exemple. Le code corrigé reconnaît ce cas et n'envoie plus de requête à ce domaine fictif. Dans Vercel, copie les valeurs réelles depuis Supabase → Project Settings → API, enregistre-les puis redéploie. Lors d'une connexion depuis le site en production, le lien de retour est calculé à partir du domaine public actuellement ouvert ; en local, il sera `http://localhost:3000`. Ces sujets sont distincts d'une éventuelle 404 de la page d'accueil.

### Si Vercel affiche une page 404

Le projet comprend `app/page.tsx` à la racine : la route d'accueil `/` existe. Dans Vercel → Project → Settings → Build and Deployment, vérifie :

- **Framework Preset** : Next.js ;
- **Root Directory** : `./` si `package.json` et le dossier `app/` sont à la racine du dépôt ; sinon le chemin exact vers le dossier qui contient ces deux éléments ;
- **Build Command** : laisse la valeur Next.js par défaut ou `npm run build` ;
- **Output Directory** : laisse la valeur par défaut de Next.js, sans saisir `public` ou `out`.

Le fichier `vercel.json` du projet déclare maintenant le framework Next.js, mais ne peut pas corriger un Root Directory configuré vers un mauvais dossier. Consulte aussi le journal Build du dernier déploiement : il doit afficher la route `/`. En cas de doute, ouvre l'URL du déploiement attribuée par Vercel et non une URL d'ancienne preview.

## Comment fonctionne l'agenda actuellement

L'agenda est volontairement simple pour la première étape : chaque membre connecté peut ajouter un rendez-vous (titre, date, heure, type, lieu, précisions), consulter les événements futurs et modifier ou supprimer les événements qu'il a créés. Les types sont : séjour/retrouvailles, anniversaire/fête, Ker Huon/travaux, projet commun ou autre. Les événements passés restent en base mais ne sont plus dans la liste « prochains rendez-vous ».

La prochaine évolution utile serait d'ajouter la vue mensuelle, puis un bouton « Je viens / peut-être / absent » pour chaque membre. Je ne l'ai pas simulée dans cette version : ces deux éléments nécessitent une décision sur le fonctionnement souhaité.

## Attention avant le déploiement

Le ZIP contient le code, mais n'a pas été déployé en production depuis cet environnement. Il faut exécuter `npm install` puis `npm run build` dans ton environnement habituel, résoudre toute erreur éventuelle, ensuite tester les parcours sur un déploiement de prévisualisation avant de pousser en production.


## Connexion familiale : le lien par e-mail est nécessaire une seule fois par navigateur

### Première fois
1. Le membre ouvre La Beer Road et saisit son adresse e-mail autorisée.
2. Il reçoit le message de Supabase, généralement « Confirmer votre email ».
3. Il clique sur le lien dans le même navigateur que La Beer Road. Aucun code à 6 chiffres n'est à recopier.
4. La page valide la session et affiche son nom et son adresse e-mail.

### Visites suivantes
Le site restaure la session enregistrée dans `localStorage`. Pendant cette vérification, il affiche « Retrouvons ta session… » au lieu de demander un nouvel e-mail. Lorsque la session est valide, l'espace familial s'ouvre directement, sans nouvel e-mail.

Un nouvel e-mail peut être nécessaire après une déconnexion volontaire, l'effacement des données du navigateur, l'utilisation d'un autre navigateur/appareil ou la révocation de la session par Supabase. Les jetons sont stockés dans le navigateur et rafraîchis lorsqu'ils arrivent à expiration. Les autorisations d'accès aux données restent contrôlées côté Supabase.

