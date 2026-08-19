import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Mail,
  Lock,
  ArrowRight,
  FileText,
  Wallet,
  Users,
  BarChart3,
  Quote,
} from 'lucide-react';
import { authclient } from '../../../lib/auth-client';
import { Card, CardContent } from '../../components/shadcn/card';
import { Input } from '../../components/shadcn/input';
import { Button } from '../../components/shadcn/button';
import { Label } from '../../components/shadcn/label';
import { Checkbox } from '../../components/shadcn/checkbox';

const schema = z.object({
  email: z.string().min(1, 'Veuillez entrer votre email').email('Veuillez entrer un email valide'),
  password: z.string().min(1, 'Veuillez entrer votre mot de passe'),
  remember: z.boolean().optional(),
});
type FormValues = z.infer<typeof schema>;

const FEATURES = [
  { icon: FileText, title: 'Facturation simplifiée', desc: 'Créez et gérez vos factures facilement' },
  { icon: Wallet, title: 'Suivi des paiements', desc: 'Gardez un œil sur vos entrées et sorties d’argent' },
  { icon: Users, title: 'Gestion des clients', desc: 'Centralisez vos données clients' },
  { icon: BarChart3, title: 'Tableaux de bord', desc: 'Visualisez vos performances commerciales' },
];

const SignIn: React.FC = () => {
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onLogin = async (values: FormValues) => {
    setIsPending(true);
    try {
      const res = await authclient.signIn.email({
        email: values.email,
        password: values.password,
      });

      if (res?.error) {
        if (res.error.code === 'EMAIL_NOT_VERIFIED') {
          toast.warning('Votre email n’a pas été vérifié. Redirection…');
          navigate(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
        } else {
          toast.error('Identifiants incorrects');
        }
      } else {
        toast.success('Connexion réussie !');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error(error);
      toast.error('Une erreur s’est produite lors de la connexion');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Left — form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <Card className="border-border bg-card shadow-xl">
            <CardContent className="p-6 md:p-8">
              <div className="mb-6 text-center">
                <img className="mx-auto mb-4 h-16 w-auto" src="/img/logo.png" alt="YORO" />
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                  Connectez-vous à votre compte
                </h2>
              </div>

              <form onSubmit={handleSubmit(onLogin)} className="space-y-4" autoComplete="off">
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

                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Entrez votre mot de passe"
                      className="pl-9"
                      aria-invalid={!!errors.password}
                      {...register('password')}
                    />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox id="remember" {...register('remember')} />
                    <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                      Se souvenir de moi
                    </Label>
                  </div>
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm font-medium text-primary hover:text-accent transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      Connexion…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Se connecter
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right — marketing panel */}
      <div className="relative hidden w-0 flex-1 lg:block">
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-[#1E293B] to-[#0F172A]">
          <div className="flex h-full flex-col justify-center p-12 text-white">
            <h1 className="mb-2 text-4xl font-bold">YORO HAIR</h1>
            <p className="mb-10 text-xl text-white/80">Gérez efficacement votre activité commerciale</p>

            <div className="space-y-6">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div
                    key={f.title}
                    className="flex items-start gap-5 transition-transform duration-300 hover:translate-x-1"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 shadow-lg backdrop-blur-md">
                      <Icon className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-semibold">{f.title}</h3>
                      <p className="text-white/70">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <Quote className="h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm italic text-white/80">
                « Une interface moderne et intuitive pour gérer efficacement votre entreprise. »
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
