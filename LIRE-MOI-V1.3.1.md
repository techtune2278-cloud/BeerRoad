# Beer Road V1.3.1 — améliorations de structure et de fluidité

Cette archive cumulative inclut les améliorations V1.2 et peut être superposée
au projet Beer Road existant, même si la V1.2 n’a pas encore été installée.
Elle inclut le correctif V1.1.1. Ce n'est pas une application autonome : les
répertoires `src/data` et `public` n'étaient pas dans l'archive initiale et ne
sont donc pas remplacés. Les paramètres `.env.local` sont également conservés.

## Installation sous Windows

1. Arrêter le serveur avec Ctrl+C.
2. Extraire cette archive dans le dossier habituel du projet, là où se trouve
   son `package.json`. Accepter le remplacement des fichiers existants et
   l'ajout du dossier `components/community` et du dossier `checks`.
3. Supprimer l'ancienne copie inutilisée `components/beer-road - Copie.tsx`
   si elle existe encore. Elle n'est plus utilisée ni fournie dans cette version.
4. Dans le terminal du projet :

```powershell
npm ci
npm run dev
```

5. Recharger la page avec Ctrl+F5. Le bandeau doit afficher **V1.3.1**.

En production locale : `npm run build`, puis `npm start`.
Le développement et le build utilisent désormais Webpack. Cela évite le chemin
Turbopack qui plantait sur le poste signalé ; cela ne remplace pas une installation
correcte des dépendances. Aucun changement des tables ou des données Supabase
n'est demandé. Ne pas réexécuter le schéma SQL pour cette mise à jour.

## Ce qui change pour la famille

- Deux vues conservées : Carnet et Agenda.
- Les formulaires sont ouverts avec « Ajouter » et peuvent être refermés.
- Une saisie reste en mémoire lors d'un changement d'onglet. Elle n'est pas
  sauvegardée après fermeture/rechargement du navigateur ou déconnexion.
- Les boutons « Participer » et les liens depuis les univers préparent toujours
  le formulaire ou le filtre correspondant.
- Carnet et agenda ont chacun leur chargement, leurs erreurs et leur actualisation.
  L'agenda commence à charger à sa première ouverture.
- Le carnet charge 12 publications à la fois. Le bouton « Voir les contributions
  précédentes » charge la suite. Les filtres portent sur la base, pas uniquement
  sur la page déjà chargée. Le nombre affiché est celui des publications chargées
  correspondant au filtre, et non le nombre total en base.
- Les liens privés des médias ne sont demandés que lorsque les médias approchent
  de la zone visible. Un média en panne dispose de son propre bouton de réessai.
- Les liens des médias sont renouvelés après 50 minutes, avec une vérification
  toutes les minutes et au retour sur la fenêtre. Si une vidéo ou un son joue,
  le renouvellement est différé jusqu'à la pause ou la fin ; la position de
  lecture est conservée lors du remplacement du lien.
- L'agenda demande les événements à partir du début de la journée courante : les
  anciens rendez-vous ne prennent plus les premières places de la requête.
- La connexion est affichée dès la reconnaissance du membre, indépendamment du contenu.

## Organisation du code

- `components/community-hub.tsx` : coordination, statut de connexion et onglets.
- `components/community/use-family-auth.ts` : restauration et état de la session.
- `components/community/auth-panel.tsx` : formulaire de connexion par e-mail.
- `components/community/posts-panel.tsx` : carnet, filtres, pagination et actions.
- `components/community/post-form.tsx` : formulaire de publication.
- `components/community/post-media.tsx` : chargement différé des médias.
- `components/community/events-panel.tsx` : agenda et formulaire de rendez-vous.
- `components/community/shared.tsx` : types et fonctions de présentation communs.
- `lib/family-auth.ts` : appels authentifiés, sessions et délais réseau.
- `lib/family-content.ts` : requêtes du carnet, de l'agenda et du stockage.
- `lib/family-api.ts` : point d'entrée compatible avec les imports existants.
- `lib/version.ts` : lit la version dans `package.json` pour le bandeau.

La gestion de l'authentification utilise désormais le client officiel
`@supabase/supabase-js` (version fixée dans package.json et package-lock.json).
La clé de stockage des sessions reste identique : les sessions valides des
versions précédentes sont reprises sans nouvel envoi d'e-mail. Le SDK gère le
renouvellement et les événements de connexion. Les politiques RLS et la liste
familiale restent en place et sont vérifiées avant d'afficher le contenu privé.

Le hook React écoute aussi les changements de session. Ses callbacks ne font
pas d'appel asynchrone au SDK, pour éviter les attentes circulaires.
La déconnexion utilise la portée locale (ce navigateur, pas tous les appareils).
Le SDK termine les opérations en cours dans l'ordre ; le stockage local est
nettoyé à la fin. Si le serveur est indisponible, la révocation distante ne peut
pas être garantie, mais la session locale est supprimée.

Les liens reçus par e-mail sont traités avec `setSession`. Les erreurs de lien
expiré ou incomplet sont expliquées, puis les paramètres sensibles sont retirés
de l'URL. Une erreur réseau transitoire permet de réessayer le lien.
Les limites d'envoi d'e-mail sont affichées clairement, sans tentative automatique.
Le renouvellement du jeton peut être réessayé automatiquement par le SDK avec
un délai progressif. La limite de 15 secondes s'applique à chaque requête HTTP,
pas à l'ensemble d'une séquence de renouvellement.

Les réponses arrivant après un changement de filtre sont ignorées. L'objet de la
publication en cours de modification est conservé séparément des résultats filtrés.
Un renouvellement de jeton tardif ne rétablit pas une session après déconnexion.
Une panne serveur temporaire ne supprime pas la session sauvegardée.

## Vérifications effectuées

- Vérification TypeScript des modules modifiés : réussie.
- 26 tests automatisés API et interface React : réussis.
- Cas couverts : absence de session, membre non autorisé, renouvellement mutualisé,
  session refusée, serveur indisponible, requête et corps bloqués, déconnexion,
  compte reconnu avant le contenu, indépendance de l'agenda, pagination, médias
  différés, réponse périmée après filtrage, brouillon conservé, création et
  modification d'une publication, création et suppression d'un rendez-vous, erreurs des liens e-mail,
  réception d'un lien dans le SDK et dans l'interface, absence de boucle de
  restauration et renouvellement d'un lien de média ancien.

Ces tests utilisent un réseau simulé et un DOM de test. Le module de données
absent est remplacé dans les tests par un contrat minimal, situé exclusivement
dans `checks`. Ce dossier est exclu du contrôle TypeScript de production.

Commandes pour rejouer les vérifications (Node 24) :

```powershell
npm run typecheck:community
npm test
```

Le build complet, le rendu visuel dans le navigateur et les échanges avec le
Supabase réel n'ont pas pu être validés à partir de l'archive incomplète. Sur le
projet complet, exécuter `npm run build` avant le déploiement.

## Contrôle rapide après installation

- Vérifier le numéro V1.3.1 et la reconnaissance du compte.
- Ouvrir Carnet, puis Agenda ; ajouter et modifier une publication de test.
- Vérifier les filtres et les photos/sons.
- Ajouter puis supprimer un rendez-vous de test.
- Fermer et rouvrir le navigateur pour vérifier la session persistée.

Si une erreur subsiste, transmettre le message du terminal et, pour le réseau,
le chemin et le statut de la requête en échec, sans jetons ni en-têtes Authorization.


## Références techniques utilisées

- Initialisation du client : https://supabase.com/docs/reference/javascript/initializing
- Reprise d’une session : https://supabase.com/docs/reference/javascript/auth-setsession
- Événements de connexion : https://supabase.com/docs/reference/javascript/auth-onauthstatechange
- Déconnexion locale : https://supabase.com/docs/reference/javascript/auth-signout


## Correctifs spécifiques à V1.3.1

- Import JSON par défaut dans lib/version.ts : suppression de l’avertissement
  Webpack sur l’import nommé de version.
- Version de l’application 1.3.1 dans package.json et package-lock.json.
- Next.js mis à jour de 16.2.6 vers 16.4.3.
- Suppression de la dépendance au générateur shadcn. Sa feuille de style utilisée
  par globals.css est conservée à l’identique dans app/shadcn-tailwind.css,
  avec sa licence dans app/shadcn-LICENSE.md. Ces fichiers doivent être copiés.
- Mises à jour compatibles des dépendances indirectes, sans --force.
- Audit npm après corrections : 0 vulnérabilité signalée le 30 octobre 2026.
  Ce résultat reflète la base d’avis disponible à cette date, pas une garantie absolue.
- Vérifications supplémentaires : module version compilé avec Webpack sans
  avertissement, styles compilés avec Tailwind/PostCSS sans avertissement,
  conversion d’une image en WebP avec Sharp réussie dans l’environnement de test.
- Les 26 tests de connexion et d’interface ont été rejoués avec succès.

Le journal « beer-road-pwa@1.2.0 » indique que le package.json lancé est encore
celui de la V1.2, indépendamment du cache du navigateur. Après extraction dans
le dossier existant, vérifier depuis l’invite de commandes Windows :

```bat
cd /d "C:\Techtune\Devt\Site Beer Road"
node -p "require('./package.json').version"
```

Le résultat doit être 1.3.1. Si ce n’est pas le cas, corriger la destination de
l’extraction : les fichiers du ZIP doivent se trouver directement dans le
projet, pas dans un sous-dossier supplémentaire. Puis lancer :

```bat
npm ci
npm run dev
```

Le terminal doit indiquer beer-road-pwa@1.3.1 et Next.js 16.4.3.
Le message npm relatif à l’autorisation du script Sharp est distinct du numéro
de version. Le fonctionnement des images sur Windows reste à vérifier sur le poste.
