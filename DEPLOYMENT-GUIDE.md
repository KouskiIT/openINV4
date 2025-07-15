# 🚀 Guide de Déploiement Railway - Pas à Pas

## 🎯 Objectif
Déployer votre système de gestion d'inventaire avec 1363 articles sur Railway avec PostgreSQL.

## ✅ Préparatifs Terminés

**Données Exportées :**
- ✅ 1363 articles d'inventaire 
- ✅ 1 utilisateur
- ✅ Fichier d'export créé : `railway-export/inventory-export-2025-07-15T12-19-02-141Z.json`

**Fichiers de Configuration Créés :**
- ✅ `railway.json` - Configuration Railway
- ✅ `nixpacks.toml` - Dépendances système  
- ✅ `Dockerfile` - Configuration container
- ✅ `healthcheck.js` - Vérification de santé
- ✅ Scripts de migration dans `scripts/`

## 📝 Étapes à Suivre

### 1. Créer le Projet Railway

1. **Aller sur [railway.app](https://railway.app)**
2. **Se connecter avec GitHub**
3. **Créer un nouveau projet :**
   - Cliquer "New Project"
   - Sélectionner "Deploy from GitHub repo"
   - Choisir votre repository

### 2. Ajouter PostgreSQL

1. **Dans votre projet Railway :**
   - Cliquer "New Service"
   - Sélectionner "PostgreSQL"
   - Attendre le provisionnement (2-3 minutes)

### 3. Configurer les Variables

1. **Dans Settings → Variables :**
   ```
   NODE_ENV=production
   SESSION_SECRET=generer-une-cle-secrete-forte-ici
   ```
   
   **Note :** `DATABASE_URL` est automatiquement configurée par Railway

### 4. Déployer l'Application

1. **Railway va automatiquement :**
   - Détecter votre `railway.json`
   - Installer les dépendances
   - Builder l'application
   - Démarrer le serveur

### 5. Configurer la Base de Données

1. **Ouvrir le Terminal Railway :**
   - Dans votre service app
   - Cliquer "Terminal"

2. **Pousser le schéma :**
   ```bash
   npm run db:push
   ```

### 6. Importer vos Données

1. **Uploader le fichier d'export :**
   - Glisser-déposer `railway-export/inventory-export-2025-07-15T12-19-02-141Z.json`
   - Dans le terminal Railway

2. **Importer les données :**
   ```bash
   node scripts/railway-import.js inventory-export-2025-07-15T12-19-02-141Z.json
   ```

### 7. Vérification

1. **Tester l'URL générée :**
   - `https://votre-projet.railway.app`
   - Vérifier que l'interface se charge

2. **Health Check :**
   - `https://votre-projet.railway.app/api/health`
   - Doit afficher `{"status":"ok"}`

3. **Test des fonctionnalités :**
   - Recherche d'articles
   - Scanner de codes-barres
   - Statistiques d'inventaire

## 🔍 Points de Contrôle

**Après le déploiement, vérifiez :**
- [ ] Application accessible sur Railway URL
- [ ] Health check fonctionnel
- [ ] Base de données connectée
- [ ] 1363 articles importés
- [ ] Interface mobile responsive
- [ ] Scanner de codes-barres opérationnel

## 🆘 Dépannage Rapide

**Si le build échoue avec "exit code: 127" :**
- Railway utilisera automatiquement `nixpacks.toml` 
- Le script `railway-build.js` est configuré pour gérer les dépendances
- Vérifiez les logs de build dans Railway Dashboard

**Si l'application ne démarre pas :**
```bash
# Vérifier les logs dans Railway Dashboard
# Ou vérifier les variables d'environnement dans Settings
```

**Si la base ne se connecte pas :**
```bash
echo $DATABASE_URL
# Doit afficher l'URL PostgreSQL Railway
```

**Si les données ne s'importent pas :**
```bash
# Relancer la migration
npm run db:push
# Puis reimporter
node scripts/railway-import.js [fichier-export]
```

**Solutions aux erreurs communes :**
- **Build Error 127** : Dépendances manquantes → Railway gérera automatiquement
- **Module Not Found** : Vérifier que toutes les dépendances sont dans package.json
- **Database Connection** : S'assurer que PostgreSQL est déployé et DATABASE_URL configurée

## 🎉 Résultat Final

Une fois terminé, vous aurez :
- ✅ Application en production sur Railway
- ✅ Base PostgreSQL avec vos 1363 articles
- ✅ URL publique accessible
- ✅ HTTPS automatique
- ✅ Monitoring intégré
- ✅ Déploiement automatique sur Git push

**Votre système d'inventaire sera prêt pour un usage professionnel !**