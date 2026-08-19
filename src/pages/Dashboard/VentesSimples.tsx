import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { yupResolver } from 'mantine-form-yup-resolver';
import * as yup from 'yup';
import {
  ActionIcon, Badge, Button, Group, LoadingOverlay, Modal,
  NumberInput, Text, Textarea, Tooltip, SegmentedControl,
} from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { FaTrash, FaEdit, FaEye, FaBolt, FaBoxOpen } from "react-icons/fa";
import { TbSum, TbCalendarWeek, TbCalendarMonth } from "react-icons/tb";
import { AiOutlinePlus } from "react-icons/ai";
import { VenteSimpleService } from "../../services/vente-simple.service";
import { VenteSimple, TotauxResultat } from "../../types/vente-simple.types";
import { useIsVenteDuJour } from "../../hooks/useIsVenteDuJour";
import { PageHeader, SearchInput, EmptyState, Money } from "../../components/ui";
import { Card, CardContent } from "../../components/shadcn/card";

const PAGE_SIZE = 10;
const service = new VenteSimpleService();

const schema = yup.object({
  montant: yup.number().min(0.01, 'Montant invalide').required('Requis'),
  note: yup.string().max(500, 'Maximum 500 caractères').optional(),
});

type FormValues = yup.InferType<typeof schema>;
type PeriodeKey = 'jour' | 'semaine' | 'mois';

function VentesSimples() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [bodyRef] = useAutoAnimate();

  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<VenteSimple[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortStatus, setSortStatus] = useState<any>({ columnAccessor: 'date', direction: 'desc' });

  // Modal édition
  const [opened, { open, close }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Segmented control pour la période du chart
  const [periode, setPeriode] = useState<PeriodeKey>('semaine');

  // ===== Queries =====
  const key = ['vente-simple'];
  const { data: ventes, isLoading } = useQuery<VenteSimple[]>({
    queryKey: key,
    queryFn: () => service.getAll(),
  });

  const { data: totalJour } = useQuery<TotauxResultat>({
    queryKey: ['vente-simple-total-jour'],
    queryFn: () => service.getTotalJour(),
  });

  const { data: totalSemaine } = useQuery<TotauxResultat>({
    queryKey: ['vente-simple-total-semaine'],
    queryFn: () => service.getTotalSemaine(),
  });

  const { data: totalMois } = useQuery<TotauxResultat>({
    queryKey: ['vente-simple-total-mois'],
    queryFn: () => service.getTotalMois(),
  });

  // ===== Mutations =====
  const { mutate: deleteVente, isPending: loadingDelete } = useMutation({
    mutationFn: (id: string) => service.delete(id),
    onSuccess: () => {
      toast.success('Vente rapide supprimée');
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-jour'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-semaine'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-mois'] });
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("Seules les ventes du jour courant peuvent être supprimées.");
      } else {
        toast.error("Erreur lors de la suppression");
      }
    },
  });

  const { mutate: updateVente, isPending: loadingUpdate } = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { montant?: number; note?: string } }) =>
      service.updateVente(id, data),
    onSuccess: () => {
      toast.success('Vente rapide modifiée');
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-jour'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-semaine'] });
      qc.invalidateQueries({ queryKey: ['vente-simple-total-mois'] });
      close();
    },
    onError: (error: any) => {
      if (error?.response?.status === 403) {
        toast.error("Seules les ventes du jour courant peuvent être modifiées.");
      } else {
        toast.error("Erreur lors de la modification");
      }
    },
  });

  // ===== Form édition =====
  const form = useForm<FormValues>({
    initialValues: { montant: 0, note: '' },
    validate: yupResolver(schema),
  });

  const openEdit = (vente: VenteSimple) => {
    setEditingId(vente._id);
    form.setValues({ montant: vente.montant, note: vente.note ?? '' });
    open();
  };

  const onSubmit = (values: FormValues) => {
    if (!editingId) return;
    updateVente({ id: editingId, data: { montant: values.montant, note: values.note || undefined } });
  };

  // ===== Filtrage + pagination =====
  const filtered = (data: VenteSimple[] = []) => {
    return data.filter((v) => {
      if (debouncedQuery !== '') {
        const q = debouncedQuery.trim().toLowerCase();
        const inNote = v.note?.toLowerCase().includes(q);
        const inRef = v.ref.toLowerCase().includes(q);
        if (!inNote && !inRef) return false;
      }
      return true;
    });
  };

  useEffect(() => {
    if (debouncedQuery === '') {
      if (searchParams.has('page')) {
        setPage(parseInt(searchParams.get('page') ?? '1'));
      } else {
        setPage(1);
      }
    } else {
      setPage(1);
    }
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    let data = [...(ventes ?? [])];
    // tri simple
    data.sort((a, b) => {
      const dir = sortStatus.direction === 'desc' ? -1 : 1;
      const col = sortStatus.columnAccessor as keyof VenteSimple;
      const av = a[col] ?? '';
      const bv = b[col] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    setRecords(filtered(data).slice(from, to));
  }, [searchParams, page, ventes, debouncedQuery, sortStatus]);

  // ===== Chart data =====
  const chartData = (periode === 'jour' ? totalJour : periode === 'semaine' ? totalSemaine : totalMois)?.parJour ?? [];
  const chartFormatted = chartData.map((b) => ({
    ...b,
    label: format(parseISO(b.jour), 'dd/MM'),
  }));

  const kpis = [
    { label: 'Total du jour', value: totalJour?.total ?? 0, count: totalJour?.count ?? 0, icon: TbSum, tone: 'pos' as const },
    { label: 'Total de la semaine', value: totalSemaine?.total ?? 0, count: totalSemaine?.count ?? 0, icon: TbCalendarWeek, tone: 'info' as const },
    { label: 'Total du mois', value: totalMois?.total ?? 0, count: totalMois?.count ?? 0, icon: TbCalendarMonth, tone: 'neutral' as const },
  ];

  const tooltipStyle = {
    backgroundColor: 'var(--gc-surface)',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    border: '1px solid var(--gc-border)',
    color: 'var(--gc-text)',
  };

  return (
    <div className="relative">
      <LoadingOverlay
        visible={isLoading || loadingDelete || loadingUpdate}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'brand', type: 'dots' }}
      />

      <PageHeader
        title="Ventes Rapides"
        subtitle="Enregistrez et suivez vos ventes rapides (montant seul)"
        icon={<FaBolt size={18} />}
        actions={
          <Button
            color="brand"
            leftSection={<AiOutlinePlus className="h-4 w-4" />}
            onClick={() => navigate('/dashboard/ventes-simples/nouvelle')}
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            Nouvelle Vente Rapide
          </Button>
        }
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          const toneCfg = {
            pos: { chip: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400', val: 'text-emerald-600 dark:text-emerald-400' },
            info: { chip: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400', val: 'text-blue-600 dark:text-blue-400' },
            neutral: { chip: 'bg-muted text-foreground', val: 'text-foreground' },
          }[k.tone];
          return (
            <Card key={k.label} className="transition-shadow hover:shadow-md">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
                    <p className={`num mt-2 text-xl font-bold md:text-2xl ${toneCfg.val}`}>
                      <Money value={k.value} />
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{k.count} vente{k.count > 1 ? 's' : ''}</p>
                  </div>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneCfg.chip}`}>
                    <Icon size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart */}
      <Card className="mb-6">
        <CardContent className="p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Évolution des ventes rapides</h3>
            <SegmentedControl
              size="xs"
              value={periode}
              onChange={(v) => setPeriode(v as PeriodeKey)}
              data={[
                { label: 'Jour', value: 'jour' },
                { label: 'Semaine', value: 'semaine' },
                { label: 'Mois', value: 'mois' },
              ]}
            />
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartFormatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--gc-border)" />
              <XAxis dataKey="label" tick={{ fill: 'var(--gc-text-muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--gc-text-muted)', fontSize: 11 }} />
              <RechartsTooltip
                formatter={(value: any) => [`${new Intl.NumberFormat('fr-FR').format(Number(value))} FCFA`, 'Total']}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]} name="Total">
                {chartFormatted.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.total > 0 ? '#059669' : 'var(--gc-border)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-4 md:p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="gc-icon-chip h-10 w-10 bg-muted text-primary">
                <FaBolt size={16} />
              </div>
              <div>
                <Text fw={600} size="sm" className="text-foreground">Historique des ventes rapides</Text>
                <Text size="xs" className="text-muted-foreground">Référence, date, montant et note</Text>
              </div>
            </div>
            <div className="w-full md:w-72">
              <SearchInput value={query} onChange={setQuery} placeholder="Rechercher par ref ou note..." />
            </div>
          </div>

          <DataTable
            withTableBorder={false}
            striped={false}
            highlightOnHover
            verticalSpacing="xs"
            horizontalSpacing="md"
            columns={[
              {
                accessor: 'ref',
                title: <Text fw={600} size="sm">Référence</Text>,
                textAlign: 'center',
                render: (v: VenteSimple) => (
                  <Badge color="brand" variant="light" size="sm">{v.ref}</Badge>
                ),
              },
              {
                accessor: 'date',
                title: <Text fw={600} size="sm">Date</Text>,
                textAlign: 'center',
                sortable: true,
                render: (v: VenteSimple) => (
                  <Text size="sm" className="text-muted-foreground">
                    {format(parseISO(v.date), 'dd/MM/yyyy HH:mm')}
                  </Text>
                ),
              },
              {
                accessor: 'montant',
                title: <Text fw={600} size="sm">Montant</Text>,
                textAlign: 'right',
                sortable: true,
                render: (v: VenteSimple) => (
                  <Text className="num font-semibold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('fr-FR').format(v.montant)} FCFA
                  </Text>
                ),
              },
              {
                accessor: 'note',
                title: <Text fw={600} size="sm">Note</Text>,
                render: (v: VenteSimple) => (
                  <Text size="sm" className="text-muted-foreground">
                    {v.note ? (v.note.length > 50 ? v.note.substring(0, 50) + '…' : v.note) : '—'}
                  </Text>
                ),
              },
              {
                accessor: 'actions',
                title: <Text fw={600} size="sm" ta="center">Actions</Text>,
                textAlign: 'center',
                render: (v: VenteSimple) => {
                  const duJour = useIsVenteDuJour(v.date);
                  return (
                    <Group gap={4} justify="center">
                      <Tooltip label="Voir le détail" position="top" withArrow>
                        <ActionIcon variant="subtle" color="brand" onClick={() => navigate(v._id)}>
                          <FaEye size={14} />
                        </ActionIcon>
                      </Tooltip>
                      {duJour ? (
                        <>
                          <Tooltip label="Modifier" position="top" withArrow>
                            <ActionIcon variant="subtle" color="blue" onClick={() => openEdit(v)}>
                              <FaEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Supprimer" position="top" withArrow>
                            <ActionIcon variant="subtle" color="red" onClick={() => deleteVente(v._id)}>
                              <FaTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip label="Verrouillée — seule la vente du jour est modifiable" position="top" withArrow>
                          <ActionIcon variant="subtle" color="gray" disabled>
                            <FaBoxOpen size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  );
                },
              },
            ]}
            records={records}
            idAccessor="_id"
            fetching={isLoading}
            emptyState={
              <EmptyState
                icon={<FaBoxOpen size={26} />}
                title="Aucune vente rapide trouvée"
                hint="Cliquez sur « Nouvelle Vente Rapide » pour enregistrer une vente."
              />
            }
            totalRecords={filtered(ventes)?.length}
            recordsPerPage={PAGE_SIZE}
            page={page}
            onPageChange={(p) => { setSearchParams({ page: p.toString() }); setPage(p); }}
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            className="border-none shadow-none"
            rowClassName={() => "transition-colors duration-150 hover:bg-muted/50"}
            paginationActiveBackgroundColor="var(--gc-primary)"
            bodyRef={bodyRef}
          />
        </CardContent>
      </Card>

      {/* Modal édition */}
      <Modal opened={opened} onClose={close} title="Modifier la vente rapide" centered size="md">
        <form onSubmit={form.onSubmit(onSubmit)} className="space-y-4">
          <NumberInput
            label="Montant (FCFA)"
            placeholder="Entrez le montant"
            min={0.01}
            rightSection={<Text size="xs" className="text-muted-foreground pr-2">FCFA</Text>}
            rightSectionWidth={60}
            {...form.getInputProps('montant')}
          />
          <Textarea
            label="Note (optionnelle)"
            placeholder="Note associée à la vente..."
            maxLength={500}
            autosize
            minRows={2}
            {...form.getInputProps('note')}
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="subtle" onClick={close}>Annuler</Button>
            <Button type="submit" color="brand" loading={loadingUpdate}>Enregistrer</Button>
          </Group>
        </form>
      </Modal>
    </div>
  );
}

export default VentesSimples;
