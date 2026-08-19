import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Lock,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  Cloud,
  BarChart3,
  Code2,
  Quote,
} from 'lucide-react';
import { authclient } from '../../../lib/auth-client';
import { Card, CardContent } from '../../components/shadcn/card';
import { Input } from '../../components/shadcn/input';
import { Button } from '../../components/shadcn/button';
import { Label } from '../../components/shadcn/label';
import { Checkbox } from '../../components/shadcn/checkbox';

const schema = z
  .object({
    name: z.string().min(1, 'Veuillez entrer votre nom'),
    email: z
      .string()
      .min(1, 'Veuillez entrer votre email')
      .email('Veuillez entrer un email valide'),
    password: z
      .string()
      .min(1, 'Veuillez entrer votre mot de passe')
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
    terms: z.boolean().refine((v) => v, "Veuillez accepter les conditions d'utilisation"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

const FEATURES = [
  { icon: Code2, title: 'Interface intuitive', desc: 'Une expérience utilisateur moderne et fluide' },
  { icon: BarChart3, title: 'Tableaux de bord', desc: 'Suivez vos performances commerciales' },
  { icon: Cloud, title: 'Sauvegarde cloud', desc: 'Accédez à vos données depuis n’importe où' },
];

const SignUp: React.FC = () => {
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();

  const { data: session, isPending: isPendingSession } = authclient.useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
    },
  });

  useEffect(() => {
    if (isPendingSession) return;
    if (session) {
      navigate('/dashboard', { replace: true });
    }
  }, [session, isPendingSession]);

  const onRegister = async (values: FormValues) => {
    setIsPending(true);
    try {
      const res = await authclient.signUp.email({
        email: values.email,
        password: values.password,
        name: values.name,
      });
      if (res?.error) {
        toast.error(res.error.message);
      } else {
        toast.warning(
          "Votre email n'a pas été vérifié. Vous allez être redirigé pour demander un nouvel email de vérification.",
        );
        navigate(`/auth/verify-email?email=${encodeURIComponent(values.email)}`);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Une erreur s'est produite lors de l'inscription");
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
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Créez votre compte</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Ou{' '}
                  <Link to="/auth/signin" className="font-medium text-primary hover:text-accent transition-colors">
                    connectez-vous à votre compte existant
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit(onRegister)} className="space-y-4" autoComplete="off">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Nom</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Entrez votre nom"
                      className="pl-9"
                      aria-invalid={!!errors.name}
                      {...register('name')}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

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

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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

                <div className="space-y-1.5">
                  <div className="flex items-start gap-2">
                    <Checkbox id="terms" {...register('terms')} />
                    <Label
                      htmlFor="terms"
                      className="text-sm font-normal text-muted-foreground cursor-pointer"
                    >
                      J'accepte les{' '}
                      <Link to="/auth/terms" className="text-primary hover:text-accent transition-colors">
                        conditions d'utilisation
                      </Link>
                    </Label>
                  </div>
                  {errors.terms && <p className="text-xs text-destructive">{errors.terms.message}</p>}
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isPending}>
                  {isPending ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                      Inscription…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      S'inscrire
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
                « Rejoignez notre communauté d’entrepreneurs et simplifiez votre gestion commerciale dès
                aujourd’hui. »
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
