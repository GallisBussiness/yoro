import { Grid, Paper, Text, Group, SimpleGrid, RingProgress, Progress, Divider, Badge, ThemeIcon } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { VenteService } from '../../services/vente.service';
import { AchatService } from '../../services/achat.service';
import { ArticleService } from '../../services/article.service';
import { FamilleService } from '../../services/famille.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaChartLine, FaMoneyBillWave } from 'react-icons/fa6';
import { formatN } from '../../lib/helpers';
import { authclient } from '../../../lib/auth-client';
import { FaShoppingCart, FaArrowUp, FaArrowDown, FaBalanceScale, FaCalendarAlt, FaChartPie } from 'react-icons/fa';
import { useMemo } from 'react';
import { TbTrendingUp, TbTrendingDown } from 'react-icons/tb';

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
  
  // Total des gains (ventes)
  const totalVentes = ventes?.reduce((acc: number, v: { net_a_payer: number; }) => acc + v.net_a_payer, 0) || 0;
  const totalMontantBrutVentes = ventes?.reduce((acc: number, v: { montant: number; }) => acc + v.montant, 0) || 0;
  const totalRemisesVentes = ventes?.reduce((acc: number, v: { remise: number; }) => acc + v.remise, 0) || 0;
  
  // Total des dépenses (achats)
  const totalAchats = achats?.reduce((acc: number, a: { net_a_payer: number; }) => acc + a.net_a_payer, 0) || 0;
  const totalMontantBrutAchats = achats?.reduce((acc: number, a: { montant: number; }) => acc + a.montant, 0) || 0;
  const totalRemisesAchats = achats?.reduce((acc: number, a: { remise: number; }) => acc + a.remise, 0) || 0;
  
  // Bénéfice
  const beneficeBrut = totalVentes - totalAchats;
  const margeBeneficiaire = totalVentes > 0 ? (beneficeBrut / totalVentes) * 100 : 0;
  
  // Statistiques du mois en cours
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
  
  // Évolution en pourcentage
  const evolutionVentes = ventesMoisDernier > 0 ? ((ventesMoisCourant - ventesMoisDernier) / ventesMoisDernier) * 100 : 0;
  const evolutionAchats = achatsMoisDernier > 0 ? ((achatsMoisCourant - achatsMoisDernier) / achatsMoisDernier) * 100 : 0;
  const evolutionBenefice = beneficeMoisDernier !== 0 ? ((beneficeMoisCourant - beneficeMoisDernier) / Math.abs(beneficeMoisDernier)) * 100 : 0;
  
  // Statistiques de l'année
  const debutAnnee = startOfYear(now);
  const ventesAnnee = ventes?.filter((v: any) => 
    new Date(v.date) >= debutAnnee
  ).reduce((acc: number, v: any) => acc + v.net_a_payer, 0) || 0;
  
  const achatsAnnee = achats?.filter((a: any) => 
    new Date(a.date) >= debutAnnee
  ).reduce((acc: number, a: any) => acc + a.net_a_payer, 0) || 0;
  
  const beneficeAnnee = ventesAnnee - achatsAnnee;
  
  // Calculer les statistiques de stock
  const calculerStatistiquesStock = () => {
    if (!achats) return { totalStock: 0, valeurStock: 0 };
    
    const produitsMap = new Map();
    
    // Agréger tous les produits achetés
    achats.forEach((achat: any) => {
      achat.produits.forEach((prod: any) => {
        if (!produitsMap.has(prod.ref)) {
          produitsMap.set(prod.ref, {
            ref: prod.ref,
            nom: prod.nom,
            quantite: 0,
            valeur: 0,
            prixAchat: prod.pu
          });
        }
        
        const prodStat = produitsMap.get(prod.ref);
        const qte = parseInt(prod.qte);
        prodStat.quantite += qte;
        prodStat.valeur += prod.pu * qte;
      });
    });
    
    // Soustraire les produits vendus
    ventes?.forEach((vente: any) => {
      vente.produits.forEach((prod: any) => {
        if (produitsMap.has(prod.ref)) {
          const prodStat = produitsMap.get(prod.ref);
          const qte = parseInt(prod.qte);
          prodStat.quantite -= qte;
        }
      });
    });
    
    // Calculer les totaux
    let totalStock = 0;
    let valeurStock = 0;
    
    produitsMap.forEach((prod) => {
      if (prod.quantite > 0) {
        totalStock += prod.quantite;
        valeurStock += prod.valeur;
      }
    });
    
    return { 
      totalStock, 
      valeurStock,
      produitsMap
    };
  };
  
  const { totalStock, valeurStock, produitsMap } = calculerStatistiquesStock();

  // Données pour le graphique des ventes mensuelles
  const ventesParMois = ventes?.reduce((acc: any, vente: { date: string | number | Date; net_a_payer: number; }) => {
    const mois = format(new Date(vente.date), 'MMMM', { locale: fr });
    if (!acc[mois]) {
      acc[mois] = 0;
    }
    acc[mois] += vente.net_a_payer;
    return acc;
  }, {});

  const ventesData = useMemo(() => 
    Object.entries(ventesParMois || {}).map(([mois, montant]) => ({
      mois,
      montant
    })), [ventesParMois]
  );

  // Données pour le graphique comparatif ventes/achats
  const comparaisonData = ventes?.map((vente: { date: string | number | Date; net_a_payer: number; }) => {
    const date = format(new Date(vente.date), 'dd/MM');
    const achatsDuJour = achats?.filter(
      (achat: { date: string | number | Date; net_a_payer: number; }) => format(new Date(achat.date), 'dd/MM') === date
    );
    const totalAchatsDuJour = achatsDuJour?.reduce((acc: number, a: { net_a_payer: number; }) => acc + a.net_a_payer, 0) || 0;

    return {
      date,
      ventes: vente.net_a_payer,
      achats: totalAchatsDuJour
    };
  });

  // Données pour le graphique des produits par famille
  const produitsParFamille = useMemo(() => {
    if (!articles || !familles) return [];
    
    // Définir le type pour l'objet compteur
    interface FamilleCounter {
      id: string;
      nom: string;
      count: number;
      prixMoyen: number;
      totalPrix: number;
    }
    
    // Créer un objet pour compter les articles par famille
    const compteur: Record<string, FamilleCounter> = {};
    
    // Initialiser le compteur avec toutes les familles à 0
    familles.forEach((famille: { _id: string; nom: string; }) => {
      compteur[famille._id] = {
        id: famille._id,
        nom: famille.nom,
        count: 0,
        prixMoyen: 0,
        totalPrix: 0
      };
    });
    
    // Compter les articles par famille et calculer le prix moyen
    articles.forEach((article: any) => {
      if (article.famille && compteur[article.famille._id]) {
        compteur[article.famille._id].count += 1;
        compteur[article.famille._id].totalPrix += article.prix || 0;
      }
    });
    
    // Calculer le prix moyen pour chaque famille
    Object.values(compteur).forEach((famille: FamilleCounter) => {
      if (famille.count > 0) {
        famille.prixMoyen = Math.round(famille.totalPrix / famille.count);
      }
    });
    
    // Convertir l'objet en tableau pour le graphique
    return Object.values(compteur);
  }, [articles, familles]);
  
  // Données pour l'analyse du stock par dépôt
  const stockParDepot = useMemo(() => {
    if (!achats) return [];
    
    const depotsMap = new Map();
    
    // Agréger les produits par dépôt
    achats.forEach((achat: any) => {
      if (!achat.depot) return;
      
      const depotId = achat.depot._id;
      const depotNom = achat.depot.nom;
      
      if (!depotsMap.has(depotId)) {
        depotsMap.set(depotId, {
          id: depotId,
          nom: depotNom,
          quantite: 0,
          valeur: 0
        });
      }
      
      const depotStat = depotsMap.get(depotId);
      
      achat.produits.forEach((prod: any) => {
        const qte = parseInt(prod.qte);
        depotStat.quantite += qte;
        depotStat.valeur += prod.pu * qte;
      });
    });
    
    // Soustraire les ventes
    ventes?.forEach((vente: any) => {
      if (!vente.depot) return;
      
      const depotId = vente.depot._id;
      
      if (depotsMap.has(depotId)) {
        const depotStat = depotsMap.get(depotId);
        
        vente.produits.forEach((prod: any) => {
          const qte = parseInt(prod.qte);
          depotStat.quantite -= qte;
        });
      }
    });
    
    return Array.from(depotsMap.values());
  }, [achats, ventes]);
  
  // Données pour l'analyse des produits à faible stock
  const produitsFaibleStock = useMemo(() => {
    if (!produitsMap) return [];
    
    // Filtrer les produits avec un stock faible (moins de 10 unités)
    const produitsCritiques: Array<{
      ref: string;
      nom: string;
      quantite: number;
      valeur: number;
      statut: string;
    }> = [];
    
    produitsMap.forEach((prod: any) => {
      if (prod.quantite >= 0 && prod.quantite < 10) {
        produitsCritiques.push({
          ...prod,
          statut: prod.quantite === 0 ? 'Rupture' : 'Critique'
        });
      }
    });
    
    // Trier par quantité croissante et limiter à 5
    return produitsCritiques
      .sort((a, b) => a.quantite - b.quantite)
      .slice(0, 5);
  }, [produitsMap]);

  // Couleurs pour le graphique en camembert
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#FF5733', '#C70039', '#900C3F'];

  // Calculer le pourcentage de croissance des ventes
  const calculerPourcentageCroissance = () => {
    if (!ventes || ventes.length === 0) return 0;
    
    const maintenant = new Date();
    const moisDernier = subMonths(maintenant, 1);
    
    const ventesMoisCourant = ventes.filter((v: any) => new Date(v.date) >= moisDernier)
      .reduce((acc: number, v: any) => acc + v.net_a_payer, 0);
    
    const ventesAvantMoisDernier = ventes.filter((v: any) => new Date(v.date) < moisDernier)
      .reduce((acc: number, v: any) => acc + v.net_a_payer, 0);
    
    if (ventesAvantMoisDernier === 0) return 100;
    
    return Math.round((ventesMoisCourant - ventesAvantMoisDernier) / ventesAvantMoisDernier * 100);
  };
  
  const pourcentageCroissance = calculerPourcentageCroissance();
  
  // Calculer le ratio bénéfice/ventes
  const ratioBeneficeVentes = totalVentes > 0 ? (beneficeBrut / totalVentes) * 100 : 0;

  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div>
          <Text size="xs" fw={500} className="text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Vue d'ensemble
          </Text>
          <Text size="xl" fw={700} className="text-slate-800 dark:text-white">
            Tableau de Bord Financier
          </Text>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm px-4 py-2 mt-4 md:mt-0 border border-slate-100 dark:border-slate-700">
          <Text size="xs" fw={500} className="text-slate-500 dark:text-slate-400">
            Dernière mise à jour: {format(new Date(), 'dd MMMM yyyy', { locale: fr })}
          </Text>
        </div>
      </div>

      {/* ===== SECTION RÉSUMÉ FINANCIER ===== */}
      <Paper withBorder p="xl" radius="lg" className="mb-8 shadow-lg border-slate-100 dark:border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="flex items-center gap-3 mb-6">
          <ThemeIcon size="xl" radius="md" color="violet" variant="filled">
            <FaChartPie size={24} />
          </ThemeIcon>
          <div>
            <Text size="lg" fw={700} className="text-white">
              Résumé Financier Global
            </Text>
            <Text size="xs" className="text-slate-400">
              Vue d'ensemble de toutes vos transactions
            </Text>
          </div>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
          {/* GAINS (Ventes) */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <FaArrowUp size={20} className="text-white" />
              </div>
              <Badge color="green" variant="light" size="lg">GAINS</Badge>
            </div>
            <Text size="xs" className="text-green-100 uppercase tracking-wider mb-1">
              Total des Ventes
            </Text>
            <Text size="xl" fw={800} className="text-white mb-2">
              {formatN(totalVentes)} FCFA
            </Text>
            <Divider color="white" opacity={0.2} my="sm" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <Text size="xs" className="text-green-100">Montant brut</Text>
                <Text size="xs" fw={600} className="text-white">{formatN(totalMontantBrutVentes)} F</Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" className="text-green-100">Remises accordées</Text>
                <Text size="xs" fw={600} className="text-white">- {formatN(totalRemisesVentes)} F</Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" className="text-green-100">Nombre de ventes</Text>
                <Text size="xs" fw={600} className="text-white">{ventes?.length || 0}</Text>
              </div>
            </div>
          </div>

          {/* DÉPENSES (Achats) */}
          <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <FaArrowDown size={20} className="text-white" />
              </div>
              <Badge color="red" variant="light" size="lg">DÉPENSES</Badge>
            </div>
            <Text size="xs" className="text-red-100 uppercase tracking-wider mb-1">
              Total des Achats
            </Text>
            <Text size="xl" fw={800} className="text-white mb-2">
              {formatN(totalAchats)} FCFA
            </Text>
            <Divider color="white" opacity={0.2} my="sm" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <Text size="xs" className="text-red-100">Montant brut</Text>
                <Text size="xs" fw={600} className="text-white">{formatN(totalMontantBrutAchats)} F</Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" className="text-red-100">Remises obtenues</Text>
                <Text size="xs" fw={600} className="text-white">- {formatN(totalRemisesAchats)} F</Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" className="text-red-100">Nombre d'achats</Text>
                <Text size="xs" fw={600} className="text-white">{achats?.length || 0}</Text>
              </div>
            </div>
          </div>

          {/* BÉNÉFICE */}
          <div className={`bg-gradient-to-br ${beneficeBrut >= 0 ? 'from-violet-500 to-purple-600' : 'from-orange-500 to-amber-600'} rounded-xl p-5 shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <FaBalanceScale size={20} className="text-white" />
              </div>
              <Badge color={beneficeBrut >= 0 ? 'violet' : 'orange'} variant="light" size="lg">
                {beneficeBrut >= 0 ? 'BÉNÉFICE' : 'PERTE'}
              </Badge>
            </div>
            <Text size="xs" className="text-purple-100 uppercase tracking-wider mb-1">
              Résultat Net
            </Text>
            <Text size="xl" fw={800} className="text-white mb-2">
              {beneficeBrut >= 0 ? '+' : ''}{formatN(beneficeBrut)} FCFA
            </Text>
            <Divider color="white" opacity={0.2} my="sm" />
            <div className="space-y-1">
              <div className="flex justify-between">
                <Text size="xs" className="text-purple-100">Marge bénéficiaire</Text>
                <Text size="xs" fw={600} className="text-white">{margeBeneficiaire.toFixed(1)}%</Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" className="text-purple-100">Ratio dépenses/gains</Text>
                <Text size="xs" fw={600} className="text-white">{totalVentes > 0 ? ((totalAchats / totalVentes) * 100).toFixed(1) : 0}%</Text>
              </div>
              <div className="flex justify-between">
                <Text size="xs" className="text-purple-100">Statut</Text>
                <Text size="xs" fw={600} className="text-white">
                  {beneficeBrut >= 0 ? '✅ Rentable' : '⚠️ Déficitaire'}
                </Text>
              </div>
            </div>
          </div>
        </SimpleGrid>
      </Paper>

      {/* ===== SECTION MOIS EN COURS ===== */}
      <Paper withBorder p="lg" radius="lg" className="mb-8 shadow-sm border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <ThemeIcon size="lg" radius="md" color="blue" variant="light">
            <FaCalendarAlt size={18} />
          </ThemeIcon>
          <div>
            <Text size="md" fw={700} className="text-slate-800 dark:text-white">
              Performance du Mois - {format(now, 'MMMM yyyy', { locale: fr })}
            </Text>
            <Text size="xs" className="text-slate-500">
              Comparaison avec le mois précédent
            </Text>
          </div>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
          {/* Ventes du mois */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-900/30">
            <div className="flex items-center justify-between mb-2">
              <Text size="xs" fw={500} className="text-green-600 dark:text-green-400">
                VENTES DU MOIS
              </Text>
              <div className={`flex items-center gap-1 ${evolutionVentes >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {evolutionVentes >= 0 ? <TbTrendingUp size={14} /> : <TbTrendingDown size={14} />}
                <Text size="xs" fw={600}>{evolutionVentes >= 0 ? '+' : ''}{evolutionVentes.toFixed(1)}%</Text>
              </div>
            </div>
            <Text size="xl" fw={700} className="text-green-700 dark:text-green-300">
              {formatN(ventesMoisCourant)} F
            </Text>
            <Text size="xs" className="text-green-600/70 dark:text-green-400/70 mt-1">
              vs {formatN(ventesMoisDernier)} F le mois dernier
            </Text>
          </div>

          {/* Achats du mois */}
          <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-xl border border-red-200 dark:border-red-900/30">
            <div className="flex items-center justify-between mb-2">
              <Text size="xs" fw={500} className="text-red-600 dark:text-red-400">
                ACHATS DU MOIS
              </Text>
              <div className={`flex items-center gap-1 ${evolutionAchats <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {evolutionAchats <= 0 ? <TbTrendingDown size={14} /> : <TbTrendingUp size={14} />}
                <Text size="xs" fw={600}>{evolutionAchats >= 0 ? '+' : ''}{evolutionAchats.toFixed(1)}%</Text>
              </div>
            </div>
            <Text size="xl" fw={700} className="text-red-700 dark:text-red-300">
              {formatN(achatsMoisCourant)} F
            </Text>
            <Text size="xs" className="text-red-600/70 dark:text-red-400/70 mt-1">
              vs {formatN(achatsMoisDernier)} F le mois dernier
            </Text>
          </div>

          {/* Bénéfice du mois */}
          <div className={`p-4 bg-gradient-to-r ${beneficeMoisCourant >= 0 ? 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-violet-200 dark:border-violet-900/30' : 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-900/30'} rounded-xl border`}>
            <div className="flex items-center justify-between mb-2">
              <Text size="xs" fw={500} className={beneficeMoisCourant >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-orange-600 dark:text-orange-400'}>
                BÉNÉFICE DU MOIS
              </Text>
              <div className={`flex items-center gap-1 ${evolutionBenefice >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {evolutionBenefice >= 0 ? <TbTrendingUp size={14} /> : <TbTrendingDown size={14} />}
                <Text size="xs" fw={600}>{evolutionBenefice >= 0 ? '+' : ''}{evolutionBenefice.toFixed(1)}%</Text>
              </div>
            </div>
            <Text size="xl" fw={700} className={beneficeMoisCourant >= 0 ? 'text-violet-700 dark:text-violet-300' : 'text-orange-700 dark:text-orange-300'}>
              {beneficeMoisCourant >= 0 ? '+' : ''}{formatN(beneficeMoisCourant)} F
            </Text>
            <Text size="xs" className={beneficeMoisCourant >= 0 ? 'text-violet-600/70 dark:text-violet-400/70' : 'text-orange-600/70 dark:text-orange-400/70'} mt-1>
              vs {beneficeMoisDernier >= 0 ? '+' : ''}{formatN(beneficeMoisDernier)} F le mois dernier
            </Text>
          </div>

          {/* Bénéfice de l'année */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
            <Text size="xs" fw={500} className="text-blue-600 dark:text-blue-400 mb-2">
              BÉNÉFICE ANNUEL {now.getFullYear()}
            </Text>
            <Text size="xl" fw={700} className={beneficeAnnee >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}>
              {beneficeAnnee >= 0 ? '+' : ''}{formatN(beneficeAnnee)} F
            </Text>
            <Text size="xs" className="text-blue-600/70 dark:text-blue-400/70 mt-1">
              Ventes: {formatN(ventesAnnee)} F | Achats: {formatN(achatsAnnee)} F
            </Text>
          </div>
        </SimpleGrid>
      </Paper>

      {/* ===== CARTES STATISTIQUES CLASSIQUES ===== */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" className="mb-8">
        <Paper withBorder p="lg" radius="lg" className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Group className="mb-3">
            <div className="flex flex-col">
              <Text c="dimmed" className="uppercase tracking-wider" fw={600} size="xs">
                Ventes Totales
              </Text>
              <Text fw={700} size="xl" className="text-slate-800 dark:text-white">
                {formatN(totalVentes)} FCFA
              </Text>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/30">
              <FaChartLine size={20} className="text-blue-500 dark:text-blue-400" />
            </div>
          </Group>
          <div className="mt-4">
            <Group className="mb-1">
              <Text size="xs" color={pourcentageCroissance >= 0 ? 'teal' : 'red'} fw={500}>
                {pourcentageCroissance >= 0 ? '+' : ''}{pourcentageCroissance}% 
              </Text>
              <Text size="xs" color="dimmed">
                vs mois précédent
              </Text>
            </Group>
            <Progress 
              value={Math.min(Math.abs(pourcentageCroissance), 100)} 
              color={pourcentageCroissance >= 0 ? 'teal' : 'red'} 
              size="sm" 
              radius="xl"
            />
          </div>
        </Paper>

        <Paper withBorder p="lg" radius="lg" className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Group className="mb-3">
            <div className="flex flex-col">
              <Text c="dimmed" className="uppercase tracking-wider" fw={600} size="xs">
                Achats Totaux
              </Text>
              <Text fw={700} size="xl" className="text-slate-800 dark:text-white">
                {formatN(totalAchats)} FCFA
              </Text>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50 dark:bg-red-900/30">
              <FaShoppingCart size={20} className="text-red-500 dark:text-red-400" />
            </div>
          </Group>
          <div className="mt-4">
            <Group className="mb-1">
              <Text size="xs" c="dimmed" fw={500}>
                {Math.round((totalAchats / (totalVentes || 1)) * 100)}% des ventes
              </Text>
              <Text size="xs" c="dimmed">
                Ratio dépenses/revenus
              </Text>
            </Group>
            <Progress 
              value={Math.min(Math.round((totalAchats / (totalVentes || 1)) * 100), 100)} 
              color="orange" 
              size="sm" 
              radius="xl"
            />
          </div>
        </Paper>

        <Paper withBorder p="lg" radius="lg" className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <Group className="mb-3">
            <div className="flex flex-col">
              <Text c="dimmed" className="uppercase tracking-wider" fw={600} size="xs">
                Bénéfice Brut
              </Text>
              <Text fw={700} size="xl" className={beneficeBrut >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}>
                {formatN(beneficeBrut)} FCFA
              </Text>
            </div>
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-teal-50 dark:bg-teal-900/30">
              <FaMoneyBillWave size={20} className="text-teal-500 dark:text-teal-400" />
            </div>
          </Group>
          <div className="mt-4">
            <RingProgress
              sections={[
                { value: Math.max(0, Math.min(ratioBeneficeVentes, 100)), color: 'teal' },
              ]}
              label={
                <Text c="teal" fw={700} ta="center" size="lg">
                  {Math.round(ratioBeneficeVentes)}%
                </Text>
              }
              size={80}
              thickness={8}
              roundCaps
            />
            <Text size="xs" color="dimmed" ta="center" mt="sm">
              Marge bénéficiaire
            </Text>
          </div>
        </Paper>
      </SimpleGrid>

      {/* Graphiques */}
      <Grid gutter="lg">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="lg" radius="lg" className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <Text size="sm" fw={700} className="text-slate-800 dark:text-white">
                  Évolution des Ventes Mensuelles
                </Text>
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Mensuel
                </div>
              </div>
              <Divider className="mb-4 border-slate-100 dark:border-slate-700" />
              <ResponsiveContainer width="100%" height={300} key="ventes-chart">
                <AreaChart data={ventesData}>
                  <defs>
                    <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="mois" tick={{ fill: '#6b7280' }} />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <RechartsTooltip 
                    formatter={(value: any) => formatN(value) + ' FCFA'}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', border: 'none' }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="montant" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorVentes)" 
                    name="Montant des ventes" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="lg" radius="lg" className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <Text size="sm" fw={700} className="text-slate-800 dark:text-white">
                  Comparaison Ventes/Achats
                </Text>
                <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Journalier
                </div>
              </div>
              <Divider className="mb-4 border-slate-100 dark:border-slate-700" />
              <ResponsiveContainer width="100%" height={300} key="comparaison-chart">
                <LineChart data={comparaisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280' }} />
                  <YAxis tick={{ fill: '#6b7280' }} />
                  <RechartsTooltip 
                    formatter={(value: any) => formatN(value) + ' FCFA'}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', border: 'none' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ventes"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Ventes"
                  />
                  <Line
                    type="monotone"
                    dataKey="achats"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Achats"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Graphique des produits par famille */}
      <Grid className="mt-6" gutter="lg">
        <Grid.Col span={12}>
          <Paper withBorder p="lg" radius="lg" className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <Text size="sm" fw={700} className="text-slate-800 dark:text-white">
                  Répartition des Produits par Famille
                </Text>
                <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  Inventaire
                </div>
              </div>
              <Divider className="mb-4 border-slate-100 dark:border-slate-700" />
              <div className="flex flex-wrap">
                <div className="w-full md:w-1/2 p-2">
                  <Text size="xs" fw={500} className="text-slate-500 dark:text-slate-400 mb-2 text-center">
                    Distribution par quantité et prix moyen
                  </Text>
                  <ResponsiveContainer width="100%" height={300} key="famille-bar-chart">
                    <BarChart data={produitsParFamille} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="nom" tick={{ fill: '#6b7280', fontSize: 10 }} />
                      <YAxis tick={{ fill: '#6b7280' }} />
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => {
                          if (name === "Prix Moyen") return formatN(value) + ' FCFA';
                          return value;
                        }}
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', border: 'none' }}
                      />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        fill="#3b82f6" 
                        name="Nombre de Produits" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="prixMoyen" 
                        fill="#8A2BE2" 
                        name="Prix Moyen" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full md:w-1/2 p-2">
                  <Text size="xs" fw={500} className="text-slate-500 dark:text-slate-400 mb-2 text-center">
                    Répartition en pourcentage
                  </Text>
                  <ResponsiveContainer width="100%" height={300} key="famille-pie-chart">
                    <PieChart>
                      <Pie
                        data={produitsParFamille}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ nom, count, percent }) => `${nom.substring(0, 10)}${nom.length > 10 ? '...' : ''}: ${count} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        innerRadius={40}
                        fill="#8884d8"
                        dataKey="count"
                        paddingAngle={2}
                      >
                        {produitsParFamille.map((_: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value) => value} 
                        contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', border: 'none' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Paper>
        </Grid.Col>
        
        {/* Nouvelle section: Analyse de Stock */}
        <Grid.Col span={12}>
          <Paper withBorder p="lg" radius="lg" className="shadow-sm hover:shadow-md transition-shadow duration-300 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FaShoppingCart className="text-[#8A2BE2]" />
                <Text size="lg" fw={700} className="text-slate-800 dark:text-white">
                  Analyse de Stock
                </Text>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {formatN(totalStock)} articles en stock
              </div>
            </div>
            <Divider className="mb-4 border-slate-100 dark:border-slate-700" />
            
            <SimpleGrid cols={{ base: 1, md: 2, lg: 4 }} className="mb-6">
              <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl border border-orange-200 dark:border-orange-900/30">
                <Text size="xs" fw={500} className="text-orange-600 dark:text-orange-400 mb-1">
                  TOTAL ARTICLES
                </Text>
                <Text size="xl" fw={700} className="text-orange-700 dark:text-orange-300">
                  {formatN(totalStock)}
                </Text>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-900/30">
                <Text size="xs" fw={500} className="text-blue-600 dark:text-blue-400 mb-1">
                  VALEUR DU STOCK
                </Text>
                <Text size="xl" fw={700} className="text-blue-700 dark:text-blue-300">
                  {formatN(valeurStock)} FCFA
                </Text>
              </div>
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-900/30">
                <Text size="xs" fw={500} className="text-red-600 dark:text-red-400 mb-1">
                  PRODUITS EN RUPTURE
                </Text>
                <Text size="xl" fw={700} className="text-red-700 dark:text-red-300">
                  {produitsFaibleStock.filter((p: any) => p.quantite === 0).length}
                </Text>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-900/30">
                <Text size="xs" fw={500} className="text-green-600 dark:text-green-400 mb-1">
                  ROTATION DU STOCK
                </Text>
                <Text size="xl" fw={700} className="text-green-700 dark:text-green-300">
                  {valeurStock > 0 ? (totalAchats / valeurStock).toFixed(2) : '0.00'}
                </Text>
              </div>
            </SimpleGrid>
            
            <div className="flex flex-col md:flex-row flex-wrap">
              <div className="w-full md:w-1/2 p-2">
                <Text size="xs" fw={500} className="text-slate-500 dark:text-slate-400 mb-2 text-center">
                  Stock par dépôt
                </Text>
                <ResponsiveContainer width="100%" height={300} key="stock-depot-chart">
                  <BarChart data={stockParDepot}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="nom" tick={{ fill: '#6b7280' }} />
                    <YAxis tick={{ fill: '#6b7280' }} />
                    <RechartsTooltip
                      formatter={(value: any, name: string) => {
                        if (name === 'quantite') return formatN(value) + ' articles';
                        return formatN(value) + ' FCFA';
                      }}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', border: 'none' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="quantite" 
                      fill="#8A2BE2" 
                      name="Quantité" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      dataKey="valeur" 
                      fill="#3b82f6" 
                      name="Valeur" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full md:w-1/2 p-2">
                <Text size="xs" fw={500} className="text-slate-500 dark:text-slate-400 mb-2 text-center">
                  Produits à faible stock
                </Text>
                <ResponsiveContainer width="100%" height={300} key="faible-stock-chart">
                  <BarChart data={produitsFaibleStock} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fill: '#6b7280' }} />
                    <YAxis dataKey="nom" type="category" tick={{ fill: '#6b7280' }} width={100} />
                    <RechartsTooltip
                      formatter={(value: any, _name: string, props: any) => {
                        const item = props.payload;
                        return [
                          `${formatN(value)} articles`,
                          `Statut: ${item.statut}`
                        ];
                      }}
                      contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', border: 'none' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="quantite" 
                      fill="#ef4444" 
                      name="Stock restant" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Paper>
        </Grid.Col>
      </Grid>
    </div>
  );
}

export default Overview;
