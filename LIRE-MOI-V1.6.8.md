# Beer Road V1.6.8 — La Route du Houblon - QG Web

## Installer sur le site
Cette archive est une mise à jour à appliquer à la V1.6.7. Copier son contenu dans le dossier Beer Road en acceptant le remplacement des fichiers. Ne pas créer un deuxième dossier de projet.
Dans CMD :
```bat
cd /d "C:\Techtune\Devt\Beer Road"
npm run build
git add components/houblon lib/houblon app/qg app/api/houblon scripts/houblon checks/houblon-test-script.test.cjs checks/houblon-qg.test.cjs checks/houblon-google.test.cjs public/sw.js package.json package-lock.json LIRE-MOI-V1.6.8.md supabase/controle-acces-famille.sql
git commit -m "V1.6.8 : QG Web simplifie, Amazon et nouveau test"
git push
```
Vérifier le déploiement Vercel puis la version V1.6.8. Aucune nouvelle dépendance.
Le site n'a pas été déployé depuis cette conversation.

## Ce qui change
Titre QG Web. Suppression du bouton Écouter les équipages, de la section avec les huit chansons, du défi en cours et des avis aux navigateurs. WhatsApp porte les annonces. Les noms restent sur les bateaux : indispensables pour lire la carte. Les contributions familiales restent disponibles.
Règles définitives intégrées au code : les anciens textes enregistrés dans Supabase ne peuvent plus réintroduire le barème provisoire. Les champs d'annonces/liens/règles sont retirés du Bureau.
Brume remplace Brouillard dans les textes du site. Dans le tableur, la valeur technique « Brouillard » est conservée pour compatibilité : ne pas la renommer manuellement.
Le tableur officiel a été aligné : Spotify + YouTube + Amazon Music publics pour écoutes et audiences ; Deezer et Apple Music masqués. Les dates PUBLICATION restent toutes à Non. Aucun compteur réel n'a été ajouté.

## Le Bureau : à quoi sert-il ?
« Gérer la course » ouvre un espace réservé aux administrateurs.
Pendant la course : saisir dans Sheets, contrôler, puis mettre Oui dans PUBLICATION. La carte se rafraîchit chaque minute et refuse les dates futures hors mode TEST.
Le Bureau sert à publier le classement FINAL :
1. Après l'arrivée, compléter les cinq plateformes et les audiences des trois plateformes ; vérifier les contrôles.
2. Dans Google Sheets : Fichier > Télécharger > Microsoft Excel (.xlsx).
3. Depuis le 1er mars 2027 : Gérer la course > sélectionner ce fichier.
4. Choisir Classement final, vérifier les quatre scores, ajouter une note si nécessaire.
5. Cocher le contrôle et la levée de la brume, puis publier.
6. En cas de correction, réimporter le fichier final corrigé et donner le motif. Le retrait final se fait dans le Bureau.
Les relevés provisoires restent gérés dans PUBLICATION, pas dans le Bureau. Dépublier un provisoire = Non sur sa date.
Autre possibilité pour le final : après validation, mettre Oui au 28 février dans PUBLICATION. Le QG affiche alors le classement final depuis Sheets, seulement à partir du 1er mars. Un import final publié dans le Bureau est prioritaire sur ce résultat Sheets ; pour revenir à Sheets, retirer cet import dans le Bureau.
Le mode TEST ne teste pas la publication finale Supabase. Il teste la copie Sheets, les calculs publics et l'affichage de la carte.

## Remettre le TEST à jour (méthode recommandée)
Ne pas recopier quelques onglets dans l'ancien TEST : les formules, plages nommées et contrôles ont changé.
1. Ouvrir l'officiel https://docs.google.com/spreadsheets/d/1jJMW7juxDDE1GK5-qxWmZimF-ugiEjDTAAeDx3rp6rw/edit
2. Fichier > Créer une copie. Nommer « Houblon TEST 13 novembre 2026 ». Conserver cette copie privée. L'ancien TEST reste intact.
3. Dans cette nouvelle copie, vérifier que DEPART, SUIVI_TITRES, SUIVI_COMPTES, RELEVES, CALCULS, EXPORT_PUBLIC, BAREME_V6 et PUBLICATION existent.
4. Partager la nouvelle copie en Lecteur avec l'adresse GOOGLE_SERVICE_ACCOUNT_EMAIL déjà configurée dans Vercel.
5. Extensions > Apps Script. Si un fichier TestHoublon existe, remplacer SON contenu ; sinon le créer. Coller le fichier scripts/houblon/TestHoublon.gs de cette archive. Ne pas toucher aux autres scripts. Ne pas garder deux définitions de preparerRepetitionHoublon.
6. Exécuter preparerRepetitionHoublon. Ce script refuse l'officiel, un fichier sans TEST dans son nom et une copie contenant déjà des mesures. Il ne touche qu'à la copie ; il utilise les nouvelles colonnes de SUIVI_TITRES. Ne pas relancer appliquerBaremeV6.
7. Le journal doit indiquer OK. Dans TEST_CONTROLES, les huit contrôles doivent être OK. Le script autorise alors les deux premières dates.
8. Dans Vercel > projet Beer Road > Settings > Environment Variables, remplacer UNIQUEMENT HOUBLON_TEST_SPREADSHEET_ID par l'identifiant de la nouvelle copie, entre /d/ et /edit dans son URL. Ne pas modifier HOUBLON_SPREADSHEET_ID.
9. Redéployer le projet pour appliquer la variable.
10. Ouvrir /qg/test avec le compte administrateur, puis Actualiser le test.
Scores attendus :
| Équipage | 8 janvier | 15 janvier |
|---|---:|---:|
| Marie & Alexis | 90 | 180 |
| Anne & Vincent | 72 | 234 |
| Laure & Mehdy | 54 | 162 |
| Emmanuelle & Robin | 36 | 126 |
Amazon compte. Les 50 000 écoutes fictives par titre sur Deezer et Apple ne comptent pas dans ce provisoire.
Si le script signale une erreur, lire TEST_CONTROLES et les contrôles de SUIVI_TITRES. Il ne remet pas à zéro une copie existante. Ne pas répéter le script : créer une nouvelle copie après correction de la cause.
Après les essais, conserver cette copie TEST ou mettre ses publications à Non. L'officiel n'est jamais affecté.

## Tester le formulaire
La copie du classeur n'associe pas automatiquement le formulaire de test à la nouvelle copie.
Garder le formulaire OFFICIEL associé à l'officiel. Dans une COPIE du formulaire portant TEST, ouvrir Réponses > Associer à Sheets > sélectionner le nouveau classeur TEST. Ne pas modifier la destination du formulaire officiel.
Une réponse Forms ne crée pas automatiquement des points : valider puis reporter dans ABONNES, ACTIONS ou les cellules du journal prévues.
Ne pas mettre de preuve fictive dans le formulaire officiel.

## Première connexion de la famille
Le code crée automatiquement le compte par lien e-mail (shouldCreateUser=true), mais l'accès dépend de family_members et de l'envoi réel des messages.
Le fichier supabase/controle-acces-famille.sql est une requête de lecture à lancer dans Supabase SQL Editor : vérifier que les huit personnes sont présentes avec la bonne adresse.
Dans Supabase Authentication, vérifier :
- fournisseur Email activé et création de nouveaux comptes autorisée ;
- envoi SMTP personnalisé configuré (ou hook d'envoi fonctionnel) : le SMTP par défaut refuse les adresses hors de l'équipe Supabase ;
- Site URL et Redirect URLs autorisent le domaine Vercel/de production réellement utilisé.
La connexion renvoie à l'accueil Beer Road : ouvrir ensuite QG Web. Aucun compte Supabase administratif n'est à créer pour les équipages.
Faire un essai avec une personne, dans son navigateur : adresse > lien reçu > clic > accès au QG. Je n'ai pas envoyé de lien à la famille ni vérifié les paramètres Supabase en production.
Documentation : https://supabase.com/docs/guides/auth/auth-smtp

## Dates vérifiées
Départ lundi 4 janvier 2027 ; arrivée dimanche 28 février à 23 h 59 Paris : 56 jours inclus.
Vendredis : 8, 15, 22, 29 janvier ; 5, 12, 19, 26 février.
Bouées : 17 janvier, 31 janvier, 14 février. Dernière quinzaine : 15–28 février.
Résultats au plus tard 48 h après l'arrivée selon le règlement ; préparer les exports rapidement et vérifier les délais statistiques.
Le règlement remis aux équipages et le manuel doivent mentionner Amazon dans le provisoire et employer Brume.
