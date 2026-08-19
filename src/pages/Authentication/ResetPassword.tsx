import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Lock, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { authclient } from '../../../lib/auth-client';
import { Card, CardContent } from '../../components/shadcn/card';
import { Input } from '../../components/shadcn/input';
import { Button } from '../../components/shadcn/button';
import { Label } from '../../components/shadcn/label';

const schema = z
  .object({
    password: z
      .string()
      .min(1, 'Veuillez entrer votre nouveau mot de passe')
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les deux mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

const ResetPassword: React.FC = () => {
  const [isPending, setIsPending] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="border-border bg-card shadow-xl">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 text-center">
                <img className="mx-auto mb-4 h-16 w-auto" src="/img/logo.png" alt="YORO" />
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Lien invalide</h2>
              </div>

              <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
                <p className="text-center text-red-700 dark:text-red-400">
                  Le lien de réinitialisation est invalide ou a expiré. Veuillez demander un nouveau lien.
                </p>
              </div>

              <Button
                onClick={() => navigate('/auth/forgot-password')}
                className="w-full"
                size="lg"
              >
                <span className="flex items-center gap-2">
                  Demander un nouveau lien
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const onResetPassword = async (values: FormValues) => {
    setIsPending(true);
    try {
      const { data } = await authclient.resetPassword({
        token,
        newPassword: values.password,
      });
      if (data?.status) {
        setResetComplete(true);
        toast.success('Votre mot de passe a été réinitialisé avec succès !');
        navigate('/auth/signin');
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur s'est produite lors de la réinitialisation du mot de passe");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md">
        <Card className="border-border bg-card shadow-xl">
          <CardContent className="p-6 md:p-8">
            <div className="mb-6 text-center">
              <img className="mx-auto mb-4 h-16 w-auto" src="/img/gallis.png" alt="Gestion Commerciale" />
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {resetComplete ? 'Mot de passe réinitialisé' : 'Créer un nouveau mot de passe'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {resetComplete
                  ? 'Votre mot de passe a été mis à jour avec succès'
                  : 'Veuillez entrer votre nouveau mot de passe'}
              </p>
            </div>

            {resetComplete ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6">
                  <ShieldCheck className="mb-4 h-12 w-12 text-emerald-500" />
                  <p className="mb-4 text-center text-muted-foreground">
                    Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter
                    avec votre nouveau mot de passe.
                  </p>
                </div>

                <Button onClick={() => navigate('/auth/signin')} className="w-full" size="lg">
                  <span className="flex items-center gap-2">
                    Se connecter
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onResetPassword)} className="space-y-4" autoComplete="off">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Entrez votre nouveau mot de passe"
                      className="pl-9"
                      aria-invalid={!!errors.password}
                      {...register('password')}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirmez votre mot de passe"
                      className="pl-9"
                      aria-invalid={!!errors.confirmPassword}
                      {...register('confirmPassword')}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      Réinitialisation…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Réinitialiser le mot de passe
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>

                <div className="text-center">
                  <Link
                    to="/auth/signin"
                    className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:text-accent transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Retour à la connexion</span>
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
