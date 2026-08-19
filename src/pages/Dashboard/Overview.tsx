import { useQuery } from '@tanstack/react-query';
import { VenteService } from '../../services/vente.service';
import { AchatService } from '../../services/achat.service';
import { ArticleService } from '../../services/article.service';
import { FamilleService } from '../../services/famille.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatN } from '../../lib/helpers';
import { authclient } from '../../../lib/auth-client';
import { useMemo } from 'react';
import { Card, CardContent } from '../../components/shadcn/card';
import { Badge as ShadcnBadge } from '../../components/shadcn/badge';
import { Separator } from '../../components/shadcn/separator';
import { PageHeader } from '../../components/ui';
import {
  TrendingUp, TrendingDown, ArrowUp, ArrowDown, Scale,
  ShoppingCart, Wallet, BarChart3, PieChart as PieIcon,
  AlertTriangle, CheckCircle2, Calendar, Boxes,
} from 'lucide-react';

// Chart colors — adapt to dark mode via CSS variables
const CHART = {
  grid: 'var(--gc-border)',
  tick: 'var(--gc-text-muted)',
  tooltipBg: 'var(--gc-surface)',
  tooltipBorder: 'var(--gc-border)',
  blue: '#2563eb',
  red: '#dc2626',
  slate: '#334155',
  emerald: '#059669',
  amber: '#d97706',
};

function Overview() {
  const { data: session } = authclient.useSession()
  const venteService = new VenteService();
  const achatService = new AchatService();
  const articleService = new ArticleService();
  const familleService = new FamilleService();

  const { data: ventes } = useQuery({
    queryKey: ['ventes'],
    queryFn: () => venteService.getByUser(session!.user.id),
    enabled: session !== null
  });

  const { data: achats } = useQuery({
    queryKey: ['achats'],
    queryFn: () => achatService.getByUser(session!.user.id),
    enabled: session !== null
  });

  const { data: articles } = useQuery({
    queryKey: ['articles'],
    queryFn: () => articleService.getByUser(session!.user.id),
    enabled: session !== null
  });

  const { data: familles } = useQuery({
    queryKey: ['familles'],
    queryFn: () => familleService.getByUser(session!.user.id),
    enabled: session !== null
  });

  // ===== CALCULS FINANCIERS =====
  const totalVentes = ventes?.reduce((acc: number, v: { net_a_payer: number; }) => acc + v.net_a_payer, 0) || 0;
  const totalMontantBrutVentes = ventes?.reduce((acc: number, v: { montant: number; }) => acc + v.montant, 0) || 0;
  const totalRemisesVentes = ventes?.reduce((acc: number, v: { remise: number; }) => acc + v.remise, 0) || 0;
  const totalAchats = achats?.reduce((acc: number, a: { net_a_payer: number; }) => acc + a.net_a_payer, 0) || 0;
  const totalMontantBrutAchats = achats?.reduce((acc: number, a: { montant: number; }) => acc + a.montant, 0) || 0;
  const totalRemisesAchats = achats?.reduce((acc: number, a: { remise: number; }) => acc + a.remise, 0) || 0;
  const beneficeBrut = totalVentes - totalAchats;
  const margeBeneficiaire = totalVentes > 0 ? (beneficeBrut / totalVentes) * 100 : 0;

  const now = new Date();
  const debutMois = startOfMonth(now);
  const finMois = endOfMonth(now);
  const debutMoisDernier = startOfMonth(subMonths(now, 1));
  const finMoisDernier = endOfMonth(subMonths(now, 1));

  const ventesMoisCourant = ventes?.filter((v: any) =>
    isWithinInterval(new Date(v.date), { start: debutMois, end: finMois })
  ).reduce((acc: number, v: any) => acc + v.net_a_payer, 0) || 0;

  const ventesMoisDernier = ventes?.filter((v: any) =>
    isWithinInterval(new Date(v.date), { start: debutMoisDernier, end: finMoisDernier })
  ).reduce((acc: number, v: any) => acc + v.net_a_payer, 0) || 0;

  const achatsMoisCourant = achats?.filter((a: any) =>
    isWithinInterval(new Date(a.date), { start: debutMois, end: finMois })
  ).reduce((acc: number, a: any) => acc + a.net_a_payer, 0) || 0;

  const achatsMoisDernier = achats?.filter((a: any) =>
    isWithinInterval(new Date(a.date), { start: debutMoisDernier, end: finMoisDernier })
  ).reduce((acc: number, a: any) => acc + a.net_a_payer, 0) || 0;

  const beneficeMoisCourant = ventesMoisCourant - achatsMoisCourant;
  const beneficeMoisDernier = ventesMoisDernier - achatsMoisDernier;
  const evolutionVentes = ventesMoisDernier > 0 ? ((ventesMoisCourant - ventesMoisDernier) / ventesMoisDernier) * 100 : 0;
  const evolutionAchats = achatsMoisDernier > 0 ? ((achatsMoisCourant - achatsMoisDernier) / achatsMoisDernier) * 100 : 0;
  const evolutionBenefice = beneficeMoisDernier !== 0 ? ((beneficeMoisCourant - beneficeMoisDernier) / Math.abs(beneficeMoisDernier)) * 100 : 0;

  const debutAnnee = startOfYear(now);
  const ventesAnnee = ventes?.filter((v: any) => new Date(v.date) >= debutAnnee).reduce((acc: number, v: any) => acc + v.net_a_payer, 0) || 0;
  const achatsAnnee = achats?.filter((a: any) => new Date(a.date) >= debutAnnee).reduce((acc: number, a: any) => acc + a.net_a_payer, 0) || 0;
  const beneficeAnnee = ventesAnnee - achatsAnnee;

  const calculerStatistiquesStock = () => {
    if (!achats) return { totalStock: 0, valeurStock: 0, produitsMap: new Map() };
    const produitsMap = new Map();
    achats.forEach((achat: any) => {
      achat.produits.forEach((prod: any) => {
        if (!produitsMap.has(prod.ref)) {
          produitsMap.set(prod.ref, { ref: prod.ref, nom: prod.nom, quantite: 0, valeur: 0, prixAchat: prod.pu });
        }
        const prodStat = produitsMap.get(prod.ref);
        const qte = parseInt(prod.qte);
        prodStat.quantite += qte;
        prodStat.valeur += prod.pu * qte;
      });
    });
    ventes?.forEach((vente: any) => {
      vente.produits.forEach((prod: any) => {
        if (produitsMap.has(prod.ref)) {
          const prodStat = produitsMap.get(prod.ref);
          prodStat.quantite -= parseInt(prod.qte);
        }
      });
    });
    let totalStock = 0;
    let valeurStock = 0;
    produitsMap.forEach((prod: any) => {
      if (prod.quantite > 0) { totalStock += prod.quantite; valeurStock += prod.valeur; }
    });
    return { totalStock, valeurStock, produitsMap };
  };

  const { totalStock, valeurStock, produitsMap } = calculerStatistiquesStock();

  const ventesParMois = ventes?.reduce((acc: any, vente: { date: string | number | Date; net_a_payer: number; }) => {
    const mois = format(new Date(vente.date), 'MMMM', { locale: fr });
    if (!acc[mois]) acc[mois] = 0;
    acc[mois] += vente.net_a_payer;
    return acc;
  }, {});

  const ventesData = useMemo(() =>
    Object.entries(ventesParMois || {}).map(([mois, montant]) => ({ mois, montant })), [ventesParMois]
  );

  const comparaisonData = ventes?.map((vente: { date: string | number | Date; net_a_payer: number; }) => {
    const date = format(new Date(vente.date), 'dd/MM');
    const achatsDuJour = achats?.filter(
      (achat: { date: string | number | Date; net_a_payer: number; }) => format(new Date(achat.date), 'dd/MM') === date
    );
    const totalAchatsDuJour = achatsDuJour?.reduce((acc: number, a: { net_a_payer: number; }) => acc + a.net_a_payer, 0) || 0;
    return { date, ventes: vente.net_a_payer, achats: totalAchatsDuJour };
  });

  const produitsParFamille = useMemo(() => {
    if (!articles || !familles) return [];
    interface FamilleCounter { id: string; nom: string; count: number; prixMoyen: number; totalPrix: number; }
    const compteur: Record<string, FamilleCounter> = {};
    familles.forEach((famille: { _id: string; nom: string; }) => {
      compteur[famille._id] = { id: famille._id, nom: famille.nom, count: 0, prixMoyen: 0, totalPrix: 0 };
    });
    articles.forEach((article: any) => {
      if (article.famille && compteur[article.famille._id]) {
        compteur[article.famille._id].count += 1;
        compteur[article.famille._id].totalPrix += article.prix || 0;
      }
    });
    Object.values(compteur).forEach((famille: FamilleCounter) => {
      if (famille.count > 0) famille.prixMoyen = Math.round(famille.totalPrix / famille.count);
    });
    return Object.values(compteur);
  }, [articles, familles]);

  const stockParDepot = useMemo(() => {
    if (!achats) return [];
    const depotsMap = new Map();
    achats.forEach((achat: any) => {
      if (!achat.depot) return;
      const depotId = achat.depot._id;
      if (!depotsMap.has(depotId)) {
        depotsMap.set(depotId, { id: depotId, nom: achat.depot.nom, quantite: 0, valeur: 0 });
      }
      const depotStat = depotsMap.get(depotId);
      achat.produits.forEach((prod: any) => {
        const qte = parseInt(prod.qte);
        depotStat.quantite += qte;
        depotStat.valeur += prod.pu * qte;
      });
    });
    ventes?.forEach((vente: any) => {
      if (!vente.depot) return;
      const depotId = vente.depot._id;
      if (depotsMap.has(depotId)) {
        const depotStat = depotsMap.get(depotId);
        vente.produits.forEach((prod: any) => { depotStat.quantite -= parseInt(prod.qte); });
      }
    });
    return Array.from(depotsMap.values());
  }, [achats, ventes]);

  const produitsFaibleStock = useMemo(() => {
    if (!produitsMap) return [];
    const produitsCritiques: Array<{ ref: string; nom: string; quantite: number; valeur: number; statut: string; }> = [];
    produitsMap.forEach((prod: any) => {
      if (prod.quantite >= 0 && prod.quantite < 10) {
        produitsCritiques.push({ ...prod, statut: prod.quantite === 0 ? 'Rupture' : 'Critique' });
      }
    });
    return produitsCritiques.sort((a, b) => a.quantite - b.quantite).slice(0, 5);
  }, [produitsMap]);

  const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5'];

  const pourcentageCroissance = (() => {
    if (!ventes || ventes.length === 0) return 0;
    const moisDernier = subMonths(new Date(), 1);
    const ventesMoisCourant = ventes.filter((v: any) => new Date(v.date) >= moisDernier).reduce((acc: number, v: any) => acc + v.net_a_payer, 0);
    const ventesAvantMoisDernier = ventes.filter((v: any) => new Date(v.date) < moisDernier).reduce((acc: number, v: any) => acc + v.net_a_payer, 0);
    if (ventesAvantMoisDernier === 0) return 100;
    return Math.round((ventesMoisCourant - ventesAvantMoisDernier) / ventesAvantMoisDernier * 100);
  })();

  const ratioBeneficeVentes = totalVentes > 0 ? (beneficeBrut / totalVentes) * 100 : 0;
  const ruptures = produitsFaibleStock.filter((p: any) => p.quantite === 0).length;
  const tooltipStyle = { backgroundColor: CHART.tooltipBg, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: `1px solid ${CHART.tooltipBorder}`, color: 'var(--gc-text)' };

  // ===== KPI card helper =====
  const KpiCard = ({ icon: Icon, label, value, sub, tone, delta, deltaDir }: {
    icon: typeof TrendingUp; label: string; value: string; sub?: string;
    tone: 'pos' | 'neg' | 'info' | 'neutral'; delta?: string; deltaDir?: 'up' | 'down' | 'flat';
  }) => {
    const toneCfg = {
      pos: { chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', val: 'text-emerald-600 dark:text-emerald-400' },
      neg: { chip: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400', val: 'text-red-600 dark:text-red-400' },
      info: { chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400', val: 'text-blue-600 dark:text-blue-400' },
      neutral: { chip: 'bg-muted text-foreground', val: 'text-foreground' },
    }[tone];
    return (
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className={`num mt-2 text-xl font-bold md:text-2xl ${toneCfg.val}`}>{value}</p>
              {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
              {delta && (
                <p className={`num mt-1.5 flex items-center gap-1 text-xs font-semibold ${
                  deltaDir === 'up' ? 'text-emerald-600' : deltaDir === 'down' ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {deltaDir === 'up' ? <TrendingUp className="h-3 w-3" /> : deltaDir === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
                  {delta}
                </p>
              )}
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneCfg.chip}`}>
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ===== Month stat card helper =====
  const MonthStat = ({ label, value, evol, evolDir, compare, tone }: {
    label: string; value: string; evol: string; evolDir: 'up' | 'down';
    compare: string; tone: 'pos' | 'neg' | 'info';
  }) => {
    const toneCfg = {
      pos: 'border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5',
      neg: 'border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5',
      info: 'border-blue-200 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/5',
    }[tone];
    const valColor = { pos: 'text-emerald-600 dark:text-emerald-400', neg: 'text-red-600 dark:text-red-400', info: 'text-blue-600 dark:text-blue-400' }[tone];
    return (
      <div className={`rounded-lg border p-4 ${toneCfg}`}>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className={`num flex items-center gap-1 text-xs font-semibold ${evolDir === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
            {evolDir === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {evol}
          </span>
        </div>
        <p className={`num text-lg font-bold ${valColor}`}>{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{compare}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <PageHeader
        title="Tableau de bord financier"
        subtitle="Vue d'ensemble de votre activité commerciale"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              {format(now, 'dd MMMM yyyy', { locale: fr })}
            </span>
          </div>
        }
      />

      {/* ===== RÉSUMÉ FINANCIER GLOBAL ===== */}
      <Card className="mb-6 border-border bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white shadow-lg">
        <CardContent className="p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/10">
              <PieIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Résumé financier global</h2>
              <p className="text-xs text-slate-400">Vue d'ensemble de toutes vos transactions</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* GAINS */}
            <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                  <ArrowUp className="h-5 w-5 text-white" />
                </div>
                <ShadcnBadge variant="pos">Gains</ShadcnBadge>
              </div>
              <p className="mb-1 text-xs uppercase tracking-wider text-emerald-100">Total des ventes</p>
              <p className="num mb-2 text-xl font-extrabold text-white">{formatN(totalVentes)} FCFA</p>
              <div className="my-2 h-px bg-white/20" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-emerald-100">Montant brut</span><span className="num font-semibold text-white">{formatN(totalMontantBrutVentes)} F</span></div>
                <div className="flex justify-between"><span className="text-emerald-100">Remises</span><span className="num font-semibold text-white">- {formatN(totalRemisesVentes)} F</span></div>
                <div className="flex justify-between"><span className="text-emerald-100">Nb. ventes</span><span className="num font-semibold text-white">{ventes?.length || 0}</span></div>
              </div>
            </div>

            {/* DÉPENSES */}
            <div className="rounded-xl bg-gradient-to-br from-red-500 to-red-600 p-5 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                  <ArrowDown className="h-5 w-5 text-white" />
                </div>
                <ShadcnBadge variant="destructive">Dépenses</ShadcnBadge>
              </div>
              <p className="mb-1 text-xs uppercase tracking-wider text-red-100">Total des achats</p>
              <p className="num mb-2 text-xl font-extrabold text-white">{formatN(totalAchats)} FCFA</p>
              <div className="my-2 h-px bg-white/20" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-red-100">Montant brut</span><span className="num font-semibold text-white">{formatN(totalMontantBrutAchats)} F</span></div>
                <div className="flex justify-between"><span className="text-red-100">Remises</span><span className="num font-semibold text-white">- {formatN(totalRemisesAchats)} F</span></div>
                <div className="flex justify-between"><span className="text-red-100">Nb. achats</span><span className="num font-semibold text-white">{achats?.length || 0}</span></div>
              </div>
            </div>

            {/* BÉNÉFICE */}
            <div className={`rounded-xl bg-gradient-to-br ${beneficeBrut >= 0 ? 'from-slate-600 to-slate-700' : 'from-amber-500 to-amber-600'} p-5 shadow-lg`}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                  <Scale className="h-5 w-5 text-white" />
                </div>
                <ShadcnBadge variant={beneficeBrut >= 0 ? 'default' : 'warn'}>
                  {beneficeBrut >= 0 ? 'Bénéfice' : 'Perte'}
                </ShadcnBadge>
              </div>
              <p className="mb-1 text-xs uppercase tracking-wider text-white/70">Résultat net</p>
              <p className="num mb-2 text-xl font-extrabold text-white">{beneficeBrut >= 0 ? '+' : ''}{formatN(beneficeBrut)} FCFA</p>
              <div className="my-2 h-px bg-white/20" />
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-white/70">Marge bénéficiaire</span><span className="num font-semibold text-white">{margeBeneficiaire.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-white/70">Ratio dép./gains</span><span className="num font-semibold text-white">{totalVentes > 0 ? ((totalAchats / totalVentes) * 100).toFixed(1) : 0}%</span></div>
                <div className="flex justify-between items-center"><span className="text-white/70">Statut</span>
                  <span className="flex items-center gap-1 font-semibold text-white">
                    {beneficeBrut >= 0 ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {beneficeBrut >= 0 ? 'Rentable' : 'Déficitaire'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== PERFOMANCE DU MOIS ===== */}
      <Card className="mb-6">
        <CardContent className="p-5 md:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Performance du mois — {format(now, 'MMMM yyyy', { locale: fr })}</h2>
              <p className="text-xs text-muted-foreground">Comparaison avec le mois précédent</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <MonthStat label="Ventes" value={`${formatN(ventesMoisCourant)} F`} evol={`${evolutionVentes >= 0 ? '+' : ''}${evolutionVentes.toFixed(1)}%`} evolDir={evolutionVentes >= 0 ? 'up' : 'down'} compare={`vs ${formatN(ventesMoisDernier)} F le mois dernier`} tone="pos" />
            <MonthStat label="Achats" value={`${formatN(achatsMoisCourant)} F`} evol={`${evolutionAchats >= 0 ? '+' : ''}${evolutionAchats.toFixed(1)}%`} evolDir={evolutionAchats <= 0 ? 'up' : 'down'} compare={`vs ${formatN(achatsMoisDernier)} F le mois dernier`} tone="neg" />
            <MonthStat label="Bénéfice" value={`${beneficeMoisCourant >= 0 ? '+' : ''}${formatN(beneficeMoisCourant)} F`} evol={`${evolutionBenefice >= 0 ? '+' : ''}${evolutionBenefice.toFixed(1)}%`} evolDir={evolutionBenefice >= 0 ? 'up' : 'down'} compare={`vs ${beneficeMoisDernier >= 0 ? '+' : ''}${formatN(beneficeMoisDernier)} F`} tone={beneficeMoisCourant >= 0 ? 'info' : 'neg'} />
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Bénéfice annuel {now.getFullYear()}</span>
              <p className={`num text-lg font-bold ${beneficeAnnee >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600'}`}>
                {beneficeAnnee >= 0 ? '+' : ''}{formatN(beneficeAnnee)} F
              </p>
              <p className="mt-1 text-xs text-muted-foreground">V: {formatN(ventesAnnee)} F | A: {formatN(achatsAnnee)} F</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== KPI CARDS ===== */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <KpiCard icon={TrendingUp} label="Ventes totales" value={`${formatN(totalVentes)} FCFA`} tone="info"
          delta={`${pourcentageCroissance >= 0 ? '+' : ''}${pourcentageCroissance}% vs mois précédent`} deltaDir={pourcentageCroissance >= 0 ? 'up' : 'down'} />
        <KpiCard icon={ShoppingCart} label="Achats totaux" value={`${formatN(totalAchats)} FCFA`} tone="neg"
          sub={`${Math.round((totalAchats / (totalVentes || 1)) * 100)}% des ventes`} />
        <KpiCard icon={Wallet} label="Bénéfice brut" value={`${formatN(beneficeBrut)} FCFA`} tone={beneficeBrut >= 0 ? 'pos' : 'neg'}
          sub={`Marge: ${Math.round(ratioBeneficeVentes)}%`} />
      </div>

      {/* ===== GRAPHIQUES ===== */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        {/* Évolution des ventes */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Évolution des ventes mensuelles</h3>
              <ShadcnBadge variant="info">Mensuel</ShadcnBadge>
            </div>
            <Separator className="mb-4" />
            <ResponsiveContainer width="100%" height={280} key="ventes-chart">
              <AreaChart data={ventesData}>
                <defs>
                  <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART.blue} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={CHART.blue} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="mois" tick={{ fill: CHART.tick, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART.tick, fontSize: 11 }} />
                <RechartsTooltip formatter={(value: any) => formatN(value) + ' FCFA'} contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="montant" stroke={CHART.blue} fillOpacity={1} fill="url(#colorVentes)" name="Montant des ventes" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Comparaison ventes/achats */}
        <Card>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Comparaison ventes / achats</h3>
              <ShadcnBadge variant="secondary">Journalier</ShadcnBadge>
            </div>
            <Separator className="mb-4" />
            <ResponsiveContainer width="100%" height={280} key="comparaison-chart">
              <LineChart data={comparaisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                <XAxis dataKey="date" tick={{ fill: CHART.tick, fontSize: 11 }} />
                <YAxis tick={{ fill: CHART.tick, fontSize: 11 }} />
                <RechartsTooltip formatter={(value: any) => formatN(value) + ' FCFA'} contentStyle={tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="ventes" stroke={CHART.blue} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Ventes" />
                <Line type="monotone" dataKey="achats" stroke={CHART.red} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} name="Achats" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ===== PRODUITS PAR FAMILLE ===== */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Répartition des produits par famille</h3>
            <ShadcnBadge variant="warn">Inventaire</ShadcnBadge>
          </div>
          <Separator className="mb-4" />
          <div className="flex flex-wrap">
            <div className="w-full p-2 md:w-1/2">
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">Distribution par quantité et prix moyen</p>
              <ResponsiveContainer width="100%" height={280} key="famille-bar-chart">
                <BarChart data={produitsParFamille} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="nom" tick={{ fill: CHART.tick, fontSize: 10 }} />
                  <YAxis tick={{ fill: CHART.tick, fontSize: 11 }} />
                  <RechartsTooltip formatter={(value: number, name: string) => name === 'Prix Moyen' ? formatN(value) + ' FCFA' : value} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="count" fill={CHART.blue} name="Nombre de Produits" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="prixMoyen" fill={CHART.slate} name="Prix Moyen" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full p-2 md:w-1/2">
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">Répartition en pourcentage</p>
              <ResponsiveContainer width="100%" height={280} key="famille-pie-chart">
                <PieChart>
                  <Pie data={produitsParFamille} cx="50%" cy="50%" labelLine={false}
                    label={({ nom, count, percent }: any) => `${nom.substring(0, 10)}${nom.length > 10 ? '…' : ''}: ${count} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={95} innerRadius={40} fill={CHART.slate} dataKey="count" paddingAngle={2}>
                    {produitsParFamille.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={CHART.tooltipBg} strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => value} contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== ANALYSE DE STOCK ===== */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Boxes className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Analyse de stock</h3>
            </div>
            <ShadcnBadge variant="secondary">{formatN(totalStock)} articles en stock</ShadcnBadge>
          </div>
          <Separator className="mb-4" />

          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
              <p className="mb-1 text-xs font-semibold uppercase text-amber-600 dark:text-amber-400">Total articles</p>
              <p className="num text-xl font-bold text-amber-700 dark:text-amber-300">{formatN(totalStock)}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
              <p className="mb-1 text-xs font-semibold uppercase text-blue-600 dark:text-blue-400">Valeur du stock</p>
              <p className="num text-xl font-bold text-blue-700 dark:text-blue-300">{formatN(valeurStock)} FCFA</p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
              <p className="mb-1 text-xs font-semibold uppercase text-red-600 dark:text-red-400">Produits en rupture</p>
              <p className="num text-xl font-bold text-red-700 dark:text-red-300">{ruptures}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <p className="mb-1 text-xs font-semibold uppercase text-emerald-600 dark:text-emerald-400">Rotation du stock</p>
              <p className="num text-xl font-bold text-emerald-700 dark:text-emerald-300">{valeurStock > 0 ? (totalAchats / valeurStock).toFixed(2) : '0.00'}</p>
            </div>
          </div>

          <div className="flex flex-col flex-wrap md:flex-row">
            <div className="w-full p-2 md:w-1/2">
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">Stock par dépôt</p>
              <ResponsiveContainer width="100%" height={280} key="stock-depot-chart">
                <BarChart data={stockParDepot}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis dataKey="nom" tick={{ fill: CHART.tick, fontSize: 11 }} />
                  <YAxis tick={{ fill: CHART.tick, fontSize: 11 }} />
                  <RechartsTooltip formatter={(value: any, name: string) => name === 'quantite' ? formatN(value) + ' articles' : formatN(value) + ' FCFA'} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="quantite" fill={CHART.slate} name="Quantité" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="valeur" fill={CHART.blue} name="Valeur" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full p-2 md:w-1/2">
              <p className="mb-2 text-center text-xs font-medium text-muted-foreground">Produits à faible stock</p>
              <ResponsiveContainer width="100%" height={280} key="faible-stock-chart">
                <BarChart data={produitsFaibleStock} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} />
                  <XAxis type="number" tick={{ fill: CHART.tick, fontSize: 11 }} />
                  <YAxis dataKey="nom" type="category" tick={{ fill: CHART.tick, fontSize: 11 }} width={100} />
                  <RechartsTooltip formatter={(value: any, _name: string, props: any) => [`${formatN(value)} articles`, `Statut: ${props.payload.statut}`]} contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="quantite" fill={CHART.red} name="Stock restant" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Overview;
