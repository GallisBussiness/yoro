import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { 
  ActionIcon, 
  Badge, 
  Button, 
  Divider,
  Group, 
  LoadingOverlay, 
  Modal,
  NumberInput, 
  Paper,
  Table,
  Text, 
  TextInput, 
  Title,
  Tooltip,
  Kbd,
  ThemeIcon,
  Stack
} from "@mantine/core";
import { 
  FaPlus, 
  FaTrash, 
  FaRegCalendarAlt, 
  FaUser,
  FaArrowLeft,
  FaCheck,
  FaKeyboard,
  FaFileInvoice
} from "react-icons/fa";
import { useForm } from "@mantine/form";
import { toast } from 'sonner';
import { useDisclosure } from "@mantine/hooks";
import { Select } from "antd";
import { VenteService } from "../../services/vente.service";
import useScanDetection from 'use-scan-detection';
import { ArticleService } from "../../services/article.service";
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ClientService } from "../../services/client.service";
import { DateInput } from "@mantine/dates";
import { TbDiscount } from "react-icons/tb";
import { InventoryService } from "../../services/Inventory.service";
import { formatN } from "../../lib/helpers";
import { authclient } from '../../../lib/auth-client';
import { validate } from "uuid";

const schemaC = yup.object().shape({
  nom: yup.string().required('Invalide Nom'),
  tel: yup.string(),
  addr: yup.string(),
  userId: yup.string().required("user not valid!")
});

const schema = yup.object().shape({
  date: yup.date().required('Invalid Date'),
  produits: yup.array().required("Invalid Produits"),
  montant: yup.number().required(""),
  remise: yup.number().required(""),
  net_a_payer: yup.number().required(""),
  client: yup.string().required(""),
  userId: yup.string().required("user not valid!")
});

function NouvelleVente() {
  const { data: session } = authclient.useSession();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [bodyRef] = useAutoAnimate();
  
  // États
  const [remise, setRemise] = useState<number>(0);
  const [openedClientModal, { open: openClientModal, close: closeClientModal }] = useDisclosure(false);
  
  // Services
  const venteService = new VenteService();
  const articleService = new ArticleService();
  const clientService = new ClientService();
  const inventoryService = new InventoryService();

  // Queries
  const keyClient = ['get_clients', session!.user.id];
  const { data: clients, isLoading: isLoadingClient } = useQuery({
    queryKey: keyClient,
    queryFn: () => clientService.getByUser(session!.user.id),
    enabled: !!session
  });

  const keyI = ['get_inventory', session!.user.id];
  const { isLoading: isLoadingI } = useQuery({
    queryKey: keyI,
    queryFn: () => inventoryService.getByUser(session!.user.id),
    enabled: !!session
  });

  const keyar = ['article', session!.user.id];
  const { data: articles, isLoading: isLoadingA } = useQuery({
    queryKey: keyar,
    queryFn: () => articleService.getByUser(session!.user.id),
    enabled: !!session
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (qr: string) => articleService.byref(qr),
  });

  // Formulaires
  const formC = useForm({
    initialValues: {
      nom: '',
      tel: '',
      addr: '',
      user: session!.user.id
    },
    validate: yupResolver(schemaC),
  });

  const form = useForm<any>({
    mode: 'uncontrolled',
    initialValues: {
      _id: '',
      date: new Date(),
      produits: [],
      montant: 0,
      remise: 0,
      net_a_payer: 0,
      client: '',
      userId: session!.user.id
    },
    validate: yupResolver(schema),
  });

  // Mutations
  const key = ['vente', session!.user.id];
  const { mutate: createVente, isPending: loadingCreate } = useMutation({
    mutationFn: (data: any) => venteService.create(data),
    onSuccess: (data) => {
      toast.success(`Vente créée avec succès! #${data.ref}`, {
        icon: '✅',
        duration: 3000,
        position: 'top-center'
      });
      qc.invalidateQueries({ queryKey: key });
      navigate(`/dashboard/ventes/${data._id}`);
    }
  });

  const { mutate: createClient, isPending: loadingCreateClient } = useMutation({
    mutationFn: (data: any) => clientService.create(data),
    onSuccess: () => {
      closeClientModal();
      qc.invalidateQueries({ queryKey: keyClient });
      formC.reset();
      toast.success(`Client créé avec succès`, {
        icon: '👤',
        duration: 3000,
        position: 'top-center'
      });
    }
  });

  // Handlers
  const handleRemise = (value: string | number) => {
    setRemise(Number(value));
  }

  const onCreate = (values: any) => {
    // Filtrer les lignes vides (sans article sélectionné)
    const validProduits = values.produits.filter((p: any) => p.ref && p.nom);
    
    if (validProduits.length === 0) {
      toast.error('Aucun produit ajouté à la vente', {
        icon: '⚠️',
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    if (!values.client) {
      toast.error('Veuillez sélectionner un client', {
        icon: '⚠️',
        duration: 3000,
        position: 'top-center'
      });
      return;
    }

    const montant = validProduits.reduce((acc: number, cur: { pu: number; qte: number; }) => acc + (cur.pu * cur.qte), 0);
    const netAPayer = montant - Number(remise);

    const { _id, ...rest } = values;

    createVente({
      ...rest,
      produits: validProduits,
      montant,
      remise: +remise,
      net_a_payer: netAPayer
    });
  }

  const onCreateC = (values: any) => {
    createClient(values);
  }

  // Ajouter une nouvelle ligne vide
  const addEmptyLine = () => {
    form.insertListItem('produits', {
      ref: '',
      nom: '',
      pu: 0,
      qte: 1,
      unite: 'unité'
    });
  }

  // Sélectionner un article pour une ligne
  const selectArticleForLine = (index: number, articleId: string) => {
    if (!articleId) return;
    const article = articles?.find((a: any) => a._id === articleId);
    if (article) {
      // Vérifier si l'article existe déjà dans une autre ligne
      const existingIndex = form.getValues().produits.findIndex(
        (p: any, i: number) => p.ref === article.ref && i !== index
      );
      
      if (existingIndex !== -1) {
        // L'article existe déjà, augmenter sa quantité
        const currentQte = form.getValues().produits[existingIndex].qte;
        form.setFieldValue(`produits.${existingIndex}.qte`, currentQte + 1);
        // Supprimer la ligne actuelle (vide)
        form.removeListItem('produits', index);
        toast.success(`Quantité de ${article.nom} augmentée`, {
          icon: '⬆️',
          duration: 2000,
          position: 'bottom-right'
        });
      } else {
        // Nouvel article, remplir la ligne
        form.setFieldValue(`produits.${index}.ref`, article.ref);
        form.setFieldValue(`produits.${index}.nom`, article.nom);
        form.setFieldValue(`produits.${index}.pu`, article.prix);
        form.setFieldValue(`produits.${index}.unite`, article.unite?.nom || 'unité');
      }
    }
  }

  // Scanner de code-barres - ajoute ou augmente la quantité
  useScanDetection({
    onComplete: async (code) => {
      if (code === '') return;

      try {
        const c = code.replace(/Shift/gi, "");
        if (validate(c)) {
          const ar = await mutateAsync(c);

          if (!ar) {
            toast.error(`Code-barres non reconnu: ${c}`, {
              icon: '❌',
              duration: 3000
            });
            return;
          }

          // Vérifier si l'article existe déjà
          const existingIndex = form.getValues().produits.findIndex(
            (p: any) => p.ref === ar.ref
          );

          if (existingIndex !== -1) {
            // L'article existe déjà, augmenter sa quantité
            const currentQte = form.getValues().produits[existingIndex].qte;
            form.setFieldValue(`produits.${existingIndex}.qte`, currentQte + 1);
            toast.success(`Quantité de ${ar.nom} augmentée`, {
              icon: '⬆️',
              duration: 2000,
              position: 'bottom-right'
            });
          } else {
            // Ajouter une nouvelle ligne avec l'article scanné
            form.insertListItem('produits', {
              ref: ar.ref,
              nom: ar.nom,
              pu: ar.prix,
              qte: 1,
              unite: ar.unite?.nom || 'unité'
            });
            toast.success(`${ar.nom} ajouté`, {
              icon: '🛒',
              duration: 2000,
              position: 'bottom-right'
            });
          }
        }
      } catch (error) {
        toast.error('Erreur lors de la lecture du code-barres', {
          duration: 3000
        });
        console.error('Scanner error:', error);
      }
    },
  });

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Enter pour valider la vente
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        form.onSubmit(onCreate)();
      }
      // Escape pour retourner à la liste
      if (event.key === 'Escape') {
        navigate('/dashboard/ventes');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Calculer le total
  const calculateTotal = () => {
    return form.getValues().produits.reduce((acc: number, cur: { pu: number; qte: number; }) => acc + (cur.pu * cur.qte), 0);
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen">
      <LoadingOverlay
        visible={loadingCreate || isPending || loadingCreateClient || isLoadingA || isLoadingI}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: '#8A2BE2', type: 'dots' }}
      />

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="subtle"
                color="gray"
                leftSection={<FaArrowLeft />}
                onClick={() => navigate('/dashboard/ventes')}
              >
                Retour
              </Button>
              <div>
                <Title order={3} className="text-slate-800 dark:text-white">
                  Nouvelle Vente
                </Title>
                <Text size="xs" className="text-slate-500">
                  {format(new Date(), 'dd MMMM yyyy à HH:mm')}
                </Text>
              </div>
            </div>

            <Group gap="xs">
              <Tooltip label="Raccourcis clavier">
                <ThemeIcon variant="light" color="gray" size="lg">
                  <FaKeyboard size={16} />
                </ThemeIcon>
              </Tooltip>
              <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> Valider
                <span className="mx-2">|</span>
                <Kbd>Esc</Kbd> Retour
              </div>
            </Group>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <form onSubmit={form.onSubmit(onCreate)}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Colonne gauche - Informations client et date */}
            <div className="space-y-4">
              {/* Informations client */}
              <Paper shadow="sm" p="md" radius="md" className="bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ThemeIcon size="md" radius="md" color="blue" variant="light">
                      <FaUser size={14} />
                    </ThemeIcon>
                    <Text fw={600} size="sm" className="text-slate-700 dark:text-slate-200">
                      Client
                    </Text>
                  </div>
                  <Button
                    variant="light"
                    color="orange"
                    size="xs"
                    leftSection={<FaPlus size={10} />}
                    onClick={openClientModal}
                  >
                    Nouveau
                  </Button>
                </div>

                <Select
                  placeholder="Sélectionner un client"
                  options={clients?.map((v: { tel: any; nom: any; addr: any; _id: string }) => ({
                    label: `${v.nom} ${v.tel ? `/ ${v.tel}` : ''} ${v.addr ? `/ ${v.addr}` : ''}`,
                    value: v._id
                  }))}
                  {...form.getInputProps('client')}
                  loading={isLoadingClient}
                  showSearch
                  optionFilterProp="label"
                  filterSort={(optionA, optionB) =>
                    `${optionA.label}`.toLowerCase().localeCompare(`${optionB.label}`.toLowerCase())}
                  className="w-full"
                  size="large"
                />
              </Paper>

              {/* Date */}
              <Paper shadow="sm" p="md" radius="md" className="bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <ThemeIcon size="md" radius="md" color="green" variant="light">
                    <FaRegCalendarAlt size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm" className="text-slate-700 dark:text-slate-200">
                    Date de la vente
                  </Text>
                </div>
                <DateInput
                  placeholder="Sélectionner une date"
                  {...form.getInputProps('date')}
                  size="md"
                />
              </Paper>

              {/* Remise */}
              <Paper shadow="sm" p="md" radius="md" className="bg-white dark:bg-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <ThemeIcon size="md" radius="md" color="purple" variant="light">
                    <TbDiscount size={14} />
                  </ThemeIcon>
                  <Text fw={600} size="sm" className="text-slate-700 dark:text-slate-200">
                    Remise
                  </Text>
                </div>
                <NumberInput
                  placeholder="Montant de la remise"
                  value={remise}
                  onChange={handleRemise}
                  min={0}
                  size="md"
                  rightSection={<Text size="xs" className="text-slate-400 pr-2">FCFA</Text>}
                  rightSectionWidth={50}
                />
              </Paper>

              {/* Récapitulatif */}
              <Paper shadow="sm" p="md" radius="md" className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <Text fw={600} size="sm" mb="md" className="opacity-90">
                  RÉCAPITULATIF
                </Text>

                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm" className="opacity-80">Sous-total</Text>
                    <Text fw={600}>{formatN(calculateTotal())} FCFA</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm" className="opacity-80">Remise</Text>
                    <Text fw={600}>- {formatN(remise)} FCFA</Text>
                  </Group>
                  <Divider color="white" opacity={0.3} />
                  <Group justify="space-between">
                    <Text size="lg" fw={700}>NET À PAYER</Text>
                    <Text size="xl" fw={700}>
                      {formatN(calculateTotal() - remise)} FCFA
                    </Text>
                  </Group>
                </Stack>

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  mt="lg"
                  color="white"
                  variant="white"
                  loading={loadingCreate}
                  leftSection={<FaCheck />}
                  className="text-orange-600 font-bold hover:bg-orange-50"
                >
                  Valider la vente
                </Button>
              </Paper>
            </div>

            {/* Colonne droite - Lignes de facture */}
            <div className="lg:col-span-3">
              <Paper shadow="sm" p="md" radius="md" className="bg-white dark:bg-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <ThemeIcon size="lg" radius="md" color="orange" variant="light">
                      <FaFileInvoice size={18} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600} className="text-slate-700 dark:text-slate-200">
                        Lignes de la facture
                      </Text>
                      <Text size="xs" className="text-slate-500">
                        Ajoutez les produits ligne par ligne
                      </Text>
                    </div>
                  </div>
                  <Badge color="orange" size="lg">
                    {form.getValues().produits.length} ligne(s)
                  </Badge>
                </div>

                {/* Table des lignes de facture */}
                <div ref={bodyRef}>
                  <Table striped highlightOnHover withTableBorder withColumnBorders>
                    <Table.Thead className="bg-gradient-to-r from-orange-500 to-orange-600">
                      <Table.Tr>
                        <Table.Th className="text-white" style={{ width: '5%' }}>#</Table.Th>
                        <Table.Th className="text-white" style={{ width: '35%' }}>Article</Table.Th>
                        <Table.Th className="text-white" style={{ width: '15%' }}>Prix Unitaire</Table.Th>
                        <Table.Th className="text-white" style={{ width: '15%' }}>Quantité</Table.Th>
                        <Table.Th className="text-white" style={{ width: '20%' }}>Total</Table.Th>
                        <Table.Th className="text-white" style={{ width: '10%' }}>Action</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {form.getValues().produits.map((item: any, index: number) => (
                        <Table.Tr key={index}>
                          <Table.Td className="text-center font-medium text-slate-500">
                            {index + 1}
                          </Table.Td>
                          <Table.Td>
                            <Select
                              placeholder="Sélectionner un article"
                              options={articles?.map((a: any) => ({
                                label: `${a.nom} (${a.ref})`,
                                value: a._id
                              }))}
                              value={articles?.find((a: any) => a.ref === item.ref)?._id}
                              onChange={(val) => selectArticleForLine(index, val)}
                              showSearch
                              optionFilterProp="label"
                              filterSort={(optionA, optionB) =>
                                `${optionA.label}`.toLowerCase().localeCompare(`${optionB.label}`.toLowerCase())}
                              className="w-full"
                              size="middle"
                              loading={isLoadingA}
                            />
                          </Table.Td>
                          <Table.Td>
                            <NumberInput
                              value={item.pu}
                              onChange={(val) => form.setFieldValue(`produits.${index}.pu`, val)}
                              min={0}
                              size="sm"
                              rightSection={<Text size="xs" className="text-slate-400 pr-1">F</Text>}
                              rightSectionWidth={20}
                              styles={{ input: { textAlign: 'right' } }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <NumberInput
                              value={item.qte}
                              onChange={(val) => form.setFieldValue(`produits.${index}.qte`, val)}
                              min={1}
                              size="sm"
                              styles={{ input: { textAlign: 'center', fontWeight: 600 } }}
                            />
                          </Table.Td>
                          <Table.Td>
                            <Text fw={700} className="text-orange-600 dark:text-orange-400 text-right">
                              {formatN(item.pu * item.qte)} FCFA
                            </Text>
                          </Table.Td>
                          <Table.Td className="text-center">
                            <ActionIcon
                              size="sm"
                              variant="light"
                              color="red"
                              onClick={() => {
                                form.removeListItem('produits', index);
                                toast.success(`Ligne supprimée`, {
                                  icon: '🗑️',
                                  duration: 2000,
                                  position: 'bottom-right'
                                });
                              }}
                            >
                              <FaTrash size={12} />
                            </ActionIcon>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                      
                      {/* Ligne vide si aucun produit */}
                      {form.getValues().produits.length === 0 && (
                        <Table.Tr>
                          <Table.Td colSpan={6} className="text-center py-8">
                            <Text className="text-slate-400">
                              Aucune ligne. Cliquez sur le bouton ci-dessous pour ajouter une ligne.
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                    </Table.Tbody>
                  </Table>

                  {/* Bouton ajouter une ligne */}
                  <Button
                    variant="light"
                    color="orange"
                    fullWidth
                    mt="md"
                    leftSection={<FaPlus />}
                    onClick={addEmptyLine}
                    className="border-2 border-dashed border-orange-300 hover:border-orange-400"
                  >
                    Ajouter une ligne
                  </Button>
                </div>
              </Paper>
            </div>
          </div>
        </form>
      </div>

      {/* Modal nouveau client */}
      <Modal
        opened={openedClientModal}
        onClose={closeClientModal}
        title={
          <Text size="lg" fw={700} className="text-slate-800 dark:text-white flex items-center gap-2">
            <FaUser className="text-orange-500" />
            Nouveau client
          </Text>
        }
        centered
      >
        <form onSubmit={formC.onSubmit(onCreateC)}>
          <Stack gap="md">
            <TextInput
              label="Nom du client"
              placeholder="Entrez le nom"
              required
              {...formC.getInputProps('nom')}
            />
            <TextInput
              label="Téléphone"
              placeholder="Entrez le numéro"
              {...formC.getInputProps('tel')}
            />
            <TextInput
              label="Adresse"
              placeholder="Entrez l'adresse"
              {...formC.getInputProps('addr')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeClientModal}>
                Annuler
              </Button>
              <Button type="submit" color="orange" loading={loadingCreateClient}>
                Créer le client
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </div>
  );
}

export default NouvelleVente;
