# Beer Road V1.6.0 — Installation et publication de la Route du Houblon

## Ce qui est livré

Une nouvelle page /qg, accessible depuis « La Route des lendemains », et une démonstration /qg/maquette. Le QG réel utilise la connexion familiale existante. La maquette ne contient que des chiffres fictifs. La photo fournie est utilisée dans l’en-tête.

Le QG comporte : carte et historique, positions précédentes, classement détaillé avec ex æquo, quatre quinzaines, lien Google Forms, avis/flash météo, défi en cours, fiches des équipages avec deux chansons, règlement/calendrier et carnet de contributions.

Le bouton « Gérer la course » utilise les mêmes droits administrateur que « Gérer les médias ». Si d’autres personnes ont ce droit, elles peuvent aussi administrer la course. Les chiffres cachés ne sont jamais stockés sur le site avant la révélation finale.

## Installation — une seule fois

1. Sauvegarder le dossier actuel et le classeur maître.
2. Extraire le contenu de **Beer_Road_Mise_a_jour_V1.6.0.zip** dans **C:\Techtune\Devt\Beer Road**, en acceptant le remplacement des fichiers. Ne pas créer un autre projet et ne pas remplacer .git ou .env.local. Cette mise à jour s’applique à V1.5.4 avec son correctif d’installation.
3. Dans le projet Supabase utilisé par Beer Road, ouvrir **SQL Editor**, créer une requête, coller le contenu de **supabase/houblon-v1.6.0.sql**, puis cliquer sur **Run**. Cette migration dépend des fonctions familiales et administrateur déjà installées dans les versions précédentes. Elle ajoute les tables de course ; elle ne supprime pas les médias ou les contributions.
4. Dans **CMD Windows** :

```cmd
cd /d "C:\Techtune\Devt\Beer Road"
npm ci
npm run build
```

5. Si la compilation réussit :

```cmd
git add package.json package-lock.json components/plaque-modal.tsx components/community/shared.tsx components/houblon lib/houblon app/qg public/houblon public/sw.js supabase/houblon-v1.6.0.sql checks/houblon.test.cjs checks/houblon-ui.test.cjs checks/houblon-rls.cjs checks/service-worker.test.cjs LIRE-MOI-V1.6.0.md
git commit -m "Beer Road V1.6.0 : QG de la Route du Houblon"
git push
```

Vercel déploiera la nouvelle version depuis le dépôt habituel. Aucune nouvelle variable d’environnement n’est nécessaire, et aucune dépendance npm n’est ajoutée.

6. Après le déploiement, vérifier la version **V1.6.0**, ouvrir **La Route des lendemains → La Route du Houblon**, puis se connecter avec le compte familial administrateur.
7. Ouvrir **Gérer la course → Publier une annonce, le défi ou les liens des chansons**. Renseigner les liens YouTube et Spotify des deux chansons de chaque équipage, le règlement retenu, l’annonce et le défi. Cliquer sur **Publier les informations du QG**.
8. Vérifier le QG avec un compte familial non administrateur : la carte doit être accessible, le bureau du QG absent. Vérifier sur un téléphone réel avant le lancement.

Il n’y a aucune adresse Excel à configurer : il reste sur le PC. Le lien Google Forms fourni est déjà présent. L’accès effectif au formulaire et à ses pièces jointes doit être testé avec un compte d’équipage ; aucune réponse n’a été envoyée pendant le développement.

## Avant la course

- Faire la photo de départ le 3 janvier au soir. Course du 4 janvier à 00 h 00 au 28 février 2027 à 23 h 59, heure de Paris.
- Compléter les secondes chansons dans PARAMETRES!D40:D43. Ne pas changer les noms des quatre équipages : l’import les vérifie.
- Fixer le barème et mettre à jour tous les documents avant le lancement. Le classeur V5 reste à 10 écoutes = 1 point et 50 points par mission. La maquette illustre la proposition 5 / 20 ; ce n’est pas un changement du règlement réel.
- Les abonnés, preuves et activations Spinnaker restent dans le classeur privé et les outils du QG.

## Chaque vendredi — une seule saisie des chiffres

1. **Valider les preuves.** Consulter les réponses au Google Forms. Vérifier les captures et les doublons, puis compléter ABONNES, ACTIONS et le journal des bonus dans Excel. La liaison Google Forms → Excel n’est pas automatique dans cette version : l’arbitrage des preuves reste humain.
2. **Relever les statistiques.** Dans RELEVES, choisir le vendredi concerné. Saisir une ligne par chanson et par plateforme publique : 4 équipages × 2 chansons × 2 plateformes = **16 lignes**, y compris les vrais zéros. Renseigner les écoutes/vues cumulées depuis le 4 janvier et les audiences correspondantes, avec une période de mesure cohérente. Ne pas additionner les relevés successifs.
3. **Préciser la fraîcheur.** Le vendredi est la date du pointage publié. Si les consoles ont un décalage, l’indiquer dans la note publique (ex. « Relevé du vendredi à 18 h ; statistiques disponibles jusqu’au jeudi soir »). Ne pas présenter un vendredi encore en cours comme une journée complète. Pour des données non comparables entre équipages, attendre ou conserver le relevé précédent.
4. **Contrôler Excel.** Vérifier les messages de contrôle dans RELEVES et les quatre lignes du relevé dans EXPORT_PUBLIC. Elles doivent toutes indiquer « Complet ». Recalculer dans Excel avec **Ctrl + Alt + F9**, puis enregistrer avec **Ctrl + S**. Le lecteur du site lit les résultats mémorisés par Excel ; il n’exécute aucune formule.
5. **Importer.** Sur Beer Road, ouvrir **QG → Gérer la course → Excel de suivi**, puis sélectionner le fichier .xlsx enregistré. Le classeur reste dans le navigateur : aucun fichier maître n’est envoyé au serveur.
6. **Vérifier l’aperçu.** Choisir le relevé à publier. Vérifier les quatre scores et le barème affiché. Ajouter une note sur la fraîcheur des chiffres et un bref commentaire de course.
7. **Publier.** Cocher la vérification, puis cliquer sur **Publier le relevé**. La carte et l’historique sont calculés automatiquement. Aucun dessin de bateau, aucune copie de score et aucun nouveau déploiement Vercel ne sont nécessaires.
8. **Actualiser l’animation.** Modifier si besoin l’avis aux navigateurs et le défi, puis cliquer sur **Publier les informations du QG**. Vérifier le résultat dans la vue équipage.

Relevés du vendredi : 8, 15, 22 et 29 janvier ; 5, 12, 19 et 26 février. Les bouées des 17 janvier, 31 janvier et 14 février et l’arrivée du 28 février constituent des relevés supplémentaires ; ils permettent de figer les fins de quinzaine.

Les visiteurs peuvent utiliser « Actualiser » pour charger un relevé nouvellement publié. Il n’y a pas de connexion temps réel permanente ni d’envoi automatique WhatsApp.

## Corriger une erreur

Corriger Excel, recalculer, enregistrer, puis réimporter et choisir la même date. La publication demande un motif de correction. L’ancienne version est conservée dans un historique réservé à l’administration ; l’interface présente la nouvelle révision.

Si deux fenêtres administrateur sont ouvertes, une modification concurrente est refusée : actualiser et vérifier avant de republier. Pour annuler une publication accidentelle, utiliser « Corriger ou retirer un relevé publié → Retirer → Confirmer le retrait ». Une copie de la version retirée est conservée en base.

Les positions précédentes sont calculées à partir du précédent relevé effectivement publié. Si une semaine manque, elles ne sont pas inventées à zéro. Une correction d’un ancien relevé est prise en compte dans les comparaisons affichées.

## Arrivée et révélation finale

Clore les activités le 28 février à 23 h 59 (Paris), puis attendre les données nécessaires. Dans Excel, renseigner les **40 lignes finales** : 8 chansons × Spotify, YouTube, Apple Music, Deezer, Amazon Music. Toutes doivent être valides. Les bonus, abonnés et règles finales sont vérifiés par le QG.

L’import propose alors, en plus du relevé public, **RÉVÉLATION FINALE**. Cette option lit les totaux finaux du QG, malus Catamaran inclus. Elle exige une case de confirmation supplémentaire et ne peut être publiée avant le 1er mars. Elle rend publics les points toutes plateformes, mais pas les noms des abonnés, les preuves ou le détail de chaque plateforme masquée.

## Limites et vérifications réalisées

- Compilation de production et TypeScript vérifiés.
- Tests de lecture du vrai V5 vide, relevés incomplets, totaux incohérents, erreurs Excel, équipages dupliqués et dates.
- Tests du parcours import → contrôle → publication, et erreur réseau, sous DOM simulé.
- Tests PostgreSQL locaux : droits administrateur/membre/extérieur/anonyme, refus d’un relevé futur, conflits de révision, rejet de champs supplémentaires, corrections et retrait.
- Maquette visuelle contrôlée en navigateur, largeur ordinateur et cadre smartphone. Le changement de relevé et les positions précédentes ont été vérifiés.
- La connexion réelle à ton Supabase, sa migration, le déploiement Vercel et les essais sur ton téléphone restent à effectuer dans ton environnement. Le navigateur de prévisualisation fourni ici ne lance pas directement le serveur Next.js ; la maquette utilise le même composant de carte.
- L’import ne certifie pas la sincérité des statistiques ni des preuves et ne détecte pas des résultats de formules tous restés cohérents mais anciens. Le recalcul/enregistrement d’Excel est indispensable.
