import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { authclient } from '../../../lib/auth-client';
import { Card, CardContent } from '../../components/shadcn/card';
import { Input } from '../../components/shadcn/input';
import { Button } from '../../components/shadcn/button';
import { Label } from '../../components/shadcn/label';

const schema = z.object({
  email: z
    .string()
    .min(1, 'Veuillez entrer votre email')
    .email('Veuillez entrer un email valide'),
});
type FormValues = z.infer<typeof schema>;

const ForgotPassword: React.FC = () => {
  const [isPending, setIsPending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onRequestReset = async (values: FormValues) => {
    setIsPending(true);
    try {
      const { data, error } = await authclient.forgetPassword({
        email: values.email,
        redirectTo: import.meta.env.VITE_APP_URL + '/auth/reset-password',
      });
      if (error) {
        toast.error("Une erreur s'est produite. Veuillez vérifier votre email.");
      } else {
        if (data?.status) {
          setEmailSent(true);
          toast.success('Instructions de réinitialisation envoyées à votre email !');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur s'est produite lors de l'envoi des instructions");
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
              <img className="mx-auto mb-4 h-16 w-auto" src="/img/logo.png" alt="YORO" />
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {emailSent ? 'Vérifiez votre email' : 'Mot de passe oublié'}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {emailSent
                  ? 'Nous avons envoyé les instructions de réinitialisation à votre adresse email'
                  : 'Entrez votre email pour recevoir un lien de réinitialisation'}
              </p>
            </div>

            {emailSent ? (
              <div className="space-y-6">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-900/30">
                  <p className="text-center text-emerald-700 dark:text-emerald-400">
                    Veuillez consulter votre boîte de réception et suivre les instructions pour réinitialiser
                    votre mot de passe.
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/auth/signin')}
                  className="w-full"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Retour à la connexion
                  </span>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onRequestReset)} className="space-y-4" autoComplete="off">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Entrez votre email"
                      className="pl-9"
                      aria-invalid={!!errors.email}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      Envoi…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Envoyer les instructions
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

export default ForgotPassword;
