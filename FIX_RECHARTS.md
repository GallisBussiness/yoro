# Fix Recharts Error - Instructions

## Problème
Erreur: "Function components cannot have string refs" avec Recharts

## Solution

### Étape 1: Supprimer le cache de Vite et node_modules
```powershell
# Arrêter le serveur de développement (Ctrl+C)

# Supprimer node_modules et le cache
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force node_modules/.vite

# Supprimer le fichier de lock
Remove-Item pnpm-lock.yaml
```

### Étape 2: Réinstaller les dépendances
```powershell
pnpm install
```

### Étape 3: Redémarrer le serveur
```powershell
pnpm dev
```

## Vérification
Le fichier `package.json` doit contenir:
```json
"recharts": "2.12.7"
```

Cette version est stable avec React 18.2.0.

## Alternative si le problème persiste
Si l'erreur persiste après ces étapes, essayez:

```powershell
# Forcer la réinstallation de recharts
pnpm remove recharts
pnpm add recharts@2.12.7
pnpm dev
```
