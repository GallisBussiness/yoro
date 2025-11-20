# Fix Session Better Auth - Documentation

## Problème
La session Better Auth était automatiquement supprimée après la connexion.

## Causes identifiées
1. **Absence de protection de routes** - Les routes du dashboard n'étaient pas protégées
2. **Configuration client incomplète** - Le client Better Auth n'était pas configuré pour maintenir les cookies
3. **Pas de gestion d'état de session** - Aucune vérification de session avant d'accéder aux routes protégées

## Solutions implémentées

### 1. Création du composant `ProtectedRoute`
**Fichier:** `src/components/ProtectedRoute.tsx`

Ce composant:
- Vérifie l'état de la session avec `authclient.useSession()`
- Affiche un loader pendant la vérification
- Redirige vers `/auth/signin` si pas de session
- Protège le contenu des routes authentifiées

### 2. Mise à jour de la configuration Better Auth
**Fichier:** `lib/auth-client.ts`

Ajout de:
```typescript
fetchOptions: {
    credentials: 'include',  // Important pour les cookies cross-origin
    onError(context) {
        if (context.error.status === 401) {
            console.error('Session expirée ou invalide');
        }
    }
}
```

### 3. Protection des routes dans App.tsx
**Fichier:** `src/App.tsx`

Enveloppement de la route `/dashboard/*` avec `ProtectedRoute`:
```typescript
<Route
  path="/dashboard/*"
  element={
    <ProtectedRoute>
      <PageTitle title="Gallis" />
      <Gescom />
    </ProtectedRoute>
  }
>
```

### 4. Simplification de Gescom.tsx
**Fichier:** `src/pages/Dashboard/Gescom.tsx`

- Suppression de la logique de vérification de session (maintenant dans ProtectedRoute)
- Code plus propre et maintenable

## Configuration Backend requise

Pour que la session fonctionne correctement, le backend NestJS doit avoir:

### 1. Configuration CORS
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,  // IMPORTANT
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
});
```

### 2. Configuration Better Auth (côté serveur)
```typescript
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: {
    // votre config DB
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 jours
    updateAge: 60 * 60 * 24, // Mettre à jour toutes les 24h
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7
    }
  },
  trustedOrigins: [process.env.FRONTEND_URL],
});
```

### 3. Variables d'environnement
**Frontend (.env):**
```
VITE_BACKURL=http://localhost:3000
```

**Backend (.env):**
```
FRONTEND_URL=http://localhost:5173
```

## Test de la solution

1. **Connexion:**
   - Se connecter via `/auth/signin`
   - Vérifier que la redirection vers `/dashboard` fonctionne

2. **Persistance:**
   - Rafraîchir la page (F5)
   - La session doit persister
   - Pas de redirection vers `/auth/signin`

3. **Protection:**
   - Essayer d'accéder à `/dashboard` sans être connecté
   - Doit rediriger vers `/auth/signin`

4. **Déconnexion:**
   - Se déconnecter
   - Essayer d'accéder à `/dashboard`
   - Doit rediriger vers `/auth/signin`

## Debugging

### Console du navigateur
```javascript
// Vérifier la session
authclient.useSession()

// Vérifier les cookies
document.cookie
```

### Network tab
- Vérifier que les requêtes incluent `credentials: 'include'`
- Vérifier la présence des cookies dans les headers

### Logs serveur
- Vérifier que les cookies sont reçus
- Vérifier que la session est validée correctement

## Problèmes courants

### Session perdue après refresh
**Cause:** CORS mal configuré ou cookies bloqués
**Solution:** Vérifier `credentials: 'include'` et configuration CORS

### Redirection infinie
**Cause:** Session non reconnue par le serveur
**Solution:** Vérifier que le backend valide correctement les cookies

### Erreur 401
**Cause:** Session expirée ou invalide
**Solution:** Vérifier `expiresIn` dans la config Better Auth

## Bonnes pratiques

1. **Toujours utiliser `credentials: 'include'`** pour les requêtes authentifiées
2. **Protéger toutes les routes sensibles** avec `ProtectedRoute`
3. **Gérer les erreurs de session** avec `onError` dans fetchOptions
4. **Logger les problèmes de session** pour faciliter le debugging
5. **Tester la persistance** après chaque modification

## Prochaines étapes

- [ ] Implémenter la gestion des abonnements (actuellement commentée)
- [ ] Ajouter un système de refresh token
- [ ] Implémenter la déconnexion automatique après inactivité
- [ ] Ajouter des tests pour la gestion de session
