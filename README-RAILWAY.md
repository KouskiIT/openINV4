# 🚀 Déploiement Railway - Système de Gestion d'Inventaire

Ce guide vous aide à déployer votre système de gestion d'inventaire sur Railway avec PostgreSQL.

## 📋 Prérequis

1. Compte Railway (railway.app)
2. Repository Git (GitHub/GitLab)
3. Données d'inventaire existantes

## 🛠️ Étapes de Déploiement

### 1. Préparation des Données

Exportez vos données actuelles pour la migration :

```bash
# Exporter les données de Replit vers Railway
npm run railway:export
```

Cela créera un fichier JSON avec toutes vos données dans le dossier `railway-export/`.

### 2. Configuration Railway

1. **Créer un nouveau projet sur Railway**
   - Connectez votre repository GitHub
   - Sélectionnez ce projet

2. **Ajouter PostgreSQL**
   - Dans Railway, cliquez sur "New Service"
   - Sélectionnez "PostgreSQL"
   - Attendez que la base soit provisionnée

3. **Variables d'environnement**
   - `DATABASE_URL`: Automatiquement configurée par Railway
   - `SESSION_SECRET`: Générez une clé secrète forte
   - `NODE_ENV`: `production`

### 3. Configuration du Build

Railway utilisera automatiquement :
- `railway.json` pour la configuration
- `nixpacks.toml` pour les dépendances système
- `Dockerfile` comme option alternative

### 4. Migration des Données

Une fois déployé sur Railway :

1. **Pousser le schéma de la base**
   ```bash
   # Dans le terminal Railway
   npm run db:push
   ```

2. **Importer vos données**
   ```bash
   # Uploadez votre fichier d'export et importez
   npm run railway:import railway-export/inventory-export-[date].json
   ```

### 5. Vérification du Déploiement

1. **Health Check**
   - URL: `https://votre-app.railway.app/api/health`
   - Doit retourner `{ "status": "ok" }`

2. **Test de l'Application**
   - Interface d'inventaire accessible
   - Recherche fonctionnelle
   - Scanner de codes-barres opérationnel

## 📁 Structure des Fichiers de Déploiement

```
├── railway.json          # Configuration Railway
├── nixpacks.toml         # Dependencies système
├── Dockerfile            # Container configuration
├── healthcheck.js        # Health check endpoint
├── scripts/
│   ├── migrate-db.js     # Migration de la base
│   ├── backup-export.js  # Export des données
│   └── railway-import.js # Import des données
└── railway-export/       # Données exportées
```

## 🔧 Commandes Utiles

```bash
# Export des données
npm run railway:export

# Import des données
npm run railway:import <fichier-export.json>

# Migration de la base
npm run railway:migrate

# Push du schéma
npm run db:push
```

## 🛡️ Sécurité

- ✅ HTTPS automatique avec Railway
- ✅ Variables d'environnement sécurisées
- ✅ Rate limiting configuré
- ✅ Validation des inputs
- ✅ Sessions sécurisées

## 📊 Monitoring

Railway fournit automatiquement :
- Logs d'application
- Métriques de performance
- Health checks
- Alertes de disponibilité

## 🎯 Fonctionnalités Disponibles

- ✅ Gestion complète d'inventaire
- ✅ Scanner de codes-barres (caméra)
- ✅ Import/Export Excel
- ✅ Génération PDF
- ✅ Recherche avancée
- ✅ Interface mobile optimisée
- ✅ Thèmes sombre/clair
- ✅ Système d'audit
- ✅ Sauvegarde automatique

## 🚨 Dépannage

### Problème de connexion à la base
```bash
# Vérifier les variables d'environnement
echo $DATABASE_URL
```

### Erreur de migration
```bash
# Réinitialiser et repousser le schéma
npm run db:push
```

### Performance lente
- Vérifiez les logs Railway
- Optimisez les requêtes dans les métriques

## 📞 Support

En cas de problème :
1. Consultez les logs Railway
2. Vérifiez les variables d'environnement
3. Testez la connectivité à la base
4. Contactez le support Railway si nécessaire

---

🎉 **Votre système d'inventaire est maintenant prêt pour la production sur Railway !**