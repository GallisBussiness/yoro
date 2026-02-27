import { useParams, useNavigate } from "react-router-dom";
import { AchatService } from "../../services/achat.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Button, LoadingOverlay, Text, Modal, NumberInput, Group, Paper, Title, Badge, ActionIcon, Tooltip, Divider, Card, Avatar, Tabs } from "@mantine/core";
import { WeeklyRevenue } from "./WeeklyRevenue";
import { useState, useEffect } from "react";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { DataTable } from "mantine-datatable";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FaEye, FaEdit, FaTrash, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFileInvoiceDollar, FaCalendarAlt, FaMoneyBillWave, FaPercentage, FaArrowLeft, FaPlus, FaTimes, FaSearch, FaSave } from "react-icons/fa";
import { formatN } from "../../lib/helpers";
import { DatePickerInput } from "@mantine/dates";
import { toast } from "sonner";
import { TextInput } from "@mantine/core";
import { FournisseurService } from "../../services/fournisseur.service";
import { PaiementFournisseurService } from "../../services/paiement-fournisseur.service";
import { DetteFournisseurService, DetteFournisseur } from "../../services/dette-fournisseur.service";
import { PaiementDetteFournisseurService } from "../../services/paiement-dette-fournisseur.service";

const PAGE_SIZE = 10;

function Fournisseur() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<any[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedAchat, setSelectedAchat] = useState<any>(null);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [currentPaiement, setCurrentPaiement] = useState<any>({
    date: new Date().toISOString(),
    achat: "",
    montant: 0,
    fournisseur: id || ""
  });
  const [isEditing, setIsEditing] = useState(false);

  // État pour la gestion des dettes fournisseur
  const [detteQuery, setDetteQuery] = useState('');
  const [debouncedDetteQuery] = useDebouncedValue(detteQuery, 200);
  const [dettePage, setDettePage] = useState(1);
  const [detteRecords, setDetteRecords] = useState<any[]>([]);
  const [detteModalOpened, { open: openDetteModal, close: closeDetteModal }] = useDisclosure(false);
  const [paiementDetteModalOpened, { open: openPaiementDetteModal, close: closePaiementDetteModal }] = useDisclosure(false);
  const [currentDette, setCurrentDette] = useState<Partial<DetteFournisseur>>({
    date: new Date(),
    montant: 0,
    fournisseur: id || "",
  });
  const [isEditingDette, setIsEditingDette] = useState(false);
  const [selectedDette, setSelectedDette] = useState<any>(null);
  const [paiementsDette, setPaiementsDette] = useState<any[]>([]);
  const [currentPaiementDette, setCurrentPaiementDette] = useState<any>({
    date: new Date().toISOString(),
    dette: "",
    montant: 0,
  });
  const [isEditingPaiementDette, setIsEditingPaiementDette] = useState(false);

  const fournisseurService = new FournisseurService();
  const achatService = new AchatService();
  const paiementFournisseurService = new PaiementFournisseurService();
  const detteFournisseurService = new DetteFournisseurService();
  const paiementDetteFournisseurService = new PaiementDetteFournisseurService();

  // Récupérer les informations du client
  const { data: fournisseur, isLoading: isLoadingFournisseur } = useQuery({
    queryKey: ['get_fournisseur', id],
    queryFn: () => fournisseurService.getOne(id!)
  });

  // Récupérer toutes les achats du client
  const { data: achats, isLoading: isLoadingachats } = useQuery({
    queryKey: ['get_achats_client', id],
    queryFn: () => achatService.byFournisseur(id!)
  });

  // Récupérer toutes les dettes du fournisseur
  const { data: dettes, isLoading: isLoadingDettes } = useQuery({
    queryKey: ['get_dettes_fournisseur', id],
    queryFn: () => detteFournisseurService.findByFournisseur(id!)
  });

  // Filtrer les achats en fonction de la recherche
  const filtered = (achats = []) => {
    return achats?.filter((achat: any) => {
      if (
        debouncedQuery !== '' &&
        !`${achat.ref}${achat.net_a_payer}${format(new Date(achat.date), 'dd/MM/yyyy')}`.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
      )
        return false;
      return true;
    });
  };

  // Mettre à jour les enregistrements affichés lors du changement de page ou de recherche
  useEffect(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setRecords(filtered(achats)?.slice(from, to) ?? []);
  }, [achats, debouncedQuery, page]);

  // Filtrer les dettes en fonction de la recherche
  const filteredDettes = (dettesList: any[] = []) => {
    return dettesList?.filter((dette: any) => {
      if (
        debouncedDetteQuery !== '' &&
        !`${dette.montant}${format(new Date(dette.date), 'dd/MM/yyyy')}`.toLowerCase().includes(debouncedDetteQuery.trim().toLowerCase())
      )
        return false;
      return true;
    });
  };

  // Mettre à jour les enregistrements des dettes
  useEffect(() => {
    const from = (dettePage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setDetteRecords(filteredDettes(dettes)?.slice(from, to) ?? []);
  }, [dettes, debouncedDetteQuery, dettePage]);

  // Fonction pour ouvrir le modal de paiements
  const addPaiement = async (achat: any) => {
    setSelectedAchat(achat);
    
    try {
      // Récupérer les paiements existants pour cette achat
      const paiementsData = await paiementFournisseurService.byAchat(achat._id);
      setPaiements(paiementsData);
      
      // Calculer le montant restant à payer
      const totalPaiements = paiementsData.reduce((acc: number, p: any) => acc + p.montant, 0);
      const restantAPayer = achat.net_a_payer - totalPaiements;
      
      // Initialiser le nouveau paiement
      setCurrentPaiement({
        date: new Date().toISOString(),
        achat: achat._id,
        montant: restantAPayer > 0 ? restantAPayer : 0,
        fournisseur: id
      });
      
      setIsEditing(false);
      open();
    } catch (error) {
      console.error("Erreur lors de la récupération des paiements:", error);
      toast.error("Une erreur est survenue lors de la récupération des paiements");
    }
  };

  // Sauvegarder un paiement (création ou mise à jour)
  const handleSavePaiement = async () => {
    try {
      if (isEditing && currentPaiement._id) {
        const {montant, date} = currentPaiement;
        await paiementFournisseurService.update(currentPaiement._id, {montant, date});
        toast.success("Paiement mis à jour avec succès");
      } else {
        await paiementFournisseurService.create(currentPaiement);
        toast.success("Paiement ajouté avec succès");
      }
      
      // Rafraîchir les données
      const updatedPaiements = await paiementFournisseurService.byAchat(selectedAchat._id);
      setPaiements(updatedPaiements);
      
      // Réinitialiser le formulaire
      setCurrentPaiement({
        date: new Date().toISOString(),
        achat: selectedAchat._id,
        montant: 0,
        fournisseur: id
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du paiement:", error);
      toast.error("Une erreur est survenue lors de la sauvegarde du paiement");
    }
  };

  // Éditer un paiement existant
  const handleEditPaiement = (paiement: any) => {
    setCurrentPaiement(paiement);
    setIsEditing(true);
  };

  // Supprimer un paiement
  const handleDeletePaiement = async (paiementId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
      try {
        await paiementFournisseurService.delete(paiementId);
        toast.success("Paiement supprimé avec succès");
        
        // Rafraîchir les données
        const updatedPaiements = await paiementFournisseurService.byAchat(selectedAchat._id);
        setPaiements(updatedPaiements);
      } catch (error) {
        console.error("Erreur lors de la suppression du paiement:", error);
        toast.error("Une erreur est survenue lors de la suppression du paiement");
      }
    }
  };

  // Calculer le montant restant à payer
  const calculateRestantAPayer = () => {
    if (!selectedAchat) return 0;
    
    const totalPaiements = paiements.reduce((acc, paiement) => acc + paiement.montant, 0);
    return selectedAchat.net_a_payer - totalPaiements;
  };

  // ========== GESTION DES DETTES FOURNISSEUR ==========

  // Ouvrir le modal pour ajouter une nouvelle dette
  const openAddDetteModal = () => {
    setCurrentDette({
      date: new Date(),
      montant: 0,
      fournisseur: id!,
    });
    setIsEditingDette(false);
    openDetteModal();
  };

  // Ouvrir le modal pour éditer une dette existante
  const openEditDetteModal = (dette: any) => {
    setCurrentDette({
      _id: dette._id,
      date: new Date(dette.date),
      montant: dette.montant,
      fournisseur: dette.fournisseur,
    });
    setIsEditingDette(true);
    openDetteModal();
  };

  // Sauvegarder une dette (création ou mise à jour)
  const handleSaveDette = async () => {
    try {
      if (!currentDette.montant || currentDette.montant <= 0) {
        toast.error("Veuillez saisir un montant valide");
        return;
      }

      if (isEditingDette && currentDette._id) {
        await detteFournisseurService.update(currentDette._id, {
          montant: currentDette.montant,
          date: currentDette.date,
        });
        toast.success("Dette mise à jour avec succès");
      } else {
        await detteFournisseurService.create(currentDette as DetteFournisseur);
        toast.success("Dette ajoutée avec succès");
      }

      closeDetteModal();
      queryClient.invalidateQueries({ queryKey: ['get_dettes_fournisseur', id] });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de la dette:", error);
      toast.error("Une erreur est survenue lors de la sauvegarde de la dette");
    }
  };

  // Supprimer une dette
  const handleDeleteDette = async (detteId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette dette ?")) {
      try {
        await detteFournisseurService.delete(detteId);
        toast.success("Dette supprimée avec succès");
        queryClient.invalidateQueries({ queryKey: ['get_dettes_fournisseur', id] });
      } catch (error) {
        console.error("Erreur lors de la suppression de la dette:", error);
        toast.error("Une erreur est survenue lors de la suppression de la dette");
      }
    }
  };

  // Ouvrir le modal des paiements pour une dette
  const openPaiementsDette = async (dette: any) => {
    setSelectedDette(dette);
    try {
      const paiementsData = await paiementDetteFournisseurService.byDette(dette._id);
      setPaiementsDette(paiementsData);
      
      const totalPaiements = paiementsData.reduce((acc: number, p: any) => acc + p.montant, 0);
      const restantAPayer = dette.montant - totalPaiements;
      
      setCurrentPaiementDette({
        date: new Date().toISOString(),
        dette: dette._id,
        montant: restantAPayer > 0 ? restantAPayer : 0,
      });
      
      setIsEditingPaiementDette(false);
      openPaiementDetteModal();
    } catch (error) {
      console.error("Erreur lors de la récupération des paiements:", error);
      toast.error("Une erreur est survenue lors de la récupération des paiements");
    }
  };

  // Calculer le montant restant à payer pour une dette
  const calculateRestantAPayerDette = () => {
    if (!selectedDette) return 0;
    const totalPaiements = paiementsDette.reduce((acc, paiement) => acc + paiement.montant, 0);
    return selectedDette.montant - totalPaiements;
  };

  // Sauvegarder un paiement de dette
  const handleSavePaiementDette = async () => {
    try {
      if (isEditingPaiementDette && currentPaiementDette._id) {
        const { montant, date } = currentPaiementDette;
        await paiementDetteFournisseurService.update(currentPaiementDette._id, { montant, date });
        toast.success("Paiement mis à jour avec succès");
      } else {
        await paiementDetteFournisseurService.create(currentPaiementDette);
        toast.success("Paiement ajouté avec succès");
      }
      
      const updatedPaiements = await paiementDetteFournisseurService.byDette(selectedDette._id);
      setPaiementsDette(updatedPaiements);
      queryClient.invalidateQueries({ queryKey: ['get_dettes_fournisseur', id] });
      
      setCurrentPaiementDette({
        date: new Date().toISOString(),
        dette: selectedDette._id,
        montant: 0,
      });
      setIsEditingPaiementDette(false);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde du paiement:", error);
      toast.error("Une erreur est survenue lors de la sauvegarde du paiement");
    }
  };

  // Éditer un paiement de dette existant
  const handleEditPaiementDette = (paiement: any) => {
    setCurrentPaiementDette(paiement);
    setIsEditingPaiementDette(true);
  };

  // Supprimer un paiement de dette
  const handleDeletePaiementDette = async (paiementId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
      try {
        await paiementDetteFournisseurService.delete(paiementId);
        toast.success("Paiement supprimé avec succès");
        
        const updatedPaiements = await paiementDetteFournisseurService.byDette(selectedDette._id);
        setPaiementsDette(updatedPaiements);
        queryClient.invalidateQueries({ queryKey: ['get_dettes_fournisseur', id] });
      } catch (error) {
        console.error("Erreur lors de la suppression du paiement:", error);
        toast.error("Une erreur est survenue lors de la suppression du paiement");
      }
    }
  };

  return (
    <div className="min-h-screen">
      <LoadingOverlay
        visible={isLoadingFournisseur}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: '#8A2BE2', type: 'dots' }}
      />
      <div className="mb-6 flex items-center">
        <Button 
          variant="subtle" 
          leftSection={<FaArrowLeft />} 
          onClick={() => navigate('/dashboard/fournisseurs')}
          className="text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
        >
          Retour à la liste
        </Button>
      </div>

      <WeeklyRevenue add={''}>
        <>
          {/* Informations du client */}
          <Paper 
            p="xl" 
            radius="md" 
            className="bg-white dark:bg-gray-800 shadow-lg mb-6"
            style={{
              backgroundImage: "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8))",
              backdropFilter: "blur(10px)"
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Avatar 
                  size="xl" 
                  radius="xl" 
                  color="orange"
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md"
                >
                  {fournisseur?.nom?.charAt(0) || 'F'}
                </Avatar>
                <div>
                  <Title order={2} className="text-gray-800 dark:text-gray-200">{fournisseur?.nom}</Title>
                  <Badge size="lg" radius="md" className="bg-gradient-to-r from-orange-500 to-red-500 text-white mt-1">
                    Fournisseur
                  </Badge>
                </div>
              </div>
            </div>

            <Divider className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Card p="md" radius="md" className="bg-blue-50 dark:bg-gray-700 border border-blue-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <FaPhone className="text-blue-500" />
                  <Text fw={600} className="text-gray-700 dark:text-gray-200">Téléphone</Text>
                </div>
                <Text size="lg" className="text-gray-800 dark:text-gray-100 pl-7">{fournisseur?.tel || 'Non renseigné'}</Text>
              </Card>
              
              <Card p="md" radius="md" className="bg-green-50 dark:bg-gray-700 border border-green-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <FaEnvelope className="text-green-500" />
                  <Text fw={600} className="text-gray-700 dark:text-gray-200">Email</Text>
                </div>
                <Text size="lg" className="text-gray-800 dark:text-gray-100 pl-7">{fournisseur?.email || 'Non renseigné'}</Text>
              </Card>
              
              <Card p="md" radius="md" className="bg-purple-50 dark:bg-gray-700 border border-purple-100 dark:border-gray-600 shadow-sm md:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <FaMapMarkerAlt className="text-purple-500" />
                  <Text fw={600} className="text-gray-700 dark:text-gray-200">Adresse</Text>
                </div>
                <Text size="lg" className="text-gray-800 dark:text-gray-100 pl-7">{fournisseur?.addr || 'Non renseignée'}</Text>
              </Card>
            </div>
          </Paper>

          {/* Onglets Factures / Dettes */}
          <Tabs defaultValue="factures" className="mt-6">
            <Tabs.List className="mb-4">
              <Tabs.Tab value="factures" leftSection={<FaFileInvoiceDollar />}>
                Factures ({filtered(achats)?.length || 0})
              </Tabs.Tab>
              <Tabs.Tab value="dettes" leftSection={<FaMoneyBillWave />}>
                Dettes ({filteredDettes(dettes)?.length || 0})
              </Tabs.Tab>
            </Tabs.List>

            {/* Onglet Factures */}
            <Tabs.Panel value="factures">
              {/* Titre de la section factures */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Title order={3} className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <FaFileInvoiceDollar className="text-orange-500" /> 
                    Factures du fournisseur
                  </Title>
                  <Text className="text-gray-600 dark:text-gray-400">Historique des factures et paiements</Text>
                </div>
                <Badge size="lg" radius="md" className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2">
                  {filtered(achats)?.length || 0} factures
                </Badge>
              </div>

              {/* Barre de recherche */}
              <Paper 
                p="md" 
                radius="md" 
                className="bg-white dark:bg-gray-800 shadow-md mb-6"
              >
                <div className="flex justify-between items-center w-full md:w-1/2 my-2">
                  <div className="w-full relative">
                    <TextInput
                      value={query} 
                      onChange={(e) => setQuery(e.currentTarget.value)} 
                      placeholder="Rechercher une facture par référence, montant ou date..." 
                      leftSection={<FaSearch className="text-gray-500" />}
                      radius="md"
                      className="shadow-sm"
                      styles={() => ({
                        input: {
                          '&:focus-within': {
                            borderColor: '#8A2BE2',
                          },
                        },
                      })}
                    />
                  </div>
                </div>
              </Paper>

              {/* Table des factures */}
              <DataTable
            withTableBorder={true}
            columns={[
              { 
                accessor: 'ref', 
                title: (
                  <Group>
                    <FaFileInvoiceDollar className="text-orange-500" />
                    <Text fw={600}>Référence</Text>
                  </Group>
                ),
                textAlign: 'center',
                render: (row) => (
                  <Badge color="blue" variant="light" radius="sm" size="lg">
                    {row.ref}
                  </Badge>
                )
              },
              { 
                accessor: 'date', 
                title: (
                  <Group>
                    <FaCalendarAlt className="text-green-500" />
                    <Text fw={600}>Date</Text>
                  </Group>
                ),
                textAlign: 'center',
                render: (row) => (
                  <Text className="text-gray-700 dark:text-gray-300">
                    {format(new Date(row.date), 'dd MMMM yyyy', { locale: fr })}
                  </Text>
                )
              },
              { 
                accessor: 'montant', 
                title: (
                  <Group>
                    <FaMoneyBillWave className="text-indigo-500" />
                    <Text fw={600}>Montant Total</Text>
                  </Group>
                ),
                textAlign: 'center',
                render: (row) => (
                  <Text fw={500} className="text-gray-800 dark:text-gray-200">
                    {formatN(row.montant)} FCFA
                  </Text>
                )
              },
              { 
                accessor: 'remise', 
                title: (
                  <Group>
                    <FaPercentage className="text-red-500" />
                    <Text fw={600}>Remise</Text>
                  </Group>
                ),
                textAlign: 'center',
                render: (row) => (
                  <Text className="text-gray-700 dark:text-gray-300">
                    {formatN(row.remise || 0)} FCFA
                  </Text>
                )
              },
              { 
                accessor: 'net_a_payer', 
                title: (
                  <Group>
                    <FaMoneyBillWave className="text-green-500" />
                    <Text fw={600}>Net à Payer</Text>
                  </Group>
                ),
                textAlign: 'center',
                render: (row) => (
                  <Text fw={600} className="text-green-600 dark:text-green-400">
                    {formatN(row.net_a_payer)} FCFA
                  </Text>
                )
              },
              {
                accessor: 'actions',
                title: (
                  <Box mr={6}>
                    <Text fw={600} className="text-gray-700 dark:text-gray-300">Actions</Text>
                  </Box>
                ),
                textAlign: 'center',
                render: (row: any) => (
                  <Group>
                    <Tooltip label="Voir les paiements">
                      <Button
                        size="compact-sm"
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md"
                        onClick={() => addPaiement(row)}
                        leftSection={<FaEye />}
                        radius="md"
                      >
                        Paiements
                      </Button>
                    </Tooltip>
                  </Group>
                ),
              },
            ]}
            records={records}
            idAccessor="_id"
            striped={true}
            stripedColor="rgba(255, 93, 20, 0.1)"
            fetching={isLoadingachats}
            emptyState={
              <div className="flex flex-col items-center justify-center py-10">
                <img src="/img/empty.png" alt="Aucune facture" className="w-32 h-32 mb-4" />
                <Text size="lg" fw={500} className="text-gray-600 dark:text-gray-400">
                  Aucune facture trouvée
                </Text>
                <Text size="sm" className="text-gray-500 dark:text-gray-500 mb-4">
                  Ce client n'a pas encore de factures
                </Text>
              </div>
            }
            totalRecords={filtered(achats)?.length}
            recordsPerPage={PAGE_SIZE}
            page={page}
            onPageChange={(p) => setPage(p)}
            highlightOnHover
            borderRadius="lg"
            shadow="xl"
            horizontalSpacing="md"
            verticalSpacing="md"
            verticalAlign="center"
            className="overflow-hidden"
                paginationActiveBackgroundColor="#8A2BE2"
                rowClassName={() => 'hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors duration-200'}
              />
            </Tabs.Panel>

            {/* Onglet Dettes */}
            <Tabs.Panel value="dettes">
              {/* Titre de la section dettes */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Title order={3} className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <FaMoneyBillWave className="text-red-500" /> 
                    Dettes du fournisseur
                  </Title>
                  <Text className="text-gray-600 dark:text-gray-400">Historique des dettes et paiements</Text>
                </div>
                <div className="flex items-center gap-3">
                  <Badge size="lg" radius="md" className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2">
                    Total: {formatN(filteredDettes(dettes)?.reduce((total: number, dette: any) => total + dette.montant, 0) || 0)} FCFA
                  </Badge>
                  <Badge size="lg" radius="md" className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2">
                    Payé: {formatN(filteredDettes(dettes)?.reduce((total: number, dette: any) => total + (dette.totalPaiements || 0), 0) || 0)} FCFA
                  </Badge>
                  <Badge size="lg" radius="md" className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2">
                    Restant: {formatN(filteredDettes(dettes)?.reduce((total: number, dette: any) => total + (dette.resteAPayer || 0), 0) || 0)} FCFA
                  </Badge>
                  <Button
                    onClick={openAddDetteModal}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md"
                    leftSection={<FaPlus />}
                    radius="md"
                  >
                    Nouvelle dette
                  </Button>
                </div>
              </div>

              {/* Barre de recherche dettes */}
              <Paper 
                p="md" 
                radius="md" 
                className="bg-white dark:bg-gray-800 shadow-md mb-6"
              >
                <div className="flex justify-between items-center w-full md:w-1/2 my-2">
                  <div className="w-full relative">
                    <TextInput
                      value={detteQuery} 
                      onChange={(e) => setDetteQuery(e.currentTarget.value)} 
                      placeholder="Rechercher une dette par montant ou date..." 
                      leftSection={<FaSearch className="text-gray-500" />}
                      radius="md"
                      className="shadow-sm"
                      styles={() => ({
                        input: {
                          '&:focus-within': {
                            borderColor: '#8A2BE2',
                          },
                        },
                      })}
                    />
                  </div>
                </div>
              </Paper>

              {/* Table des dettes */}
              <DataTable
                withTableBorder={true}
                columns={[
                  { 
                    accessor: 'date', 
                    title: (
                      <Group>
                        <FaCalendarAlt className="text-green-500" />
                        <Text fw={600}>Date</Text>
                      </Group>
                    ),
                    textAlign: 'center',
                    render: (row) => (
                      <Text className="text-gray-700 dark:text-gray-300">
                        {format(new Date(row.date), 'dd MMMM yyyy', { locale: fr })}
                      </Text>
                    )
                  },
                  { 
                    accessor: 'montant', 
                    title: (
                      <Group>
                        <FaMoneyBillWave className="text-red-500" />
                        <Text fw={600}>Montant Total</Text>
                      </Group>
                    ),
                    textAlign: 'center',
                    render: (row) => (
                      <Text fw={500} className="text-gray-800 dark:text-gray-200">
                        {formatN(row.montant)} FCFA
                      </Text>
                    )
                  },
                  { 
                    accessor: 'paye',
                    title: (
                      <Group>
                        <FaMoneyBillWave className="text-green-500" />
                        <Text fw={600}>Payé</Text>
                      </Group>
                    ),
                    textAlign: 'center',
                    render: (row: any) => (
                      <Badge 
                        size="lg" 
                        radius="md" 
                        color="green"
                        variant="light"
                      >
                        {formatN(row.totalPaiements || 0)} FCFA
                      </Badge>
                    )
                  },
                  { 
                    accessor: 'restant',
                    title: (
                      <Group>
                        <FaMoneyBillWave className="text-amber-500" />
                        <Text fw={600}>Restant</Text>
                      </Group>
                    ),
                    textAlign: 'center',
                    render: (row: any) => (
                      <Badge 
                        size="lg" 
                        radius="md" 
                        color={(row.resteAPayer || 0) > 0 ? "red" : "green"}
                        variant="light"
                      >
                        {formatN(row.resteAPayer || 0)} FCFA
                      </Badge>
                    )
                  },
                  {
                    accessor: 'actions',
                    title: (
                      <Box mr={6}>
                        <Text fw={600} className="text-gray-700 dark:text-gray-300">Actions</Text>
                      </Box>
                    ),
                    textAlign: 'center',
                    render: (row: any) => (
                      <Group>
                        <Tooltip label="Voir les paiements">
                          <Button
                            size="compact-sm"
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md"
                            onClick={() => openPaiementsDette(row)}
                            leftSection={<FaEye />}
                            radius="md"
                          >
                            Paiements
                          </Button>
                        </Tooltip>
                        <Tooltip label="Modifier">
                          <ActionIcon
                            onClick={() => openEditDetteModal(row)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-white shadow-sm"
                            radius="md"
                            size="md"
                          >
                            <FaEdit />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Supprimer">
                          <ActionIcon
                            onClick={() => handleDeleteDette(row._id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 text-white shadow-sm"
                            radius="md"
                            size="md"
                          >
                            <FaTrash />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    ),
                  },
                ]}
                records={detteRecords}
                idAccessor="_id"
                striped={true}
                stripedColor="rgba(255, 93, 20, 0.1)"
                fetching={isLoadingDettes}
                emptyState={
                  <div className="flex flex-col items-center justify-center py-10">
                    <img src="/img/empty.png" alt="Aucune dette" className="w-32 h-32 mb-4" />
                    <Text size="lg" fw={500} className="text-gray-600 dark:text-gray-400">
                      Aucune dette trouvée
                    </Text>
                    <Text size="sm" className="text-gray-500 dark:text-gray-500 mb-4">
                      Ce fournisseur n'a pas encore de dettes
                    </Text>
                  </div>
                }
                totalRecords={filteredDettes(dettes)?.length}
                recordsPerPage={PAGE_SIZE}
                page={dettePage}
                onPageChange={(p) => setDettePage(p)}
                highlightOnHover
                borderRadius="lg"
                shadow="xl"
                horizontalSpacing="md"
                verticalSpacing="md"
                verticalAlign="center"
                className="overflow-hidden"
                paginationActiveBackgroundColor="#8A2BE2"
                rowClassName={() => 'hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors duration-200'}
              />
            </Tabs.Panel>
          </Tabs>

          {/* Modal pour gérer les paiements des factures */}
          <Modal
            opened={opened}
            onClose={close}
            title={
              <Title order={3} className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <FaMoneyBillWave className="text-orange-500" /> 
                Gestion des paiements
              </Title>
            }
            className="w-full"
            size="lg"
            centered
            padding="xl"
            classNames={{
              header: 'border-b border-gray-200 dark:border-gray-700 pb-3',
              body: 'pt-6'
            }}
          >
            {selectedAchat && (
              <div className="space-y-6">
                {/* Informations de la achat */}
                <Paper p="md" radius="md" className="bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <FaFileInvoiceDollar className="text-blue-500" />
                    <Text fw={600} className="text-gray-700 dark:text-gray-200">Détails de la facture</Text>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card p="sm" radius="md" className="bg-white dark:bg-gray-700 shadow-sm">
                      <Text size="sm" c="dimmed" className="mb-1">Référence</Text>
                      <Badge color="blue" size="lg" radius="sm" className="w-full flex justify-center">
                        {selectedAchat.ref}
                      </Badge>
                    </Card>
                    
                    <Card p="sm" radius="md" className="bg-white dark:bg-gray-700 shadow-sm">
                      <Text size="sm" c="dimmed" className="mb-1">Date</Text>
                      <Text fw={500} className="flex items-center gap-2">
                        <FaCalendarAlt className="text-green-500" />
                        {format(new Date(selectedAchat.date), 'dd MMMM yyyy', { locale: fr })}
                      </Text>
                    </Card>
                    
                    <Card p="sm" radius="md" className="bg-white dark:bg-gray-700 shadow-sm">
                      <Text size="sm" c="dimmed" className="mb-1">Montant Total</Text>
                      <Text fw={500} className="text-gray-800 dark:text-gray-200">
                        {formatN(selectedAchat.montant)} FCFA
                      </Text>
                    </Card>
                    
                    <Card p="sm" radius="md" className="bg-white dark:bg-gray-700 shadow-sm">
                      <Text size="sm" c="dimmed" className="mb-1">Net à Payer</Text>
                      <Text fw={500} className="text-gray-800 dark:text-gray-200">
                        {formatN(selectedAchat.net_a_payer)} FCFA
                      </Text>
                    </Card>
                    
                    <Card p="sm" radius="md" className="bg-white dark:bg-gray-700 shadow-sm md:col-span-2">
                      <Text size="sm" c="dimmed" className="mb-1">Reste à Payer</Text>
                      <Text 
                        fw={700} 
                        size="lg" 
                        className={calculateRestantAPayer() > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
                      >
                        {formatN(calculateRestantAPayer())} FCFA
                      </Text>
                    </Card>
                  </div>
                </Paper>

                {/* Liste des paiements */}
                <Paper p="md" radius="md" className="bg-white dark:bg-gray-800 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <FaMoneyBillWave className="text-green-500" />
                    <Text fw={600} className="text-gray-700 dark:text-gray-200">Historique des paiements</Text>
                  </div>
                  
                  {paiements.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-orange-500" />
                                Date
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <FaMoneyBillWave className="text-green-500" />
                                Montant
                              </div>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                          {paiements.map((paiement) => (
                            <tr key={paiement._id} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                {format(new Date(paiement.date), 'dd MMMM yyyy', { locale: fr })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                <Badge color="green" variant="light" size="lg">
                                  {formatN(paiement.montant)} FCFA
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Group>
                                  <Tooltip label="Modifier">
                                    <ActionIcon 
                                      onClick={() => handleEditPaiement(paiement)}
                                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-white shadow-sm"
                                      radius="md"
                                      size="md"
                                    >
                                      <FaEdit />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Supprimer">
                                    <ActionIcon 
                                      onClick={() => handleDeletePaiement(paiement._id)}
                                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 text-white shadow-sm"
                                      radius="md"
                                      size="md"
                                    >
                                      <FaTrash />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                      <Text c="dimmed" className="italic">Aucun paiement enregistré pour cette facture</Text>
                    </div>
                  )}
                </Paper>

                {/* Formulaire d'ajout/édition de paiement */}
                <Paper p="md" radius="md" className="bg-white dark:bg-gray-800 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <FaPlus className="text-orange-500" />
                    <Text fw={600} className="text-gray-700 dark:text-gray-200">
                      {isEditing ? "Modifier le paiement" : "Ajouter un paiement"}
                    </Text>
                  </div>
                  
                  <div className="space-y-4">
                    <DatePickerInput
                      label="Date du paiement"
                      placeholder="Sélectionner une date"
                      value={currentPaiement.date ? new Date(currentPaiement.date) : null}
                      onChange={(date) => setCurrentPaiement({
                        ...currentPaiement,
                        date: date ? date.toISOString() : new Date().toISOString()
                      })}
                      required
                      locale="fr"
                      leftSection={<FaCalendarAlt className="text-gray-500" />}
                      styles={() => ({
                        input: {
                          '&:focus': {
                            borderColor: '#8A2BE2',
                          },
                        },
                      })}
                    />
                    
                    <NumberInput
                      label="Montant du paiement"
                      placeholder="Entrez le montant"
                      value={currentPaiement.montant}
                      onChange={(value) => setCurrentPaiement({
                        ...currentPaiement,
                        montant: value as number
                      })}
                      required
                      min={0}
                      max={isEditing ? undefined : calculateRestantAPayer()}
                      error={currentPaiement.montant > calculateRestantAPayer() && !isEditing ? "Le montant ne peut pas dépasser le reste à payer" : ""}
                      leftSection={<FaMoneyBillWave className="text-gray-500" />}
                      styles={() => ({
                        input: {
                          '&:focus': {
                            borderColor: '#8A2BE2',
                          },
                        },
                      })}
                    />
                    
                    <Group mt="xl">
                      {isEditing && (
                        <Button 
                          variant="subtle" 
                          color="gray"
                          leftSection={<FaTimes />}
                          onClick={() => {
                            setIsEditing(false);
                            setCurrentPaiement({
                              date: new Date().toISOString(),
                              achat: selectedAchat._id,
                              montant: calculateRestantAPayer(),
                              fournisseur: id
                            });
                          }}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                        >
                          Annuler
                        </Button>
                      )}
                      <Button 
                        onClick={handleSavePaiement} 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md"
                        leftSection={isEditing ? <FaEdit /> : <FaPlus />}
                      >
                        {isEditing ? "Mettre à jour" : "Ajouter le paiement"}
                      </Button>
                    </Group>
                  </div>
                </Paper>
              </div>
            )}
          </Modal>

          {/* Modal pour ajouter/modifier une dette */}
          <Modal
            opened={detteModalOpened}
            onClose={closeDetteModal}
            title={
              <Title order={3} className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <FaFileInvoiceDollar className="text-orange-500" /> 
                {isEditingDette ? "Modifier la dette" : "Ajouter une dette"}
              </Title>
            }
            className="w-full"
            size="md"
            centered
            padding="xl"
            classNames={{
              header: 'border-b border-gray-200 dark:border-gray-700 pb-3',
              body: 'pt-6'
            }}
          >
            <div className="space-y-4">
              <DatePickerInput
                label="Date de la dette"
                placeholder="Sélectionner une date"
                value={currentDette.date ? new Date(currentDette.date) : null}
                onChange={(date) => setCurrentDette({
                  ...currentDette,
                  date: date!
                })}
                required
                locale="fr"
                leftSection={<FaCalendarAlt className="text-gray-500" />}
                styles={() => ({
                  input: {
                    '&:focus': {
                      borderColor: '#8A2BE2',
                    },
                  },
                })}
              />
              
              <NumberInput
                label="Montant de la dette"
                placeholder="Entrez le montant"
                value={currentDette.montant as number}
                onChange={(value) => setCurrentDette({
                  ...currentDette,
                  montant: value as number
                })}
                required
                min={0}
                leftSection={<FaMoneyBillWave className="text-gray-500" />}
                styles={() => ({
                  input: {
                    '&:focus': {
                      borderColor: '#8A2BE2',
                    },
                  },
                })}
              />
        
              <Group mt="xl" justify="flex-end">
                <Button 
                  variant="subtle" 
                  color="gray"
                  leftSection={<FaTimes />}
                  onClick={closeDetteModal}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleSaveDette} 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md"
                  leftSection={isEditingDette ? <FaSave /> : <FaPlus />}
                >
                  {isEditingDette ? "Mettre à jour" : "Ajouter la dette"}
                </Button>
              </Group>
            </div>
          </Modal>

          {/* Modal pour gérer les paiements des dettes */}
          <Modal
            opened={paiementDetteModalOpened}
            onClose={closePaiementDetteModal}
            title={
              <Title order={3} className="text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <FaMoneyBillWave className="text-orange-500" /> 
                Gestion des paiements de dette
              </Title>
            }
            className="w-full"
            size="lg"
            centered
            padding="xl"
            classNames={{
              header: 'border-b border-gray-200 dark:border-gray-700 pb-3',
              body: 'pt-6'
            }}
          >
            {selectedDette && (
              <div className="space-y-6">
                {/* Informations de la dette */}
                <Paper p="md" radius="md" className="bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <FaFileInvoiceDollar className="text-blue-500" />
                    <Text fw={600} className="text-gray-700 dark:text-gray-200">Détails de la dette</Text>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">        
                    <Card p="sm" radius="md" className="bg-white dark:bg-gray-700 shadow-sm">
                      <Text size="sm" c="dimmed" className="mb-1">Date</Text>
                      <Text fw={500} className="flex items-center gap-2">
                        <FaCalendarAlt className="text-green-500" />
                        {format(new Date(selectedDette.date), 'dd MMMM yyyy', { locale: fr })}
                      </Text>
                    </Card>
                    
                    <Card p="sm" radius="md" className="bg-white dark:bg-gray-700 shadow-sm">
                      <Text size="sm" c="dimmed" className="mb-1">Montant Total</Text>
                      <Text fw={500} className="text-gray-800 dark:text-gray-200">
                        {formatN(selectedDette.montant)} FCFA
                      </Text>
                    </Card>
                     
                    <Card p="sm" radius="md" className="bg-white dark:bg-gray-700 shadow-sm">
                      <Text size="sm" c="dimmed" className="mb-1">Reste à Payer</Text>
                      <Text 
                        fw={700} 
                        size="lg" 
                        className={calculateRestantAPayerDette() > 0 ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}
                      >
                        {formatN(calculateRestantAPayerDette())} FCFA
                      </Text>
                    </Card>
                  </div>
                </Paper>

                {/* Liste des paiements */}
                <Paper p="md" radius="md" className="bg-white dark:bg-gray-800 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <FaMoneyBillWave className="text-green-500" />
                    <Text fw={600} className="text-gray-700 dark:text-gray-200">Historique des paiements</Text>
                  </div>
                  
                  {paiementsDette.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-orange-500" />
                                Date
                              </div>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              <div className="flex items-center gap-2">
                                <FaMoneyBillWave className="text-green-500" />
                                Montant
                              </div>
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                          {paiementsDette.map((paiement) => (
                            <tr key={paiement._id} className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                {format(new Date(paiement.date), 'dd MMMM yyyy', { locale: fr })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                                <Badge color="green" variant="light" size="lg">
                                  {formatN(paiement.montant)} FCFA
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <Group>
                                  <Tooltip label="Modifier">
                                    <ActionIcon 
                                      onClick={() => handleEditPaiementDette(paiement)}
                                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-white shadow-sm"
                                      radius="md"
                                      size="md"
                                    >
                                      <FaEdit />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Supprimer">
                                    <ActionIcon 
                                      onClick={() => handleDeletePaiementDette(paiement._id)}
                                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 text-white shadow-sm"
                                      radius="md"
                                      size="md"
                                    >
                                      <FaTrash />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                      <Text c="dimmed" className="italic">Aucun paiement enregistré pour cette dette</Text>
                    </div>
                  )}
                </Paper>

                {/* Formulaire d'ajout/édition de paiement */}
                <Paper p="md" radius="md" className="bg-white dark:bg-gray-800 shadow-md">
                  <div className="flex items-center gap-2 mb-4">
                    <FaPlus className="text-orange-500" />
                    <Text fw={600} className="text-gray-700 dark:text-gray-200">
                      {isEditingPaiementDette ? "Modifier le paiement" : "Ajouter un paiement"}
                    </Text>
                  </div>
                  
                  <div className="space-y-4">
                    <DatePickerInput
                      label="Date du paiement"
                      placeholder="Sélectionner une date"
                      value={currentPaiementDette.date ? new Date(currentPaiementDette.date) : null}
                      onChange={(date) => setCurrentPaiementDette({
                        ...currentPaiementDette,
                        date: date ? date.toISOString() : new Date().toISOString()
                      })}
                      required
                      locale="fr"
                      leftSection={<FaCalendarAlt className="text-gray-500" />}
                      styles={() => ({
                        input: {
                          '&:focus': {
                            borderColor: '#8A2BE2',
                          },
                        },
                      })}
                    />
                    
                    <NumberInput
                      label="Montant du paiement"
                      placeholder="Entrez le montant"
                      value={currentPaiementDette.montant}
                      onChange={(value) => setCurrentPaiementDette({
                        ...currentPaiementDette,
                        montant: value as number
                      })}
                      required
                      min={0}
                      max={isEditingPaiementDette ? undefined : calculateRestantAPayerDette()}
                      error={currentPaiementDette.montant > calculateRestantAPayerDette() && !isEditingPaiementDette ? "Le montant ne peut pas dépasser le reste à payer" : ""}
                      leftSection={<FaMoneyBillWave className="text-gray-500" />}
                      styles={() => ({
                        input: {
                          '&:focus': {
                            borderColor: '#8A2BE2',
                          },
                        },
                      })}
                    />
                    
                    <Group mt="xl">
                      {isEditingPaiementDette && (
                        <Button 
                          variant="subtle" 
                          color="gray"
                          leftSection={<FaTimes />}
                          onClick={() => {
                            setIsEditingPaiementDette(false);
                            setCurrentPaiementDette({
                              date: new Date().toISOString(),
                              dette: selectedDette._id,
                              montant: calculateRestantAPayerDette(),
                            });
                          }}
                          className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                        >
                          Annuler
                        </Button>
                      )}
                      <Button 
                        onClick={handleSavePaiementDette} 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-md"
                        leftSection={isEditingPaiementDette ? <FaEdit /> : <FaPlus />}
                      >
                        {isEditingPaiementDette ? "Mettre à jour" : "Ajouter le paiement"}
                      </Button>
                    </Group>
                  </div>
                </Paper>
              </div>
            )}
          </Modal>
        </>
      </WeeklyRevenue>
    </div>
  );
}

export default Fournisseur;