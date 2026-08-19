import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Check, Crown, Rocket, Leaf, ShieldCheck, CreditCard, Headset, Users, TrendingUp } from 'lucide-react';
import { Button } from '../../components/shadcn/button';
import { Card, CardContent } from '../../components/shadcn/card';
import { Badge } from '../../components/shadcn/badge';
import { Separator } from '../../components/shadcn/separator';
import { PackService } from '../../services/pack.service';
import { PaymentService } from '../../services/payment.service';
import { Pack } from '../../interfaces/pack.interface';
import { Payment } from '../../interfaces/payment.interface';
import { checkSubscription } from '../../services/authservice';
import { authclient } from '../../../lib/auth-client';

type PackTier = 'basic' | 'business' | 'premium';

const tierStyles: Record<PackTier, { chip: string; ring: string; btn: string; check: string; header: string }> = {
  basic: {
    chip: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400',
    ring: 'ring-emerald-500',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    check: 'text-emerald-600',
    header: 'from-emerald-500 to-emerald-600',
  },
  business: {
    chip: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
    ring: 'ring-blue-500',
    btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    check: 'text-blue-600',
    header: 'from-blue-500 to-blue-600',
  },
  premium: {
    chip: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    ring: 'ring-amber-500',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white',
    check: 'text-amber-600',
    header: 'from-amber-500 to-amber-600',
  },
};

const getTier = (nom: string): PackTier => {
  const n = nom.toLowerCase();
  if (n.includes('premium')) return 'premium';
  if (n.includes('business')) return 'business';
  return 'basic';
};

const tierIcon: Record<PackTier, typeof Crown> = {
  basic: Leaf,
  business: Rocket,
  premium: Crown,
};

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const { data: session } = authclient.useSession();
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);

  // Check if user already has an active subscription
  const { data: subscriptionData, isLoading: checkingSubscription } = useQuery({
    queryKey: ['subscription', session?.user.id],
    queryFn: () => checkSubscription(),
    enabled: !!session?.user.id,
  });

  useEffect(() => {
    if (subscriptionData?.subscription) {
      if (subscriptionData.hasActiveSubscription) {
        navigate('/dashboard', { replace: true });
      } else if (subscriptionData.subscription.status === 'en_attente') {
        navigate('/auth/pending-subscription', { replace: true });
      }
    }
  }, [subscriptionData]);

  // Fetch available packs
  const { data: packs, isLoading: loadingPacks } = useQuery({
    queryKey: ['packs'],
    queryFn: () => new PackService().getAll(),
  });

  // Create payment mutation
  const { mutate: createPayment, isPending: processingPayment } = useMutation({
    mutationFn: async ({ pack }: { pack: Pack }) => {
      const paymentData: Omit<Payment, '_id'> = { pack: pack._id };
      return new PaymentService().create(paymentData);
    },
    onSuccess: (data) => {
      const { redirect_url } = data;
      const global: any = window;
      new global.PayTech({}).withOption({
        tokenUrl: redirect_url,
        presentationMode: global.PayTech.OPEN_IN_POPUP,
        onClose: () => {
          navigate('/cancel?payment_id=' + session?.user.id + '&pack_name=' + selectedPack?.nom);
        },
      }).send();
    },
    onError: (error) => {
      console.error(error);
      toast.error('Erreur lors du traitement du paiement');
    },
  });

  const handleSelectPack = (pack: Pack) => setSelectedPack(pack);

  const handleSubmitPayment = () => {
    if (!selectedPack) {
      toast.warning("Veuillez sélectionner un forfait d'abonnement");
      return;
    }
    createPayment({ pack: selectedPack });
  };

  const getPackFeatures = (pack: Pack): string[] => {
    if (pack.features && pack.features.length > 0) return pack.features;
    const features = ['Accès à toutes les fonctionnalités de base', `Validité: ${pack.duree_mois} mois`, 'Support par email'];
    if (pack.nom.toLowerCase().includes('premium')) {
      features.push('Support prioritaire', 'Accès aux fonctionnalités avancées');
    }
    return features;
  };

  if (checkingSubscription || loadingPacks) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Card className="mb-10 shadow-xl">
          <CardContent className="p-6 md:p-10">
            <div className="mb-8 text-center">
              <img src="/img/logo.png" alt="Logo" className="mx-auto mb-4 h-24 w-24 drop-shadow-md" />
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground">Choisissez votre forfait</h1>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Sélectionnez le forfait qui correspond le mieux à vos besoins et commencez à utiliser YORO HAIR dès aujourd’hui.
              </p>
            </div>

            <Separator className="my-6" />

            {/* Subscription Packs */}
            <div className="mb-12 grid gap-6 md:grid-cols-3">
              {packs &&
                packs.map((pack: Pack) => {
                  const tier = getTier(pack.nom);
                  const ts = tierStyles[tier];
                  const Icon = tierIcon[tier];
                  const selected = selectedPack?._id === pack._id;

                  return (
                    <Card
                      key={pack._id}
                      className={`relative overflow-hidden transition-all duration-300 ${
                        selected ? `ring-2 ${ts.ring} shadow-xl` : 'hover:shadow-lg'
                      }`}
                    >
                      {/* Header band */}
                      <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-r ${ts.header}`} />

                      <CardContent className="relative p-6 pt-10">
                        <div className="mb-4 text-center">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-card shadow-lg ring-1 ring-border">
                            <Icon className={`h-7 w-7 ${ts.check}`} />
                          </div>
                          <Badge variant="secondary" className={`px-4 py-1.5 text-sm ${ts.chip}`}>
                            {pack.nom}
                          </Badge>
                        </div>

                        <div className="mb-4 text-center">
                          <p className="num text-2xl font-extrabold text-foreground">
                            {pack.prix.toLocaleString()} FCFA
                          </p>
                          <p className="text-sm text-muted-foreground">pour {pack.duree_mois} mois</p>
                        </div>

                        <Separator className="my-4" />

                        <p className="mb-6 text-center text-sm italic text-muted-foreground">{pack.description}</p>

                        <div className="mb-8 space-y-3">
                          {getPackFeatures(pack).map((feature, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${ts.chip}`}>
                                <Check className="h-3 w-3" />
                              </div>
                              <span className="text-sm text-foreground flex-1">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <Button
                          className={`w-full ${selected ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ts.btn}`}
                          onClick={() => handleSelectPack(pack)}
                          disabled={!pack.actif}
                        >
                          {!pack.actif ? 'Non disponible' : selected ? 'Sélectionné' : 'Sélectionner'}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

            {/* Payment Section */}
            {selectedPack && (
              <Card className="mx-auto max-w-2xl overflow-hidden shadow-lg">
                <div className="h-1.5 bg-gradient-to-r from-primary to-accent" />
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">Finaliser votre abonnement</h2>
                  </div>

                  <Separator className="my-6" />

                  <div className="mb-6 rounded-lg bg-muted p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Forfait sélectionné</p>
                        <p className="text-lg font-bold text-foreground">{selectedPack.nom}</p>
                      </div>
                      <Badge variant="secondary" className="px-3 py-1.5">{selectedPack.duree_mois} mois</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Prix du forfait</span>
                        <span className="num text-foreground">{selectedPack.prix.toLocaleString()} FCFA</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Taxes</span>
                        <span className="text-foreground">Incluses</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative my-8">
                    <Separator />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-xs uppercase tracking-wider text-muted-foreground">
                      Récapitulatif
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="mb-6 flex items-center justify-between">
                      <span className="text-base font-medium text-foreground">Montant total</span>
                      <span className="num text-2xl font-extrabold text-primary">
                        {selectedPack.prix.toLocaleString()} FCFA
                      </span>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      disabled={processingPayment}
                      onClick={handleSubmitPayment}
                    >
                      {processingPayment ? (
                        <span className="flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                          Traitement en cours…
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4" />
                          Payer maintenant
                        </span>
                      )}
                    </Button>

                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      Paiement 100% sécurisé. Vos informations sont protégées.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trust badges */}
            <div className="mt-12 mb-6 text-center">
              <div className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-6 md:flex-row">
                {[
                  { icon: Headset, title: 'Support client', desc: 'Nous sommes là pour vous aider', tone: 'text-blue-600 bg-blue-100 dark:bg-blue-500/15 dark:text-blue-400' },
                  { icon: Users, title: 'Communauté', desc: 'Rejoignez nos utilisateurs', tone: 'text-purple-600 bg-purple-100 dark:bg-purple-500/15 dark:text-purple-400' },
                  { icon: TrendingUp, title: 'Croissance', desc: 'Développez votre activité', tone: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-400' },
                ].map((b) => {
                  const Icon = b.icon;
                  return (
                    <div key={b.title} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full ${b.tone}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">{b.title}</p>
                        <p className="text-sm text-muted-foreground">{b.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="mt-8 text-muted-foreground">
                Vous avez des questions ?{' '}
                <a href="#" className="font-medium text-primary hover:text-accent transition-colors">
                  Contactez notre support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;
