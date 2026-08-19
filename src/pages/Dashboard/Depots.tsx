import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ActionIcon,
  Button,
  Divider,
  LoadingOverlay,
  Modal,
  Paper,
  Popover,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
  Title,
  Tooltip,
  Pagination,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '../../components/shadcn';
import { SearchInput } from '../../components/ui';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaWarehouse,
  FaMapMarkerAlt,
  FaUser,
  FaCheck,
  FaTimes,
  FaEye
} from 'react-icons/fa';
import { authclient } from '../../../lib/auth-client';
import { DepotService } from '../../services/depot.service';
import { Depot } from '../../interfaces/depot.interface';

const PAGE_SIZE = 10;

const Depots: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDepot, setCurrentDepot] = useState<Depot | null>(null);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Depot | null>(null);

  const form = useForm({
    initialValues: {
      nom: '',
      responsable: '',
      adresse: '',
      actif: true,
      description: '',
    },
    validate: {
      nom: (v) => (v ? null : 'Veuillez entrer le nom du dépôt'),
      adresse: (v) => (v ? null : "Veuillez entrer l'adresse"),
    },
  });

  // Session utilisateur
  const { data: session } = authclient.useSession();
  const userId = session?.user?.id;

  // Service
  const depotService = new DepotService();

  // Récupération des dépôts
  const {
    data: depots,
    isLoading: loadingDepots,
    isError: errorDepots
  } = useQuery({
    queryKey: ['depots', userId],
    queryFn: () => depotService.getByUser(userId!),
    enabled: !!userId,
  });

  // Naviguer vers la page de détails du dépôt
  const navigateToDepotDetails = (depot: Depot) => {
    navigate(`/dashboard/depots/${depot._id}`);
  };

  // Mutation pour créer un dépôt
  const { mutate: createDepot, isPending: creatingDepot } = useMutation({
    mutationFn: (depot: Omit<Depot, '_id'>) => depotService.create(depot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depots', userId] });
      toast.success('Dépôt créé avec succès');
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la création du dépôt');
    }
  });

  // Mutation pour mettre à jour un dépôt
  const { mutate: updateDepot, isPending: updatingDepot } = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Depot> }) => depotService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depots', userId] });
      toast.success('Dépôt mis à jour avec succès');
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la mise à jour du dépôt');
    }
  });

  // Mutation pour supprimer un dépôt
  const { mutate: deleteDepot, isPending: deletingDepot } = useMutation({
    mutationFn: (id: string) => depotService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depots', userId] });
      toast.success('Dépôt supprimé avec succès');
      setDeleteTarget(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la suppression du dépôt');
    }
  });

  // Mutation pour changer le statut d'un dépôt
  const { mutate: toggleDepotStatus, isPending: togglingStatus } = useMutation({
    mutationFn: ({ id, actif }: { id: string, actif: boolean }) => depotService.toggleStatus(id, actif),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['depots', userId] });
      toast.success('Statut du dépôt mis à jour avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la mise à jour du statut');
    }
  });

  // Ouvrir le modal pour ajouter un dépôt
  const openAddModal = () => {
    setIsEditing(false);
    setCurrentDepot(null);
    form.reset();
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour éditer un dépôt
  const openEditModal = (depot: Depot) => {
    setIsEditing(true);
    setCurrentDepot(depot);
    form.setValues({
      nom: depot.nom,
      responsable: depot.responsable || '',
      adresse: depot.adresse,
      actif: depot.actif,
      description: depot.description || '',
    });
    setIsModalOpen(true);
  };

  // Fermer le modal
  const closeModal = () => {
    setIsModalOpen(false);
    form.reset();
  };

  // Soumettre le formulaire
  const handleSubmit = (values: any) => {
    if (isEditing && currentDepot?._id) {
      updateDepot({
        id: currentDepot._id,
        data: {
          ...values,
          userId: userId
        }
      });
    } else {
      createDepot({
        ...values,
        userId: userId!
      });
    }
  };

  // Filtrer les dépôts par recherche
  const filteredDepots = depots?.filter(depot =>
    depot.nom.toLowerCase().includes(searchText.toLowerCase()) ||
    depot.adresse.toLowerCase().includes(searchText.toLowerCase()) ||
    (depot.responsable && depot.responsable.toLowerCase().includes(searchText.toLowerCase()))
  );

  const totalRecords = filteredDepots?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const pagedDepots = (filteredDepots || []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  return (
    <>
      <div className="p-4 md:p-6 2xl:p-10">
        <Paper
          p="xl"
          radius="lg"
          className="bg-card shadow-xl border border-border relative"
          style={{
            backgroundImage: "linear-gradient(to right bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))",
            backdropFilter: "blur(10px)"
          }}
        >
          <LoadingOverlay visible={loadingDepots} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />

          {/* En-tête */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                  <FaWarehouse className="text-primary text-xl" />
                </div>
                <Title order={2} className="text-foreground">
                  Gestion des Dépôts de Stockage
                </Title>
              </div>
              <Text className="text-muted-foreground mt-2">
                Gérez vos différents emplacements de stockage pour vos achats
              </Text>
            </div>
            <div className="mt-4 md:mt-0">
              <Button
                variant="filled"
                leftSection={<FaPlus />}
                onClick={openAddModal}
                className="bg-gradient-to-r from-primary to-primary/70 hover:from-primary/80 hover:to-primary border-none shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                Nouveau Dépôt
              </Button>
            </div>
          </div>

          <Divider className="my-6" />

          {/* Barre de recherche */}
          <div className="mb-6 max-w-md">
            <SearchInput
              value={searchText}
              onChange={setSearchText}
              placeholder="Rechercher un dépôt..."
            />
          </div>

          {/* Tableau des dépôts */}
          {errorDepots ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-xl mb-2">Erreur lors du chargement des dépôts</div>
              <Button variant="light" onClick={() => queryClient.invalidateQueries({ queryKey: ['depots', userId] })}>
                Réessayer
              </Button>
            </div>
          ) : totalRecords === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">Aucun dépôt trouvé</div>
              <Button variant="filled" onClick={openAddModal} className="bg-primary">
                Créer un dépôt
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-gc">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Nom</TableHead>
                    <TableHead className="font-semibold">Adresse</TableHead>
                    <TableHead className="font-semibold">Responsable</TableHead>
                    <TableHead className="font-semibold text-center">Statut</TableHead>
                    <TableHead className="font-semibold text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedDepots.map((depot) => (
                    <TableRow key={depot._id}>
                      <TableCell>
                        <div className="flex items-center">
                          <FaWarehouse className="text-primary mr-2" />
                          <span className="font-medium">{depot.nom}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <FaMapMarkerAlt className="text-gray-500 mr-2" />
                          <span>{depot.adresse}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {depot.responsable ? (
                          <div className="flex items-center">
                            <FaUser className="text-gray-500 mr-2" />
                            <span>{depot.responsable}</span>
                          </div>
                        ) : <span className="text-gray-400 italic">Non défini</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={Boolean(depot.actif)}
                          onChange={(e) => toggleDepotStatus({ id: depot._id!, actif: e.currentTarget.checked })}
                          disabled={togglingStatus}
                          size="md"
                          color="grape"
                          onLabel={<FaCheck size={10} />}
                          offLabel={<FaTimes size={10} />}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip label="Voir les achats" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="green"
                              onClick={() => navigateToDepotDetails(depot)}
                            >
                              <FaEye />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Modifier" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => openEditModal(depot)}
                            >
                              <FaEdit />
                            </ActionIcon>
                          </Tooltip>
                          <Popover width={220} position="bottom" withArrow shadow="md" opened={deleteTarget?._id === depot._id} onChange={(o) => !o && setDeleteTarget(null)}>
                            <Popover.Target>
                              <ActionIcon
                                variant="subtle"
                                color="red"
                                loading={deletingDepot}
                                onClick={() => setDeleteTarget(depot)}
                              >
                                <FaTrash />
                              </ActionIcon>
                            </Popover.Target>
                            <Popover.Dropdown>
                              <Stack gap="xs">
                                <Text size="sm" fw={500}>Êtes-vous sûr de vouloir supprimer ce dépôt?</Text>
                                <Group gap="xs">
                                  <Button
                                    variant="filled"
                                    color="red"
                                    size="xs"
                                    onClick={() => deleteDepot(depot._id!)}
                                    loading={deletingDepot}
                                    className="flex-1"
                                  >
                                    Oui
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="xs"
                                    onClick={() => setDeleteTarget(null)}
                                    className="flex-1"
                                  >
                                    Non
                                  </Button>
                                </Group>
                              </Stack>
                            </Popover.Dropdown>
                          </Popover>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalRecords > PAGE_SIZE && (
            <div className="flex justify-center mt-4">
              <Pagination value={page} onChange={setPage} total={totalPages} />
            </div>
          )}
        </Paper>
      </div>

      {/* Modal pour ajouter/éditer un dépôt */}
      <Modal
        opened={isModalOpen}
        onClose={closeModal}
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <FaWarehouse className="text-primary" />
            </div>
            <span>{isEditing ? 'Modifier le dépôt' : 'Ajouter un nouveau dépôt'}</span>
          </div>
        }
        size="lg"
        centered
      >
        <form onSubmit={form.onSubmit(handleSubmit)} className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label="Nom du dépôt"
              placeholder="Ex: Entrepôt principal"
              withAsterisk
              key={form.key('nom')}
              {...form.getInputProps('nom')}
            />

            <TextInput
              label="Responsable"
              placeholder="Ex: Jean Dupont"
              key={form.key('responsable')}
              {...form.getInputProps('responsable')}
            />

            <TextInput
              label="Adresse"
              placeholder="Ex: 123 Rue Principale"
              withAsterisk
              key={form.key('adresse')}
              {...form.getInputProps('adresse')}
            />

            <div>
              <Text size="sm" fw={500} className="mb-1">Statut</Text>
              <Switch
                checked={form.values.actif}
                onChange={(e) => form.setFieldValue('actif', e.currentTarget.checked)}
                label={form.values.actif ? 'Actif' : 'Inactif'}
                color="grape"
                onLabel={<FaCheck size={10} />}
                offLabel={<FaTimes size={10} />}
              />
            </div>
          </div>

          <div className="mt-4">
            <Textarea
              label="Description"
              placeholder="Description du dépôt..."
              rows={4}
              key={form.key('description')}
              {...form.getInputProps('description')}
            />
          </div>

          <Group justify="flex-end" className="mt-6">
            <Button variant="default" onClick={closeModal}>
              Annuler
            </Button>
            <Button
              variant="filled"
              type="submit"
              loading={creatingDepot || updatingDepot}
              className="bg-gradient-to-r from-primary to-primary/70 hover:from-primary/80 hover:to-primary border-none"
            >
              {isEditing ? 'Mettre à jour' : 'Créer'}
            </Button>
          </Group>
        </form>
      </Modal>
    </>
  );
};

export default Depots;
