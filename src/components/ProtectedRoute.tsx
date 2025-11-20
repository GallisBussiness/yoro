import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { authclient } from '../../lib/auth-client';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Composant pour protéger les routes qui nécessitent une authentification
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { data: session, isPending, error } = authclient.useSession();
  console.log(session)

  useEffect(() => {
    // Attendre que la vérification de session soit terminée
    if (!isPending) {
      // Si pas de session ou erreur, rediriger vers la page de connexion
      if (!session || error) {
        console.log('Session non trouvée, redirection vers /auth/signin');
        navigate('/auth/signin', { replace: true });
      }
    }
  }, [session, isPending, error, navigate]);

  // Afficher un loader pendant la vérification de la session
  if (isPending) {
    return (
      <Center style={{ height: '100vh' }}>
        <Loader size="xl" />
      </Center>
    );
  }

  // Si pas de session après vérification, ne rien afficher (redirection en cours)
  if (!session) {
    return null;
  }

  // Si session valide, afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;
