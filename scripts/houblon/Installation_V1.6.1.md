# Beer Road V1.6.1 — carte reliée au tableur

## État de la livraison
Le code de connexion est livré et testé avec des données de test. La connexion réelle à votre Google Sheets et le déploiement Vercel restent à activer. Aucun accès aux documents privés, aucune liaison Forms et aucun barème n'ont été modifiés à distance.

Le lien /qg/maquette redirige désormais vers /qg. Le QG n'affiche plus de chiffres fictifs. Il lit uniquement EXPORT_PUBLIC, les paramètres nécessaires et les autorisations PUBLICATION. Les anciens classements publics importés dans Supabase ne sont plus affichés. Le classement final reste publié manuellement par l'administrateur depuis un XLSX validé ; les annonces et liens restent dans Supabase.

## 1. Installer dans le dossier existant
Prérequis : Beer Road V1.6.0 déjà installée et migration supabase/houblon-v1.6.0.sql exécutée. Ce ZIP contient les fichiers modifiés depuis cette version, pas une application complète.
Fermer le serveur local. Extraire le ZIP, puis copier son contenu dans C:\Techtune\Devt\Beer Road en acceptant le remplacement. Conserver .env.local.

## 2. Préparer le tableur maître
Ouvrir le fichier : https://docs.google.com/spreadsheets/d/1Ku7l9K3S6NYaywNh85EKKRqrHYk3IWApsM4vlpPCpcc/edit
Il doit être un Google Sheets natif, avec les onglets du classeur V5. Ne pas renommer EXPORT_PUBLIC, PARAMETRES, RELEVES, ACTIONS ou CALCULS.
Dans Extensions > Apps Script, ajouter un fichier Houblon et coller scripts/houblon/GoogleSheets.gs. Ne pas effacer d'autres scripts existants.
Exécuter appliquerBaremeV6. Le script vérifie la structure V5, crée une sauvegarde Drive avant les modifications, puis adapte les paramètres et les formules. Autoriser les accès demandés uniquement dans votre propre projet Apps Script. Les changements concernent le fichier maître, pas une copie XLSX locale.
Si le script refuse la structure ou un barème déjà modifié, ne pas contourner le contrôle : utiliser le mode d'emploi pour comparer les cellules. Une erreur technique en cours d'exécution peut laisser une modification partielle : la sauvegarde préalable permet de restaurer.
Exécuter installerPublication. Un onglet PUBLICATION est créé avec les 12 dates ; toutes sont sur Non. Si l'onglet existe déjà, il est conservé sans modification.
Exécuter verifierLiaisonFormulaire pour contrôler la destination réelle du formulaire et obtenir son lien répondant. Cela ne modifie pas la liaison. Vérifier que ce lien correspond au bouton « Déposer une preuve » du site ; sinon remplacer FORM_URL dans lib/houblon/model.ts par le lien répondant affiché (jamais /edit).

## 3. Autoriser le site à lire le fichier privé
Dans Google Cloud Console (https://console.cloud.google.com/), créer ou choisir un projet, activer Google Sheets API, puis créer un compte de service. Aucun rôle de propriétaire du projet n'est nécessaire pour cette lecture.
Dans les clés du compte de service, créer une clé JSON. Conserver ce fichier privé, hors du dépôt et hors de public/. Certaines organisations interdisent les clés : dans ce cas, ne pas contourner leur règle.
Partager UNIQUEMENT le tableur maître avec l'adresse client_email du compte de service, en Lecteur. Ne pas rendre le tableur public et ne pas le partager aux équipages : il contient le brouillard, les preuves et les identifiants des participants.
Dans Vercel > projet Beer Road > Settings > Environment Variables, ajouter pour Production (et Preview uniquement si souhaité) :

| Nom | Valeur |
|---|---|
| GOOGLE_SERVICE_ACCOUNT_EMAIL | client_email du JSON |
| GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY | private_key du JSON, en conservant BEGIN/END et les retours à la ligne ; les séquences littérales \n sont aussi prises en charge |
| HOUBLON_SPREADSHEET_ID | 1Ku7l9K3S6NYaywNh85EKKRqrHYk3IWApsM4vlpPCpcc |

Ne pas préfixer ces variables par NEXT_PUBLIC. Les variables Supabase existantes restent nécessaires. Ne pas me transmettre la clé privée. Le compte de service peut lire tout le classeur : le serveur du site n'en demande et n'en retourne que les plages autorisées.

## 4. Vérifier puis envoyer — commandes Windows CMD
```bat
cd /d "C:\Techtune\Devt\Beer Road"
npm ci
npm test
npm run build
```
Si les vérifications passent :
```bat
git add app/api/houblon app/qg/maquette components/houblon lib/houblon scripts/houblon checks/houblon-google.test.cjs package.json package-lock.json public/sw.js
git commit -m "Beer Road V1.6.1 : carte Google Sheets et retrait de la maquette"
git push
```
Redéployer dans Vercel après ajout des variables si le déploiement précédent avait déjà démarré. Vérifier V1.6.1 sur le site.

## 5. Publier chaque vendredi : une seule validation
1. Mettre les relevés à jour dans le tableur maître, avec une période commune et les preuves validées.
2. Vérifier les quatre lignes du relevé dans EXPORT_PUBLIC : chacune doit indiquer Complet. Les totaux doivent correspondre au barème, sans données cachées.
3. Dans PUBLICATION, passer la date correspondante à Oui.
4. Ouvrir /qg avec un compte familial : Actualiser, ou attendre au plus une minute lorsque la page est visible. Avant le début de la course, les dates futures restent masquées même si elles sont autorisées.
5. Modifier le flash ou la bouteille dans Gérer la course > Publier une annonce, le défi ou les liens.

Pour corriger un relevé déjà publié : repasser sa date à Non, modifier les sources, vérifier les quatre équipages, remettre Oui. Le site reflète les modifications du tableur et ne fige pas une copie hebdomadaire ; utiliser l'historique des versions Google Sheets pour tracer les corrections. Pour conserver un ancien score inchangé, ne pas modifier les lignes sources historiques. Le barème doit être fixé avant le départ.

Les positions historiques et les traces des bateaux utilisent les relevés autorisés antérieurs. Si une lecture échoue, un message signale l'erreur ; les derniers chiffres déjà chargés peuvent rester visibles avec l'heure de leur dernière lecture réussie. Un nouvel utilisateur ne reçoit aucun faux classement de secours.

## 6. Arrivée
Le 28 février inclus clôture les 56 jours calendaires. Attendre la disponibilité des statistiques couvrant cette date et signaler leur fraîcheur. Exporter le Google Sheets en XLSX, ouvrir/recalculer/enregistrer dans Excel. Dans le QG, Gérer la course, importer ce fichier pour le classement FINAL uniquement. Vérifier les quatre scores, le malus Catamaran et les points privés ; confirmer explicitement la levée du brouillard (possible à partir du 1er mars). Pas de révélation automatique des plateformes privées.

## Contrôles encore nécessaires sur votre installation
Compte familial autorisé ; visiteur refusé ; aucun secret Google dans le navigateur ; dates sur Non absentes ; date complète sur Oui visible le moment venu ; total identique à EXPORT_PUBLIC ; erreur lisible si partage retiré ; lien Forms répondant correct. Ces tests nécessitent vos accès réels et ne sont pas réputés effectués par cette livraison.
