import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '../components/shadcn/button';

function P404() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-card shadow-lg border border-border">
          <Compass className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-7xl font-bold tracking-tight text-foreground">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Désolé, la page que vous recherchez n'existe pas.
        </p>
        <Button asChild className="mt-8" size="lg">
          <Link to="/auth/signin">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}

export default P404;
