import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import { DataTable } from "mantine-datatable";
import { ActionIcon, Badge, Box, Button, Drawer, Group, LoadingOverlay, NumberInput, Paper, Popover, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { FaTrash, FaEdit, FaSearch, FaPlus, FaCashRegister, FaCalendar, FaMoneyBillWave, FaChartLine } from "react-icons/fa";
import { useForm } from "@mantine/form";
import { toast } from 'sonner';
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { DateInput } from '@mantine/dates';
import { WeeklyRevenue } from "./WeeklyRevenue";
import { VenteCaisseService } from "../../services/vente-caisse.service";
import { VenteCaisse } from "../../types/vente-caisse";

const schema = yup.object().shape({
  montant: yup.number().required('Montant requis').min(0, 'Le montant doit être positif'),
  date: yup.date().required('Date requise'),
});

const PAGE_SIZE = 10;

function VenteCaisses() {
  const [opened, { open, close }] = useDisclosure(false);
  const [openedU, { open: openU, close: closeU }] = useDisclosure(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<VenteCaisse[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const qc = useQueryClient();
  const venteCaisseService = new VenteCaisseService();
  const key = ['vente-caisse'];

  const { data: venteCaisses, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => venteCaisseService.getAll(),
  });

  const form = useForm({
    initialValues: {
      montant: 0,
      date: new Date(),
    },
    validate: yupResolver(schema),
  });

  const formU = useForm({
    initialValues: {
      _id: '',
      montant: 0,
      date: new Date(),
    },
    validate: yupResolver(schema),
  });

  const { mutate: createVenteCaisse, isPending: loadingCreate } = useMutation({
    mutationFn: (data: any) => venteCaisseService.create(data),
    onSuccess: () => {
      close();
      qc.invalidateQueries({ queryKey: key });
      form.reset();
      toast.success('Vente caisse créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    }
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
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const confirm = (id: string) => {
    deleteVenteCaisse(id);
  };

  const cancel = () => {
    toast.info("L'action a été annulée !");
  };

  const onCreate = (values: any) => {
    const data = {
      ...values,
      date: values.date.toISOString()
    };
    createVenteCaisse(data);
  };

  const onUpdate = (values: any) => {
    const { _id, createdAt, updatedAt, __v, ...rest } = values;
    const data = {
      ...rest,
      date: rest.date instanceof Date ? rest.date.toISOString() : rest.date
    };
    updateVenteCaisse({ id: _id, data });
  };

  const handleUpdate = (data: VenteCaisse) => {
    formU.setValues({
      ...data,
      date: new Date(data.date)
    });
    openU();
  };

  const filtered = (venteCaisses: VenteCaisse[] = []) => {
    return venteCaisses?.filter(({ montant, date }) => {
      if (
        debouncedQuery !== '' &&
        !`${montant}${new Date(date).toLocaleDateString()}`.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
      )
        return false;

      return true;
    });
  };

  const calculateTotal = (venteCaisses: VenteCaisse[] = []) => {
    return venteCaisses.reduce((sum, vente) => sum + vente.montant, 0);
  };

  // Filtrer les ventes par date sélectionnée
  const filterBySelectedDate = (venteCaisses: VenteCaisse[] = []) => {
    if (!selectedDate) return venteCaisses;
    
    return venteCaisses.filter((vente) => {
      const venteDate = new Date(vente.date);
      return (
        venteDate.getDate() === selectedDate.getDate() &&
        venteDate.getMonth() === selectedDate.getMonth() &&
        venteDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  };

  // Calculer les statistiques par date
  const getStatisticsByDate = (venteCaisses: VenteCaisse[] = []) => {
    const stats = new Map<string, { count: number; total: number }>();
    
    venteCaisses.forEach((vente) => {
      const dateKey = new Date(vente.date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (stats.has(dateKey)) {
        const current = stats.get(dateKey)!;
        stats.set(dateKey, {
          count: current.count + 1,
          total: current.total + vente.montant
        });
      } else {
        stats.set(dateKey, {
          count: 1,
          total: vente.montant
        });
      }
    });
    
    // Convertir en tableau et trier par date (plus récent en premier)
    return Array.from(stats.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  useEffect(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setRecords(filtered(venteCaisses).slice(from, to) ?? []);
  }, [venteCaisses, debouncedQuery, page]);

  return (
    <div className="min-h-screen">
      <LoadingOverlay
        visible={loadingDelete}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: '#8A2BE2', type: 'dots' }}
      />
      <div className="mt-2">
        <div className="mb-6">
          <Group>
            <div>
              <Title order={2} className="text-gray-800 dark:text-gray-200">Gestion des Ventes Caisse</Title>
              <Text className="text-gray-600 dark:text-gray-400">Gérez vos ventes en caisse</Text>
            </div>
            <Badge size="lg" radius="md" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2">
              <Group>
                <FaCashRegister />
                <Text>{filtered(venteCaisses)?.length || 0} ventes</Text>
              </Group>
            </Badge>
            <Badge size="lg" radius="md" className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2">
              <Group>
                <FaMoneyBillWave />
                <Text>Total: {calculateTotal(filtered(venteCaisses)).toLocaleString()} FCFA</Text>
              </Group>
            </Badge>
          </Group>
        </div>

        <Paper
          p="md"
          radius="md"
          className="bg-white dark:bg-gray-800 shadow-lg mb-6"
          style={{
            backgroundImage: "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8))",
            backdropFilter: "blur(10px)"
          }}
        >
          <WeeklyRevenue add={<div>
            <Button
              bg="#8A2BE2"
              leftSection={<FaPlus className="h-5 w-5 text-white" />}
              onClick={open}
              className="hover:bg-orange-700 transition-colors duration-300 shadow-md"
              radius="md"
            >
              Nouvelle Vente Caisse
            </Button>
          </div>}>
            <>
              <div className="flex justify-between items-center w-full md:w-1/2 my-5">
                <div className="w-full relative">
                  <TextInput
                    value={query}
                    onChange={(e) => setQuery(e.currentTarget.value)}
                    placeholder="Rechercher une vente..."
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
              <DataTable
                withTableBorder={true}
                columns={[
                  {
                    accessor: 'montant',
                    title: (
                      <Group>
                        <FaMoneyBillWave className="text-green-500" />
                        <Text fw={600}>Montant</Text>
                      </Group>
                    ),
                    textAlign: 'center',
                    render: (record) => (
                      <Badge color="green" variant="light" radius="sm" size="lg">
                        {record.montant.toLocaleString()} FCFA
                      </Badge>
                    )
                  },
                  {
                    accessor: 'date',
                    title: (
                      <Group>
                        <FaCalendar className="text-blue-500" />
                        <Text fw={600}>Date</Text>
                      </Group>
                    ),
                    textAlign: 'center',
                    render: (record) => (
                      <Text fw={500} className="text-gray-800 dark:text-gray-200">
                        {new Date(record.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
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
                    render: (rowData: VenteCaisse) => (
                      <Group>
                        <Tooltip label="Modifier">
                          <ActionIcon
                            onClick={() => handleUpdate(rowData)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 text-white shadow-md"
                            radius="md"
                            size="lg"
                          >
                            <FaEdit />
                          </ActionIcon>
                        </Tooltip>
                        <Popover width={250} position="bottom" withArrow shadow="xl">
                          <Popover.Target>
                            <Tooltip label="Supprimer">
                              <ActionIcon
                                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 text-white shadow-md"
                                radius="md"
                                size="lg"
                              >
                                <FaTrash />
                              </ActionIcon>
                            </Tooltip>
                          </Popover.Target>
                          <Popover.Dropdown className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col space-y-4">
                              <Text className="text-gray-800 dark:text-gray-200 font-medium">Êtes-vous sûr de vouloir supprimer cette vente?</Text>
                              <Group>
                                <Button
                                  variant="filled"
                                  color="red"
                                  onClick={() => confirm(rowData?._id)}
                                  className="hover:bg-red-700 transition-colors duration-300"
                                  radius="md"
                                >
                                  Confirmer
                                </Button>
                                <Button
                                  variant="outline"
                                  color="gray"
                                  onClick={cancel}
                                  className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
                                  radius="md"
                                >
                                  Annuler
                                </Button>
                              </Group>
                            </div>
                          </Popover.Dropdown>
                        </Popover>
                      </Group>
                    ),
                  },
                ]}
                records={records}
                idAccessor="_id"
                striped={true}
                stripedColor="rgba(138, 43, 226, 0.1)"
                style={{
                  fontWeight: 'normal',
                }}
                fetching={isLoading}
                emptyState={
                  <div className="flex flex-col items-center justify-center py-10">
                    <Text size="lg" fw={500} className="text-gray-600 dark:text-gray-400">
                      Aucune vente caisse trouvée
                    </Text>
                    <Text size="sm" className="text-gray-500 dark:text-gray-500 mb-4">
                      Ajoutez votre première vente en cliquant sur "Nouvelle Vente Caisse"
                    </Text>
                    <Button
                      leftSection={<FaPlus />}
                      onClick={open}
                      className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300"
                      radius="md"
                    >
                      Ajouter une vente
                    </Button>
                  </div>
                }
                totalRecords={filtered(venteCaisses)?.length}
                recordsPerPage={10}
                page={page}
                onPageChange={(p) => setPage(p)}
                borderRadius="lg"
                shadow="xl"
                horizontalSpacing="md"
                verticalSpacing="md"
                verticalAlign="center"
                highlightOnHover
                className="overflow-hidden"
                paginationActiveBackgroundColor="#8A2BE2"
                rowClassName={() => 'hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-200'}
              />
            </>
          </WeeklyRevenue>
        </Paper>

           <Paper
          p="md"
          radius="md"
          className="bg-white dark:bg-gray-800 shadow-lg mb-6"
          style={{
            backgroundImage: "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8))",
            backdropFilter: "blur(10px)"
          }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <FaChartLine className="text-purple-500 text-2xl" />
              <div>
                <Title order={3} className="text-gray-800 dark:text-gray-200">Statistiques par Date</Title>
                <Text size="sm" className="text-gray-600 dark:text-gray-400">Nombre de ventes et montant total par jour</Text>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <DateInput
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Filtrer par date"
                leftSection={<FaCalendar className="text-gray-500" />}
                clearable
                valueFormat="DD/MM/YYYY"
                className="w-64"
                styles={() => ({
                  input: {
                    '&:focus': {
                      borderColor: '#8A2BE2',
                    },
                  },
                })}
              />
              {selectedDate && (
                <Button
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => setSelectedDate(null)}
                >
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          {getStatisticsByDate(filterBySelectedDate(filtered(venteCaisses))).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-purple-500 to-indigo-500">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FaCalendar />
                        Date
                      </div>
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase tracking-wider">
                      <div className="flex items-center justify-center gap-2">
                        <FaCashRegister />
                        Nombre de ventes
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">
                      <div className="flex items-center justify-end gap-2">
                        <FaMoneyBillWave />
                        Montant total
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {getStatisticsByDate(filterBySelectedDate(filtered(venteCaisses))).map((stat, index) => (
                    <tr 
                      key={index} 
                      className="hover:bg-purple-50 dark:hover:bg-gray-700 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Text fw={500} className="text-gray-800 dark:text-gray-200">
                          {stat.date}
                        </Text>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Badge color="indigo" variant="light" size="lg">
                          {stat.count} vente{stat.count > 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Badge color="green" variant="filled" size="lg">
                          {stat.total.toLocaleString()} FCFA
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-green-500 to-emerald-500">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Text fw={700} className="text-white">
                        TOTAL GÉNÉRAL
                      </Text>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant="filled" size="xl">
                        {filterBySelectedDate(filtered(venteCaisses))?.length || 0} vente{filterBySelectedDate(filtered(venteCaisses))?.length > 1 ? 's' : ''}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Badge variant="filled" size="xl">
                        {calculateTotal(filterBySelectedDate(filtered(venteCaisses))).toLocaleString()} FCFA
                      </Badge>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Text className="text-gray-500 dark:text-gray-400">Aucune statistique disponible</Text>
            </div>
          )}
        </Paper>
      </div>

      <Drawer
        opened={opened}
        onClose={close}
        title={<Title order={3} className="text-gray-800 dark:text-gray-200 flex items-center gap-2"><FaCashRegister className="text-green-500" /> Nouvelle Vente Caisse</Title>}
        padding="xl"
        size="md"
        position="right"
        classNames={{
          header: 'border-b border-gray-200 dark:border-gray-700 pb-3',
          body: 'pt-6'
        }}
      >
        <LoadingOverlay
          visible={loadingCreate}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: '#8A2BE2', type: 'dots' }}
        />
        <form onSubmit={form.onSubmit(onCreate)} className="space-y-4">
          <Paper p="md" radius="md" className="bg-green-50 dark:bg-gray-800 border border-green-100 dark:border-gray-700 shadow-sm">
            <Text size="sm" fw={500} className="text-gray-600 dark:text-gray-400 mb-3">
              Informations de la vente
            </Text>

            <NumberInput
              required
              label="Montant"
              placeholder="Entrez le montant"
              leftSection={<FaMoneyBillWave className="text-gray-500" />}
              {...form.getInputProps('montant')}
              className="mb-3"
              min={0}
              decimalScale={2}
              thousandSeparator=" "
              suffix=" FCFA"
              styles={() => ({
                input: {
                  '&:focus': {
                    borderColor: '#8A2BE2',
                  },
                },
              })}
            />
            <DateInput
              required
              label="Date"
              placeholder="Sélectionnez la date"
              leftSection={<FaCalendar className="text-gray-500" />}
              {...form.getInputProps('date')}
              valueFormat="DD/MM/YYYY"
              styles={() => ({
                input: {
                  '&:focus': {
                    borderColor: '#8A2BE2',
                  },
                },
              })}
            />
          </Paper>

          <Group className="mt-6">
            <Button
              variant="subtle"
              color="gray"
              onClick={close}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-md"
              leftSection={<FaPlus />}
            >
              Créer la vente
            </Button>
          </Group>
        </form>
      </Drawer>

      <Drawer
        position="right"
        opened={openedU}
        onClose={closeU}
        title={<Title order={3} className="text-gray-800 dark:text-gray-200 flex items-center gap-2"><FaEdit className="text-blue-500" /> Modification de la Vente</Title>}
        padding="xl"
        size="md"
        classNames={{
          header: 'border-b border-gray-200 dark:border-gray-700 pb-3',
          body: 'pt-6'
        }}
      >
        <LoadingOverlay
          visible={loadingUpdate}
          zIndex={1000}
          overlayProps={{ radius: 'sm', blur: 2 }}
          loaderProps={{ color: '#8A2BE2', type: 'dots' }}
        />
        <form onSubmit={formU.onSubmit(onUpdate)} className="space-y-4">
          <Paper p="md" radius="md" className="bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 shadow-sm">
            <Text size="sm" fw={500} className="text-gray-600 dark:text-gray-400 mb-3">
              Informations de la vente
            </Text>

            <NumberInput
              required
              label="Montant"
              placeholder="Entrez le montant"
              leftSection={<FaMoneyBillWave className="text-gray-500" />}
              {...formU.getInputProps('montant')}
              className="mb-3"
              min={0}
              decimalScale={2}
              thousandSeparator=" "
              suffix=" FCFA"
              styles={() => ({
                input: {
                  '&:focus': {
                    borderColor: '#8A2BE2',
                  },
                },
              })}
            />
            <DateInput
              required
              label="Date"
              placeholder="Sélectionnez la date"
              leftSection={<FaCalendar className="text-gray-500" />}
              {...formU.getInputProps('date')}
              valueFormat="DD/MM/YYYY"
              styles={() => ({
                input: {
                  '&:focus': {
                    borderColor: '#8A2BE2',
                  },
                },
              })}
            />
          </Paper>

          <Group className="mt-6">
            <Button
              variant="subtle"
              color="gray"
              onClick={closeU}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md"
              leftSection={<FaEdit />}
            >
              Mettre à jour
            </Button>
          </Group>
        </form>
      </Drawer>
    </div>
  );
}

export default VenteCaisses;
