# Beer Road V1.5.2

Mise à jour depuis V1.5.1. Titres permanents sur l'image : suppression des traits blancs, étiquettes vert olive sombre, texte lin et numéros ocre. Zones cliquables conservées sur PC et smartphone. La photographie n'est pas modifiée.

1. Extraire l'archive dans le dossier existant C:\Techtune\Devt\Beer Road. Accepter les remplacements, conserver .git et .env.local.
2. Dans Supabase > SQL Editor, exécuter `supabase/applications-v1.5.2.sql`. Ce script renseigne les quatre liens Ouvrir fournis : Cellio, Mealio, CookiWiki et Frosti. Les éventuels liens de téléchargement sont préservés. Rien n'a été modifié directement dans votre base depuis cette conversation.
3. Dans CMD :

```cmd
cd /d "C:\Techtune\Devt\Beer Road"
npm ci
npm run build
```

Si le build réussit :

```cmd
git add -A
git commit -m "Beer Road V1.5.2 : etiquettes discretes et liens des applications"
git push
```

Après déploiement, actualiser et vérifier V1.5.2. Fermer puis rouvrir l'Atelier pour voir les quatre adresses. L'accès et les comptes de chaque application restent gérés par celle-ci. Aucun lien d'installateur n'est créé.

Le build de production est vérifié. Le rendu sur un véritable navigateur mobile reste à vérifier sur votre appareil.
