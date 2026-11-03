# Beer Road V1.5.3

Mise à jour depuis V1.5.2. Dans chaque médiathèque : audios, films et vidéos, PDF, images. Les numéros sont triés au sein de chaque type, sans mélange. Les numéros existants sont conservés : audio n° 1 et film n° 1 peuvent coexister. À numéro égal, l'ordre de création est conservé. Les groupes vides ne sont pas affichés. La liste administrateur suit aussi ce classement, par emplacement.

Pour modifier l'ordre d'un média déjà chargé : Médias → Gérer les médias → dans Ressources enregistrées, Modifier → changer Ordre dans ce type de média → Enregistrer. Le formulaire de modification se trouve au-dessus de la liste. Laisser le champ Fichier vide conserve le fichier existant. Pour les podcasts, le champ reste Numéro de l'épisode, unique de 1 à 12 : pour échanger deux numéros déjà occupés, utiliser temporairement un numéro libre, s'il en existe un.

Installation : extraire cette archive dans C:\Techtune\Devt\Beer Road, accepter les remplacements. Aucun SQL à exécuter, aucun média à recharger. Conserver .git et .env.local.

Dans CMD :
```cmd
cd /d "C:\Techtune\Devt\Beer Road"
npm ci
npm run build
```
Si le build réussit :
```cmd
git add -A
git commit -m "Beer Road V1.5.3 : medias regroupes par type et ordre"
git push
```

Après déploiement, actualiser et vérifier V1.5.3. Après modification d'un ordre, fermer puis rouvrir la rubrique pour actualiser la médiathèque.

Validation : build de production et TypeScript ; 10 tests ciblés réussis (tri, accès médias, cache). Pas de vérification sur un appareil physique ni de modification directe de votre base Supabase.
