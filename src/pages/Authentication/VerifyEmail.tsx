import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Mail, ArrowRight, ArrowLeft, MailCheck } from 'lucide-react';
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

const VerifyEmail: React.FC = () => {
  const [isPending, setIsPending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: email || '' },
  });

  const onResendVerification = async (values: FormValues) => {
    setIsPending(true);
    try {
      const { data, error } = await authclient.sendVerificationEmail({
        email: values.email,
        callbackURL: import.meta.env.VITE_APP_URL + '/auth/signin',
      });

      if (error) {
        toast.error("Une erreur s'est produite lors de l'envoi de l'email de vérification");
      } else {
        if (data?.status) {
          setEmailSent(true);
          toast.success('Email de vérification envoyé avec succès !');
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Une erreur s'est produite lors de l'envoi de l'email de vérification");
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
              <img className="mx-auto mb-4 h-16 w-auto" src="/img/logo.png" alt="YORO HAIR" />
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {emailSent ? 'Email envoyé' : "Vérification d'email requise"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {emailSent
                  ? 'Veuillez vérifier votre boîte de réception'
                  : "Votre email n'a pas été vérifié. Veuillez vérifier votre boîte de réception ou demander un nouvel email de vérification."}
              </p>
            </div>

            {emailSent ? (
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center p-6">
                  <MailCheck className="mb-4 h-12 w-12 text-emerald-500" />
                  <p className="mb-4 text-center text-muted-foreground">
                    Un nouvel email de vérification a été envoyé à votre adresse email. Veuillez vérifier
                    votre boîte de réception et cliquer sur le lien de vérification.
                  </p>
                </div>

                <Button onClick={() => navigate('/auth/signin')} className="w-full" size="lg">
                  <span className="flex items-center gap-2">
                    Retour à la connexion
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-6 rounded-lg border border-yellow-100 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/30">
                  <p className="text-center text-yellow-700 dark:text-yellow-400">
                    Votre compte a été créé mais votre adresse email n'a pas été vérifiée. Veuillez vérifier
                    votre boîte de réception ou demander un nouvel email de vérification.
                  </p>
                </div>

                <form onSubmit={handleSubmit(onResendVerification)} className="space-y-4" autoComplete="off">
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
                        Renvoyer l'email de vérification
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;
