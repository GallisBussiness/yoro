import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "mantine-datatable";
import {
  ActionIcon,
  Badge,
  Button,
  Drawer,
  Group,
  LoadingOverlay,
  NumberInput,
  Paper,
  Popover,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import { DateInput, DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { FaTrash, FaEdit, FaPlus, FaCashRegister, FaCalendar, FaMoneyBillWave, FaBarcode, FaPrint, FaEye, FaDownload } from "react-icons/fa";
import { toast } from 'sonner';
import { startOfDay, endOfDay } from 'date-fns';
import { useNavigate } from "react-router-dom";
import { WeeklyRevenue } from "./WeeklyRevenue";
import { VenteCaisseService } from "../../services/vente-caisse.service";
import { VenteCaisse } from "../../types/vente-caisse";
import { printTicket, downloadTicket, openTicketInNewTab } from "../../utils/ticketPdf";
import { SearchInput } from "../../components/ui";

const PAGE_SIZE = 10;

function VenteCaisses() {
  const navigate = useNavigate();
  const [openedU, { open: openU, close: closeU }] = useDisclosure(false);
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<VenteCaisse[]>([]);
  const [sortStatus, setSortStatus] = useState<any>({ columnAccessor: 'date', direction: 'desc' });
  const [deleteTarget, setDeleteTarget] = useState<VenteCaisse | null>(null);

  const qc = useQueryClient();
  const venteCaisseService = new VenteCaisseService();
  const key = ['vente-caisse'];

  const formU = useForm({
    initialValues: {
      _id: '',
      montantTotal: 0,
      date: new Date(),
    },
    validate: {
      montantTotal: (v) => (v === undefined || v === null || v < 0 ? 'Le montant doit être positif' : null),
      date: (v) => (v ? null : 'Date requise'),
    },
  });

  const { data: venteCaisses, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => venteCaisseService.getAll(),
  });

  const { mutate: updateVenteCaisse, isPending: loadingUpdate } = useMutation({
    mutationFn: (data: { id: string, data: any }) => venteCaisseService.update(data.id, data.data),
    onSuccess: () => {
      closeU();
      qc.invalidateQueries({ queryKey: key });
      toast.success('Vente caisse mise à jour avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    }
  });

  const { mutate: deleteVenteCaisse, isPending: loadingDelete } = useMutation({
    mutationFn: (id: string) => venteCaisseService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      toast.success('Vente caisse supprimée avec succès');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const confirm = (id: string) => {
    deleteVenteCaisse(id);
  };

  const onUpdate = (values: any) => {
    const data = {
      montantTotal: values.montantTotal,
      date: values.date ? new Date(values.date).toISOString() : new Date().toISOString()
    };
    updateVenteCaisse({ id: formU.getValues()._id, data });
  };

  const handleUpdate = (data: VenteCaisse) => {
    formU.setValues({
      _id: data._id,
      montantTotal: data.montantTotal,
      date: new Date(data.date)
    });
    openU();
  };

  const getFilteredData = () => {
    let data = venteCaisses || [];

    if (query) {
      data = data.filter((v: VenteCaisse) =>
        `${v.montantTotal}${new Date(v.date).toLocaleDateString()}${v.numero || ''}`.toLowerCase().includes(query.trim().toLowerCase())
      );
    }

    if (dateRange[0] && dateRange[1]) {
      const start = startOfDay(dateRange[0]).getTime();
      const end = endOfDay(dateRange[1]).getTime();
      data = data.filter((vente: VenteCaisse) => {
        const venteTime = new Date(vente.date).getTime();
        return venteTime >= start && venteTime <= end;
      });
    }

    // Tri
    const sorted = [...data];
    const { columnAccessor, direction } = sortStatus;
    sorted.sort((a: any, b: any) => {
      let cmp = 0;
      if (columnAccessor === 'montantTotal') {
        cmp = (a.montantTotal || 0) - (b.montantTotal || 0);
      } else if (columnAccessor === 'date') {
        cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return direction === 'desc' ? -cmp : cmp;
    });

    return sorted;
  };

  const calculateTotal = (venteCaisses: VenteCaisse[] = []) => {
    return venteCaisses.reduce((sum, vente) => sum + (vente.montantTotal || 0), 0);
  };

  useEffect(() => {
    const filtered = getFilteredData();
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setRecords(filtered.slice(from, to) as VenteCaisse[]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venteCaisses, query, dateRange, page, sortStatus]);

  const filteredCount = getFilteredData().length;

  return (
    <div className="relative min-h-screen">
      <LoadingOverlay
        visible={loadingDelete}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'brand', type: 'dots' }}
      />
      <div className="mt-2">
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <Title order={2} className="text-gray-800 dark:text-gray-200 mb-1">Gestion des Ventes Caisse</Title>
              <Text className="text-muted-foreground">Gérez vos ventes en caisse</Text>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <FaCashRegister />
              <Text className="text-white">{filteredCount} ventes</Text>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <FaMoneyBillWave />
              <Text className="text-white">Total: {calculateTotal(getFilteredData()).toLocaleString()} FCFA</Text>
            </div>
          </div>
        </div>

        <Paper
          className="border-none shadow-none"
          p="md"
          style={{
            backgroundImage: "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8))",
            backdropFilter: "blur(10px)"
          }}
        >
          <WeeklyRevenue add={
            <Button
              variant="filled"
              leftSection={<FaPlus className="h-5 w-5" />}
              onClick={() => navigate('/dashboard/vente-caisses/nouvelle')}
              className="bg-purple-600 hover:bg-purple-700 transition-colors duration-300 shadow-md"
              size="md"
            >
              Nouvelle Vente Caisse
            </Button>
          }>
            <>
              <div className="flex flex-col md:flex-row gap-4 items-center w-full my-5">
                <div className="flex-1 w-full">
                  <SearchInput
                    value={query}
                    onChange={setQuery}
                    placeholder="Rechercher par montant ou date..."
                    className="shadow-sm"
                  />
                </div>
                <DatePickerInput
                  maxDate={new Date()}
                  type="range"
                  value={dateRange}
                  onChange={setDateRange}
                  clearable
                  placeholder="Date début - Date fin"
                  valueFormat="DD/MM/YYYY"
                  className="shadow-sm"
                  size="sm"
                  style={{ minWidth: '300px' }}
                />
              </div>
              <DataTable
                withTableBorder={false}
                columns={[
                  {
                    accessor: 'produits',
                    title: <Group gap="xs"><FaBarcode className="text-purple-500" /><Text fw={600} size="sm">Produits</Text></Group>,
                    width: 250,
                    render: (record: VenteCaisse) => (
                      <div className="space-y-1">
                        {record.produits?.slice(0, 3).map((p, i) => (
                          <Badge key={i} color="blue" variant="light" className="text-xs">
                            {p.nom} x{p.quantite}
                          </Badge>
                        ))}
                        {record.produits?.length > 3 && (
                          <Badge variant="default">+{record.produits.length - 3} autres</Badge>
                        )}
                        {(!record.produits || record.produits.length === 0) && (
                          <Text size="xs" c="dimmed">Aucun produit</Text>
                        )}
                      </div>
                    )
                  },
                  {
                    accessor: 'montantTotal',
                    title: <Text fw={600} size="sm" className="text-green-600">Montant Total</Text>,
                    textAlign: 'center',
                    sortable: true,
                    render: (record: VenteCaisse) => (
                      <Badge color="green" variant="light" className="text-base px-3 py-1 font-bold">
                        {record.montantTotal?.toLocaleString()} FCFA
                      </Badge>
                    )
                  },
                  {
                    accessor: 'date',
                    title: <Group gap="xs"><FaCalendar className="text-blue-500" /><Text fw={600} size="sm">Date</Text></Group>,
                    textAlign: 'center',
                    sortable: true,
                    render: (record: VenteCaisse) => (
                      <Text className="text-gray-800 dark:text-gray-200 text-xs">
                        {new Date(record.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric'
                        })}
                      </Text>
                    )
                  },
                  {
                    accessor: 'actions',
                    title: <Text fw={600} size="sm" className="text-foreground">Actions</Text>,
                    textAlign: 'center',
                    render: (record: VenteCaisse) => (
                      <Group gap={6} justify="center">
                        <Tooltip label="Imprimer ticket" withArrow>
                          <ActionIcon
                            variant="light"
                            color="green"
                            onClick={() => printTicket(record)}
                          >
                            <FaPrint />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Télécharger PDF" withArrow>
                          <ActionIcon
                            variant="light"
                            color="blue"
                            onClick={() => downloadTicket(record)}
                          >
                            <FaDownload />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Voir aperçu" withArrow>
                          <ActionIcon
                            variant="light"
                            color="grape"
                            onClick={() => openTicketInNewTab(record)}
                          >
                            <FaEye />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Modifier" withArrow>
                          <ActionIcon
                            variant="filled"
                            color="green"
                            onClick={() => handleUpdate(record)}
                          >
                            <FaEdit />
                          </ActionIcon>
                        </Tooltip>
                        <Popover width={220} position="bottom" withArrow shadow="md" opened={deleteTarget?._id === record._id} onChange={(o) => !o && setDeleteTarget(null)}>
                          <Popover.Target>
                            <Tooltip label="Supprimer" withArrow>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => setDeleteTarget(record)}
                              >
                                <FaTrash />
                              </ActionIcon>
                            </Tooltip>
                          </Popover.Target>
                          <Popover.Dropdown>
                            <Stack gap="xs">
                              <Text size="sm" fw={500}>Supprimer cette vente?</Text>
                              <Text size="xs" c="dimmed">Êtes-vous sûr de vouloir supprimer cette vente?</Text>
                              <Group gap="xs">
                                <Button
                                  variant="filled"
                                  color="red"
                                  size="xs"
                                  onClick={() => confirm(record._id)}
                                  loading={loadingDelete}
                                  className="flex-1"
                                >
                                  Confirmer
                                </Button>
                                <Button
                                  variant="default"
                                  size="xs"
                                  onClick={() => setDeleteTarget(null)}
                                  className="flex-1"
                                >
                                  Annuler
                                </Button>
                              </Group>
                            </Stack>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    )
                  },
                ]}
                records={records}
                fetching={isLoading}
                totalRecords={filteredCount}
                recordsPerPage={PAGE_SIZE}
                page={page}
                onPageChange={setPage}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                idAccessor="_id"
                noRecordsText="Aucune vente caisse trouvée"
                noRecordsIcon={
                  <div className="flex flex-col items-center justify-center py-10">
                    <Text className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                      Ajoutez votre première vente en cliquant sur "Nouvelle Vente Caisse"
                    </Text>
                    <Button
                      variant="filled"
                      color="green"
                      leftSection={<FaPlus />}
                      onClick={() => navigate('/dashboard/vente-caisses/nouvelle')}
                    >
                      Ajouter une vente
                    </Button>
                  </div>
                }
                className="overflow-hidden"
              />
            </>
          </WeeklyRevenue>
        </Paper>
      </div>

      {/* Drawer Modification */}
      <Drawer
        title={
          <Group gap="xs">
            <FaEdit className="text-blue-500" />
            <Title order={3} className="text-gray-800 dark:text-gray-200 mb-0">Modification de la Vente</Title>
          </Group>
        }
        position="right"
        onClose={closeU}
        opened={openedU}
        size="md"
      >
        <div className="relative">
          <LoadingOverlay visible={loadingUpdate} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
          <form onSubmit={formU.onSubmit(onUpdate)}>
            <Paper className="bg-blue-50 dark:bg-gray-800 border border-border shadow-sm mb-4" p="md">
              <Text className="text-sm font-medium text-muted-foreground mb-3 block">
                Informations de la vente
              </Text>

              <Stack gap="md">
                <NumberInput
                  label="Montant Total"
                  placeholder="Entrez le montant total"
                  withAsterisk
                  min={0}
                  leftSection={<FaMoneyBillWave className="text-gray-500" />}
                  rightSection={<Text size="xs">FCFA</Text>}
                  key={formU.key('montantTotal')}
                  {...formU.getInputProps('montantTotal')}
                />

                <DateInput
                  label="Date"
                  placeholder="Sélectionnez la date"
                  withAsterisk
                  valueFormat="DD/MM/YYYY"
                  key={formU.key('date')}
                  {...formU.getInputProps('date')}
                />
              </Stack>
            </Paper>

            <Group className="mt-6">
              <Button variant="default" onClick={closeU}>
                Annuler
              </Button>
              <Button
                variant="filled"
                type="submit"
                leftSection={<FaEdit />}
                className="bg-gradient-to-r from-blue-500 to-blue-600"
              >
                Mettre à jour
              </Button>
            </Group>
          </form>
        </div>
      </Drawer>

    </div>
  );
}

export default VenteCaisses;
