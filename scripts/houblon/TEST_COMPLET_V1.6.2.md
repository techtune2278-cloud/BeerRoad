# Beer Road V1.6.2 — répétition générale

## Ce qui est livré
Un bouton administrateur « Tester la chaîne », une page /qg/test avec la vraie carte et son historique, une lecture du Google Sheets TEST distinct, et un script de préparation de deux relevés fictifs. Les dates de janvier peuvent être testées dès maintenant. Les contrôles habituels restent actifs : relevé complet, quatre équipages, total cohérent, publication autorisée.

Les tests ne publient aucun score dans Supabase et ne changent pas les positions de la course réelle. Un membre non administrateur ne peut pas lire la source TEST, même en saisissant l'adresse directement. Le serveur refuse d'utiliser le même identifiant pour le fichier réel et la copie TEST.

La livraison est préparée et testée localement. Elle n'est pas déployée sur votre Vercel. Aucune copie ou modification Drive n'a été effectuée à distance. Le test du formulaire conserve la validation/reprise manuelle des preuves : aucune attribution automatique de points n'est ajoutée.

## 1. Corriger une erreur détectée dans le fichier maître
L'inspection du fichier réel a révélé une erreur dans CALCULS!K65 et K66 : une virgule ajoutée par le script précédent devant une expression utilisant des points-virgules. Le correctif examine K65:K112 et ne change que ce séparateur erroné ; aucun compteur n'est modifié. La lecture de la page du site réussissait malgré cela car aucune date n'était publiée.

1. Ouvrir le fichier maître : https://docs.google.com/spreadsheets/d/1jJMW7juxDDE1GK5-qxWmZimF-ugiEjDTAAeDx3rp6rw/edit
2. Fichier > Créer une copie, nommer « Sauvegarde Houblon avant test ». Revenir ensuite au fichier maître.
3. Extensions > Apps Script : ajouter un NOUVEAU fichier TestHoublon. Y coller le contenu de scripts/houblon/TestHoublon.gs fourni dans le ZIP. Garder Houblon.gs existant.
4. Enregistrer, sélectionner reparerSeparateurHoublon et Exécuter.
5. Le journal doit indiquer le nombre de formules corrigées puis « aucune erreur dans les 48 formules ». Si une erreur reste, s'arrêter et transmettre le message. Ne pas relancer appliquerBaremeV6.

## 2. Créer et préparer la copie TEST
1. Depuis le fichier maître corrigé, Fichier > Créer une copie. Nom exact conseillé : « Houblon — TEST ». Ne pas recopier les autorisations de partage avec les équipages.
2. Ouvrir cette copie, puis Extensions > Apps Script. Les scripts liés sont normalement copiés ; si TestHoublon n'y apparaît pas, y ajouter le fichier fourni.
3. Sélectionner preparerRepetitionHoublon, puis Exécuter. Autoriser l'accès au tableur si demandé.
4. Le script refuse le fichier maître et tout fichier dont le nom ne contient pas TEST. Dans la copie uniquement, il vide les cellules de saisie de RELEVES, ABONNES, ACTIONS et les attributions de bonus, puis crée les deux relevés de test. Les formules et validations sont conservées. Les réponses Forms historiques éventuellement copiées ne sont pas de nouvelles réponses de test : ne pas les reporter.
5. Le journal doit annoncer « OK : 8 scores vérifiés ». Un onglet TEST_CONTROLES est ajouté. Il indique les valeurs attendues. Ne pas relancer le script pour réinitialiser : sa seconde exécution est bloquée afin de préserver vos essais.
6. Le journal affiche HOUBLON_TEST_SPREADSHEET_ID = suivi de l'identifiant de la copie. Conserver cet identifiant.
7. Partager seulement la copie TEST, en Lecteur, avec : beer-road-lecture@certain-beach-514011-r3.iam.gserviceaccount.com

PUBLICATION contient Oui pour les 8 et 15 janvier dans la copie TEST ; toutes les autres dates restent sur Non. Le script conserve les huit chansons réellement affectées aux équipages dans PARAMETRES, et désactive le Spinnaker uniquement dans la copie pour obtenir 3 points par abonnement test.

## 3. Installer le site
Prérequis : la V1.6.1 fonctionne déjà. Copier les fichiers de Beer_Road_Mise_a_jour_V1.6.2.zip dans le dossier existant C:\Techtune\Devt\Beer Road, en acceptant le remplacement. Ne pas remplacer .env.local.

Dans Vercel > projet Beer Road > Settings > Environment Variables, ajouter une seule variable pour Production :

HOUBLON_TEST_SPREADSHEET_ID = l'identifiant affiché à l'étape précédente.

Conserver HOUBLON_SPREADSHEET_ID actuel et les deux variables GOOGLE_SERVICE_ACCOUNT_* : ne pas les remplacer par ceux d'un autre compte. Le même compte de service lit la copie partagée.

Commandes Windows CMD :
```bat
cd /d "C:\Techtune\Devt\Beer Road"
npm ci
npm test
npm run build
```
Si tout est OK :
```bat
git add app/api/houblon/google-sheet/route.ts app/qg/test components/houblon/race-page.tsx components/houblon/race-test-page.tsx lib/houblon/api.ts scripts/houblon checks/houblon-google.test.cjs checks/houblon-test-script.test.cjs package.json package-lock.json public/sw.js
git commit -m "Beer Road V1.6.2 : repetition generale administrateur"
git push
```
Attendre le déploiement Ready. Si les variables ont été ajoutées après le déploiement, faire Redeploy.

## 4. Vérifier immédiatement les bateaux
Avec le compte administrateur, ouvrir le QG puis « Tester la chaîne ». Le bandeau doit indiquer TEST ADMINISTRATEUR. La page relit la copie chaque minute lorsqu'elle est visible ; Actualiser le test permet de le faire immédiatement.

| Équipage | Total au 8 janvier | Total au 15 janvier | Rang au 8 → au 15 |
|---|---:|---:|---|
| Alexis & Marie | 60 | 120 | 1 → 2 |
| Anne & Vincent | 48 | 156 | 2 → 1 |
| Laure & Mehdy | 36 | 108 | 3 → 3 |
| Emmanuelle & Robin | 24 | 84 | 4 → 4 |

Les totaux viennent des cellules de saisie, pas de valeurs forcées dans EXPORT_PUBLIC. Chaque équipage a quatre lignes publiques par relevé : deux titres × Spotify/YouTube. Au 8 janvier, les écoutes par ligne sont 25/20/15/10 selon l'équipage et les audiences 5/4/3/2. Au 15 janvier : écoutes 50/65/45/35 et audiences 10/13/9/7. Exemple Alexis au 8 : 4 × 25 / 5 + 4 × 5 × 2 = 60.

Sélectionner le 8 janvier puis le 15 janvier. Le second relevé doit montrer les positions antérieures et le changement de tête. Revenir au QG normal : aucun de ces relevés fictifs ne doit y apparaître.

## 5. Tester aussi le formulaire, sans toucher au vrai
1. Ouvrir le vrai formulaire en modification : https://docs.google.com/forms/d/1vMCxGNsFMiYxwWTqpQR2ckYw2KxDJVn0qpJoMHLZhKk/edit
2. Menu ⋮ > Créer une copie. Nommer la copie « Houblon — FORMULAIRE TEST ».
3. Dans la COPIE du formulaire seulement, Réponses > sélectionner la destination des réponses > feuille existante : choisir « Houblon — TEST ». Ne jamais dissocier le formulaire réel.
4. Cliquer l'icône verte Sheets depuis le formulaire TEST : elle doit ouvrir la copie TEST. Un nouvel onglet de réponses est créé, distinct de l'onglet historique copié.
5. Utiliser le lien répondant de cette copie, activer l'acceptation des réponses / publier le formulaire si Google le demande. Ne pas distribuer ce lien aux équipages.
6. Envoyer une preuve fictive d'abonnement : Alexis & Marie, YouTube, pseudo TEST-ABO-001. Indiquer une date d'action simulée du 10 janvier 2027 si le formulaire propose ce champ. Si une pièce est obligatoire, utiliser une image portant clairement TEST, sans données personnelles.
7. Vérifier que cette réponse arrive dans le nouvel onglet de réponses du TEST, et pas dans le fichier maître.
8. Après vérification de cette preuve fictive, reporter manuellement dans ABONNES, ligne 6 de la copie TEST :

| Colonne | Valeur |
|---|---|
| A — date de l'abonnement | 10/01/2027 (véritable date de cellule) |
| B — équipage | Alexis & Marie |
| C — plateforme | YouTube |
| D — pseudo | TEST-ABO-001 |
| E — abonnement confirmé | Oui |
| F — preuve reçue | Oui |
| G — preuve | Réponse TEST-ABO-001 du formulaire TEST (ou lien de la preuve fictive) |
| H — commentaire | Répétition générale — action simulée |

Ne pas changer l'horodatage réel de la réponse Forms. Le 10 janvier est une date d'action fictive saisie dans l'onglet de calcul pour simuler la course.

Résultats : ABONNES!M6 = OK, K6 = 3, Spinnaker = Non. Le total d'Alexis reste à 60 au 8 janvier, passe à 123 au 15 janvier. Sur /qg/test, Actualiser : la carte et le tableau de points doivent reprendre 123.

## 6. Vérifier les erreurs, le brouillard et le plafond
- Doublon : recopier A6:H6 dans A7:H7 d'ABONNES TEST. La deuxième ligne doit indiquer Doublon et 0 point ; Alexis reste à 123. Vider A7:H7 ensuite, en conservant les formules I:O.
- Preuve non validée : mettre F6 sur Non. Alexis redescend à 120 au 15 janvier. Remettre Oui : 123.
- Brouillard : RELEVES!F38 contient 50 000 écoutes Deezer fictives. Le score PUBLIC d'Alexis doit rester 123, même en changeant F38. Le test ne révèle jamais le classement final privé.
- Bonus : dans PARAMETRES TEST, utiliser la ligne 87 : A87 « Bonus TEST », B87 « Vendredi 15/01 », C87 « Alexis & Marie », D87 20, F87 « Preuve fictive », G87 date 12/01/2027. Ne pas toucher E87. Alexis passe à 143 au 15 janvier, reste à 60 au 8.
- Plafond : passer D87 à 150. Avec le plafond global 100, Alexis passe à 223 (120 écoutes/audience + 3 abonnement + 100 bonus), puis remettre D87 à 20.
- Publication : dans PUBLICATION TEST, mettre B3 sur Non : le relevé du 15 disparaît ; il reste celui du 8. Remettre Oui.
- Relevé incomplet : vider temporairement RELEVES!F6. La page TEST doit afficher une erreur de relevé incomplet, sans carte périmée. Remettre 25.
- Autorisations : un membre familial non administrateur ouvrant /qg/test doit recevoir un refus, sans chiffres. Le bouton n'apparaît que pour l'administrateur.

## Fin du test
Retourner à /qg. Conserver les fichiers TEST pour d'autres essais ou fermer l'acceptation des réponses du formulaire TEST. Ne pas transférer les chiffres fictifs au maître. Le test valide la chaîne saisie/validation/calcul/lecture/affichage ; il ne certifie pas la collecte des statistiques auprès des plateformes et ne rend pas automatique la validation des preuves.
