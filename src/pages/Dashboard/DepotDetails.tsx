import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Paper, Title, Text, Divider, Loader, Tooltip, Button, Badge } from '@mantine/core';
import {
  FaWarehouse,
  FaMapMarkerAlt,
  FaUser,
  FaShoppingBag,
  FaEye,
  FaRegCalendarAlt,
  FaMoneyBillWave,
  FaArrowLeft,
  FaFilePdf
} from 'react-icons/fa';
import { FaCartShopping } from 'react-icons/fa6';
import { authclient } from '../../../lib/auth-client';
import { DepotService } from '../../services/depot.service';
import { AchatService } from '../../services/achat.service';
import { ParamService } from '../../services/paramservice';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatN } from '../../lib/helpers';
import { SearchInput, EmptyState } from '../../components/ui';
import { Table as ShadcnTable, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../components/shadcn';
import pdfMake from "pdfmake/build/pdfmake";
import { font } from "../../vfs_fonts";

pdfMake.vfs = font;

const DepotDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // Session utilisateur
  const { data: session } = authclient.useSession();
  const userId = session?.user?.id;

  // Services
  const depotService = new DepotService();
  const achatService = new AchatService();
  const paramService = new ParamService();

  // Récupération du dépôt
  const { 
    data: depot, 
    isLoading: loadingDepot,
    isError: errorDepot,
    refetch: refetchDepot
  } = useQuery({
    queryKey: ['depot-details', id],
    queryFn: () => depotService.getById(id!),
    enabled: !!id && !!userId,
  });

  // Récupération des achats par dépôt
  const {
    data: achatsDepot,
    isLoading: loadingAchatsDepot,
    isError: errorAchatsDepot,
    refetch: refetchAchatsDepot
  } = useQuery({
    queryKey: ['achats-depot', id],
    queryFn: () => achatService.getByDepot(id!),
    enabled: !!id && !!userId,
  });

  // Récupération des paramètres de l'entreprise
  const { data: param } = useQuery({
    queryKey: ['param'],
    queryFn: () => paramService.getByUser(userId!),
    enabled: !!userId,
  });

  // Filtrer les achats par recherche
  const filteredAchats = achatsDepot?.filter((achat: any) => {
    if (searchText === '') return true;

    const searchLower = searchText.toLowerCase();
    return (
      (achat.ref && achat.ref.toLowerCase().includes(searchLower)) ||
      (achat.fournisseur?.nom && achat.fournisseur.nom.toLowerCase().includes(searchLower))
    );
  });

  // Pagination manuelle de la table des achats
  const PAGE_SIZE = 10;
  const totalAchats = filteredAchats?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalAchats / PAGE_SIZE));
  const pagedAchats = filteredAchats?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) ?? [];

  // Réinitialiser la page lorsque la recherche change ou si on sort des bornes
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);

  // Retour à la liste des dépôts
  const handleBack = () => {
    navigate('/dashboard/depots');
  };

  // Voir les détails d'un achat
  const handleViewAchat = (achatId: string) => {
    navigate(`/dashboard/approvisionnements/${achatId}`);
  };

  // Générer un rapport PDF pour le dépôt
  const generatePDF = () => {
    if (!depot || !achatsDepot) return;
    
    setGeneratingPdf(true);
    
    try {
      // Calcul des statistiques
      const totalAchats = achatsDepot.length;
      const totalProduits = achatsDepot.reduce((acc: number, cur: any) => acc + (cur.produits?.length || 0), 0);
      const montantTotal = achatsDepot.reduce((acc: number, cur: any) => acc + (cur.net_a_payer || 0), 0);
      const totalRemises = achatsDepot.reduce((acc: number, cur: any) => acc + (cur.remise || 0), 0);
      
      // Regrouper les produits par référence pour calculer les stocks
      const produitsMap = new Map();
      
      achatsDepot.forEach((achat: any) => {
        achat.produits.forEach((prod: any) => {
          if (!produitsMap.has(prod.ref)) {
            produitsMap.set(prod.ref, {
              ref: prod.ref,
              nom: prod.nom,
              quantite: 0,
              montant: 0
            });
          }
          
          const prodStat = produitsMap.get(prod.ref);
          const qte = parseInt(prod.qte);
          prodStat.quantite += qte;
          prodStat.montant += prod.pu * qte;
        });
      });
      
      const produitsArray = Array.from(produitsMap.values());
      
      // Définition du document PDF
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [30, 40, 30, 40],
        footer: function(currentPage: number, pageCount: number) { 
          return { 
            text: `Page ${currentPage} sur ${pageCount}`, 
            alignment: 'center',
            margin: [0, 10, 0, 0],
            style: 'footer'
          };
        },
        background: function() {
          return {
            canvas: [
              {
                type: 'rect',
                x: 0,
                y: 0,
                w: 595,
                h: 15,
                color: 'brand'
              }
            ]
          };
        },
        images: param?.logo ? {
          logo: `${import.meta.env.VITE_BACKURL}/uploads/${param.logo}`
        } : {},
        content: [
          {
            columns: [
              {
                width: '*',
                stack: [
                  { text: param?.nom || 'Votre Entreprise', style: 'headerCompany' },
                  param?.logo ? { image: 'logo', width: 100, height: 50, margin: [0, 5, 0, 10] } : {},
                  { text: `Tél: ${param?.tel || 'N/A'}`, style: 'companyDetails' },
                  { text: `Email: ${param?.email || 'N/A'}`, style: 'companyDetails' },
                  { text: `Adresse: ${param?.addr || 'N/A'}`, style: 'companyDetails' },
                  param?.rc ? { text: `RC: ${param.rc}`, style: 'companyDetails' } : {},
                  param?.ice ? { text: `ICE: ${param.ice}`, style: 'companyDetails' } : {},
                  param?.if ? { text: `IF: ${param.if}`, style: 'companyDetails' } : {}
                ]
              },
              {
                width: 'auto',
                stack: [
                  { text: 'RAPPORT DE DÉPÔT', style: 'header' },
                  { text: `Dépôt: ${depot.nom}`, style: 'subheader' },
                  { text: `Date d'édition: ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}`, style: 'subheader' },
                  { text: `Généré par: ${session?.user?.name || 'Utilisateur'}`, style: 'subheader' }
                ],
                alignment: 'right'
              }
            ]
          },
          { text: '\n' },
          {
            canvas: [
              {
                type: 'line',
                x1: 0, y1: 0,
                x2: 535, y2: 0,
                lineWidth: 1,
                lineColor: '#334155'
              }
            ]
          },
          {
            text: 'INFORMATIONS DU DÉPÔT',
            style: 'sectionHeader'
          },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: 'Nom du dépôt', style: 'tableHeader' },
                  { text: 'Adresse', style: 'tableHeader' }
                ],
                [
                  { text: depot.nom, style: 'tableCell' },
                  { text: depot.adresse, style: 'tableCell' }
                ],
                [
                  { text: 'Responsable', style: 'tableHeader' },
                  { text: 'Statut', style: 'tableHeader' }
                ],
                [
                  { text: depot.responsable || 'Non défini', style: 'tableCell' },
                  { text: depot.actif ? 'Actif' : 'Inactif', style: 'tableCell' }
                ]
              ]
            },
            layout: {
              hLineWidth: function(i: number, node: any) { return (i === 0 || i === node.table.body.length) ? 2 : 1; },
              vLineWidth: function(i: number, node: any) { return (i === 0 || i === node.table.widths.length) ? 2 : 1; },
              hLineColor: function(i: number, node: any) { return (i === 0 || i === node.table.body.length) ? '#334155' : '#aaaaaa'; },
              vLineColor: function(i: number, node: any) { return (i === 0 || i === node.table.widths.length) ? '#334155' : '#aaaaaa'; },
              paddingLeft: function() { return 5; },
              paddingRight: function() { return 5; },
              paddingTop: function() { return 3; },
              paddingBottom: function() { return 3; }
            }
          },
          depot.description ? {
            text: `Description: ${depot.description}`,
            style: 'description',
            margin: [0, 10, 0, 0]
          } : {},
          { text: '\n' },
          {
            canvas: [
              {
                type: 'line',
                x1: 0, y1: 0,
                x2: 535, y2: 0,
                lineWidth: 1,
                lineColor: '#334155'
              }
            ]
          },
          {
            text: 'RÉSUMÉ DES ACHATS',
            style: 'sectionHeader'
          },
          {
            table: {
              headerRows: 1,
              widths: ['*', '*', '*', '*'],
              body: [
                [
                  { text: 'Total Achats', style: 'tableHeader' },
                  { text: 'Total Produits', style: 'tableHeader' },
                  { text: 'Montant Total', style: 'tableHeader' },
                  { text: 'Total Remises', style: 'tableHeader' }
                ],
                [
                  { text: totalAchats, style: 'tableCell' },
                  { text: totalProduits, style: 'tableCell' },
                  { text: `${formatN(montantTotal)} FCFA`, style: 'tableCell' },
                  { text: `${formatN(totalRemises)} FCFA`, style: 'tableCell' }
                ]
              ]
            },
            layout: {
              hLineWidth: function(i: number, node: any) { return (i === 0 || i === node.table.body.length) ? 2 : 1; },
              vLineWidth: function(i: number, node: any) { return (i === 0 || i === node.table.widths.length) ? 2 : 1; },
              hLineColor: function(i: number, node: any) { return (i === 0 || i === node.table.body.length) ? '#334155' : '#aaaaaa'; },
              vLineColor: function(i: number, node: any) { return (i === 0 || i === node.table.widths.length) ? '#334155' : '#aaaaaa'; },
              paddingLeft: function() { return 5; },
              paddingRight: function() { return 5; },
              paddingTop: function() { return 3; },
              paddingBottom: function() { return 3; }
            }
          },
          { text: '\n' },
          {
            canvas: [
              {
                type: 'line',
                x1: 0, y1: 0,
                x2: 535, y2: 0,
                lineWidth: 1,
                lineColor: '#334155'
              }
            ]
          },
          {
            text: 'DÉTAILS DES PRODUITS',
            style: 'sectionHeader'
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', '*', 'auto', 'auto'],
              body: [
                [
                  { text: 'Réf', style: 'tableHeader' },
                  { text: 'Produit', style: 'tableHeader' },
                  { text: 'Quantité', style: 'tableHeader' },
                  { text: 'Montant', style: 'tableHeader' }
                ],
                ...produitsArray.map(prod => [
                  { text: prod.ref, style: 'tableCell' },
                  { text: prod.nom, style: 'tableCell' },
                  { text: formatN(prod.quantite), style: 'tableCell' },
                  { text: `${formatN(prod.montant)} FCFA`, style: 'tableCell' }
                ])
              ]
            },
            layout: {
              hLineWidth: function(i: number, node: any) { return (i === 0 || i === node.table.body.length) ? 2 : 1; },
              vLineWidth: function(i: number, node: any) { return (i === 0 || i === node.table.widths.length) ? 2 : 1; },
              hLineColor: function(i: number, node: any) { return (i === 0 || i === node.table.body.length) ? '#334155' : '#aaaaaa'; },
              vLineColor: function(i: number, node: any) { return (i === 0 || i === node.table.widths.length) ? '#334155' : '#aaaaaa'; },
              paddingLeft: function() { return 5; },
              paddingRight: function() { return 5; },
              paddingTop: function() { return 3; },
              paddingBottom: function() { return 3; }
            }
          },
          { text: '\n' },
          {
            canvas: [
              {
                type: 'line',
                x1: 0, y1: 0,
                x2: 535, y2: 0,
                lineWidth: 1,
                lineColor: '#334155'
              }
            ]
          },
          {
            text: 'LISTE DES ACHATS',
            style: 'sectionHeader'
          },
          {
            table: {
              headerRows: 1,
              widths: ['auto', 'auto', '*', 'auto', 'auto'],
              body: [
                [
                  { text: 'Référence', style: 'tableHeader' },
                  { text: 'Date', style: 'tableHeader' },
                  { text: 'Fournisseur', style: 'tableHeader' },
                  { text: 'Montant', style: 'tableHeader' },
                  { text: 'Produits', style: 'tableHeader' }
                ],
                ...achatsDepot.map((achat: any) => [
                  { text: achat.ref, style: 'tableCell' },
                  { text: format(new Date(achat.date), 'dd/MM/yyyy'), style: 'tableCell' },
                  { text: achat.fournisseur?.nom || 'N/A', style: 'tableCell' },
                  { text: `${formatN(achat.net_a_payer)} FCFA`, style: 'tableCell' },
                  { text: achat.produits.length, style: 'tableCell' }
                ])
              ]
            },
            layout: {
              hLineWidth: function(i: number, node: any) { return (i === 0 || i === node.table.body.length) ? 2 : 1; },
              vLineWidth: function(i: number, node: any) { return (i === 0 || i === node.table.widths.length) ? 2 : 1; },
              hLineColor: function(i: number, node: any) { return (i === 0 || i === node.table.body.length) ? '#334155' : '#aaaaaa'; },
              vLineColor: function(i: number, node: any) { return (i === 0 || i === node.table.widths.length) ? '#334155' : '#aaaaaa'; },
              paddingLeft: function() { return 5; },
              paddingRight: function() { return 5; },
              paddingTop: function() { return 3; },
              paddingBottom: function() { return 3; }
            }
          }
        ],
        styles: {
          header: {
            fontSize: 20,
            bold: true,
            margin: [0, 0, 0, 10],
            color: 'brand'
          },
          headerCompany: {
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 5],
            color: '#333333'
          },
          companyDetails: {
            fontSize: 11,
            margin: [0, 0, 0, 3],
            color: '#555555'
          },
          subheader: {
            fontSize: 14,
            margin: [0, 0, 0, 5],
            color: '#666666'
          },
          sectionHeader: {
            fontSize: 16,
            bold: true,
            margin: [0, 15, 0, 10],
            color: 'brand'
          },
          tableHeader: {
            fontSize: 12,
            bold: true,
            fillColor: '#334155',
            color: '#ffffff',
            alignment: 'center',
            margin: [5, 5, 5, 5]
          },
          tableCell: {
            fontSize: 10,
            alignment: 'center',
            margin: [5, 5, 5, 5],
            color: '#333333'
          },
          description: {
            fontSize: 12,
            italics: true,
            color: '#666666'
          },
          footer: {
            fontSize: 9,
            color: '#777777',
            italics: true
          }
        },
        defaultStyle: {
          font: 'Roboto'
        }
      };

      pdfMake.createPdf(docDefinition).open();
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    } finally {
      setGeneratingPdf(false);
    }
  };

  return (
    <div className="p-4 md:p-6 2xl:p-10">
      <Paper
        p="xl"
        radius="lg"
        className="bg-card shadow-xl border border-border"
        style={{
          backgroundImage: "linear-gradient(to right bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))",
          backdropFilter: "blur(10px)"
        }}
      >
        {/* En-tête */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="subtle"
                leftSection={<FaArrowLeft />}
                onClick={handleBack}
                className="text-gray-600 hover:text-primary mr-2"
              />
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                <FaWarehouse className="text-primary text-xl" />
              </div>
              <Title order={2} className="text-foreground">
                {loadingDepot ? (
                  <div className="flex items-center gap-2">
                    <span>Chargement du dépôt</span>
                    <Loader size="sm" color="brand" />
                  </div>
                ) : (
                  depot?.nom || "Détails du dépôt"
                )}
              </Title>
            </div>
            <Text className="text-muted-foreground mt-2 ml-12">
              Visualisez les achats et les informations de ce dépôt
            </Text>
          </div>
          
          {/* Bouton de génération de PDF */}
          {!loadingDepot && depot && (
            <Tooltip label="Générer un rapport PDF détaillé">
              <Button
                variant="filled"
                leftSection={<FaFilePdf />}
                onClick={generatePDF}
                loading={generatingPdf}
                className="bg-gradient-to-r from-primary to-primary/70 hover:from-primary/80 hover:to-primary border-none shadow-sm hover:shadow-md transition-all duration-300 mt-4 md:mt-0"
              >
                Générer PDF
              </Button>
            </Tooltip>
          )}
        </div>

        <Divider className="my-6" />

        {loadingDepot ? (
          <div className="flex justify-center items-center py-12">
            <Loader color="brand" size="md" />
          </div>
        ) : errorDepot ? (
          <div className="text-center py-8">
            <div className="text-red-500 text-xl mb-2">Erreur lors du chargement du dépôt</div>
            <Button variant="filled" onClick={() => refetchDepot()}>Réessayer</Button>
          </div>
        ) : depot ? (
          <>
            {/* Informations du dépôt */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-6 mb-8 border border-orange-200 dark:border-orange-900/30 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <FaWarehouse className="text-primary" />
                    <Text className="text-muted-foreground font-medium">Nom du dépôt</Text>
                  </div>
                  <Text className="text-foreground text-lg font-semibold ml-6">{depot.nom}</Text>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <FaMapMarkerAlt className="text-primary" />
                    <Text className="text-muted-foreground font-medium">Adresse</Text>
                  </div>
                  <Text className="text-foreground ml-6">{depot.adresse}</Text>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-2">
                    <FaUser className="text-primary" />
                    <Text className="text-muted-foreground font-medium">Responsable</Text>
                  </div>
                  <Text className="text-foreground ml-6">
                    {depot.responsable || <span className="text-gray-400 italic">Non défini</span>}
                  </Text>
                </div>
              </div>
              
              {depot.description && (
                <div className="mt-4 pt-4 border-t border-orange-200 dark:border-orange-900/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Text className="text-muted-foreground font-medium">Description</Text>
                  </div>
                  <Text className="text-foreground">{depot.description}</Text>
                </div>
              )}
            </div>

            {/* Statistiques des achats */}
            <div className="bg-gc-surface rounded-xl shadow-sm border border-gc p-4 mb-6">
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-3 rounded-lg">
                  <FaCartShopping size={16} className="text-blue-500" />
                  <div>
                    <Text size="xs" className="text-blue-600 dark:text-blue-300">TOTAL ACHATS</Text>
                    <Text fw={700} className="text-blue-700 dark:text-blue-300">
                      {achatsDepot?.length || 0}
                    </Text>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/30 px-4 py-3 rounded-lg">
                  <FaShoppingBag size={16} className="text-green-500" />
                  <div>
                    <Text size="xs" className="text-green-600 dark:text-green-300">PRODUITS</Text>
                    <Text fw={700} className="text-green-700 dark:text-green-300">
                      {achatsDepot?.reduce((acc: number, cur: any) => acc + (cur.produits?.length || 0), 0) || 0}
                    </Text>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-900/30 px-4 py-3 rounded-lg">
                  <FaMoneyBillWave size={16} className="text-orange-500" />
                  <div>
                    <Text size="xs" className="text-orange-600 dark:text-orange-300">MONTANT TOTAL</Text>
                    <Text fw={700} className="text-orange-700 dark:text-orange-300">
                      {formatN(achatsDepot?.reduce((acc: number, cur: any) => acc + (cur.net_a_payer || 0), 0) || 0)} FCFA
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Barre de recherche */}
            <div className="mb-6">
              <SearchInput
                value={searchText}
                onChange={setSearchText}
                placeholder="Rechercher un achat par référence ou fournisseur..."
                className="rounded-md border-border focus:border-primary focus:shadow-md transition-all duration-300"
              />
            </div>

            {/* Liste des achats */}
            <div className="bg-gc-surface rounded-xl shadow-sm border border-gc overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-orange-500 to-orange-600">
                <div className="flex items-center gap-2">
                  <FaCartShopping className="text-white" />
                  <Text className="text-white font-medium">Achats enregistrés pour ce dépôt</Text>
                </div>
              </div>

              {loadingAchatsDepot ? (
                <div className="flex justify-center items-center py-12">
                  <Loader color="brand" size="md" />
                </div>
              ) : errorAchatsDepot ? (
                <div className="text-center py-8">
                  <div className="text-red-500 text-xl mb-2">Erreur lors du chargement des achats</div>
                  <Button variant="filled" onClick={() => refetchAchatsDepot()}>Réessayer</Button>
                </div>
              ) : filteredAchats && filteredAchats.length > 0 ? (
                <div className="overflow-x-auto">
                  <ShadcnTable>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Référence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Fournisseur</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Remise</TableHead>
                        <TableHead>Net à payer</TableHead>
                        <TableHead>Produits</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedAchats.map((achat: any) => (
                        <TableRow key={achat._id}>
                          <TableCell>
                            <Badge color="blue" variant="light" className="px-2 py-1 rounded-md">{achat.ref}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FaRegCalendarAlt className="text-gray-400" size={12} />
                              <span>{format(new Date(achat.date), 'dd/MM/yyyy')}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <FaUser className="text-gray-400" size={12} />
                              <span>{achat.fournisseur?.nom || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{formatN(achat.montant)} FCFA</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-orange-500 font-medium">{formatN(achat.remise)} FCFA</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600 font-medium">{formatN(achat.net_a_payer)} FCFA</span>
                          </TableCell>
                          <TableCell>
                            <Badge color="orange" variant="light" className="px-2 py-1 rounded-full">
                              {achat.produits.length} produits
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="filled"
                              size="sm"
                              leftSection={<FaEye />}
                              onClick={() => handleViewAchat(achat._id)}
                              className="bg-gradient-to-r from-primary to-primary/70 hover:from-primary/80 hover:to-primary border-none shadow-sm hover:shadow-md transition-all duration-300"
                            >
                              Détails
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </ShadcnTable>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-end gap-2 p-3 border-t border-gc">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                      >
                        Précédent
                      </Button>
                      <Text size="sm" className="text-gc-muted">
                        Page {page} / {totalPages}
                      </Text>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages}
                      >
                        Suivant
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  icon={<FaCartShopping size={26} />}
                  title="Aucun achat"
                  hint="Aucun achat n'a été enregistré pour ce dépôt"
                />
              )}
            </div>
          </>
        ) : (
          <EmptyState
            icon={<FaWarehouse size={26} />}
            title="Dépôt non trouvé"
          />
        )}
      </Paper>
    </div>
  );
};

export default DepotDetails;
