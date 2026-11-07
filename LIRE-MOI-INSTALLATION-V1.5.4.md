# Correctif installation V1.5.4

Corrige uniquement package-lock.json. Les dépendances sont restaurées à leur état V1.5.3, notamment lru-cache 11.5.3. La version de l’application reste 1.5.4 et les correctifs du bouton Modifier sont conservés.

Extraire package-lock.json dans C:\Techtune\Devt\Beer Road en remplaçant le fichier existant. Aucun SQL.

Dans CMD :
```cmd
cd /d "C:\Techtune\Devt\Beer Road"
npm ci
npm run build
```
Si les deux commandes réussissent :
```cmd
git add package-lock.json
git commit -m "Corrige les dependances du correctif V1.5.4"
git push
```
