import { useQuery } from "@tanstack/react-query";
import { InventoryService } from "../../services/Inventory.service";
import { Badge, Box, Button, Group, HoverCard, LoadingOverlay, Text, Tooltip } from "@mantine/core";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { DataTable } from "mantine-datatable";
import { FaSortAlphaDown, FaSortAlphaDownAlt, FaBoxOpen, FaArrowUp, FaArrowDown, FaWarehouse, FaEye } from "react-icons/fa";
import { TbSum } from "react-icons/tb";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { authclient } from '../../../lib/auth-client';
import {  sortByKey } from "../../lib/helpers";
import { PageHeader, SearchInput, EmptyState, Money } from "../../components/ui";

const PAGE_SIZE = 10;

function Inventory() {
  const { data: session } = authclient.useSession()
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [page, setPage] = useState(1);
  const [records, setRecords] = useState<any>([]);
  const [bodyRef] = useAutoAnimate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortStatus, setSortStatus] = useState<any>({
    columnAccessor: 'type',
    direction: 'asc',
  });
  const navigate = useNavigate();
  const inventoryService = new InventoryService();
  const key = ['get_inventory'];
  const { data: invs, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => inventoryService.getByUser(session!.user.id),
    enabled: !!session,
  });

  const filtered = (Achat: any[] = []) => {
    return Achat?.filter(({ ref }) => {
      if (
        debouncedQuery !== '' &&
        !`${ref}`.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
      )
        return false;
      return true;
    })
  }

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
    const data = sortByKey(invs, sortStatus.columnAccessor);
    setRecords(
      sortStatus.direction === 'desc'
        ? (filtered(data).slice(from, to) ?? []).reverse()
        : filtered(data).slice(from, to) ?? [],
    );
  }, [searchParams, page, invs, debouncedQuery, sortStatus]);

  const totalStock = invs?.reduce((acc: number, cur: { mr: number }) => acc + cur.mr, 0) || 0;
  const totalIn = records.reduce((acc: number, cur: { ma: number }) => acc + cur.ma, 0);
  const totalOut = records.reduce((acc: number, cur: { mv: number }) => acc + cur.mv, 0);
  const totalRest = records.reduce((acc: number, cur: { mr: number }) => acc + cur.mr, 0);

  return (
    <div className="relative">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'brand', type: 'dots' }}
      />

      <PageHeader
        title="Inventaire"
        subtitle="Suivez vos stocks et mouvements de produits"
        icon={<FaWarehouse size={20} />}
      />

      {/* KPI band */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="gc-card flex items-center gap-4 p-4 md:p-5">
          <div className="gc-icon-chip h-11 w-11 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <FaArrowDown size={18} />
          </div>
          <div className="min-w-0">
            <p className="gc-page-subtitle text-xs font-medium uppercase tracking-wide">Entrant (page)</p>
            <p className="num mt-1 text-lg font-bold text-gc-pos"><Money value={totalIn} /></p>
          </div>
        </div>
        <div className="gc-card flex items-center gap-4 p-4 md:p-5">
          <div className="gc-icon-chip h-11 w-11 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <FaArrowUp size={18} />
          </div>
          <div className="min-w-0">
            <p className="gc-page-subtitle text-xs font-medium uppercase tracking-wide">Sortant (page)</p>
            <p className="num mt-1 text-lg font-bold text-gc-neg"><Money value={totalOut} /></p>
          </div>
        </div>
        <div className="gc-card flex items-center gap-4 p-4 md:p-5">
          <div className="gc-icon-chip h-11 w-11 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <TbSum size={18} />
          </div>
          <div className="min-w-0">
            <p className="gc-page-subtitle text-xs font-medium uppercase tracking-wide">Valeur du stock</p>
            <p className="num mt-1 text-lg font-bold text-gc"><Money value={totalStock} /></p>
          </div>
        </div>
      </div>

      <div className="gc-card p-4 md:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="gc-icon-chip h-10 w-10 bg-gc-muted text-gc-primary">
              <FaWarehouse size={18} />
            </div>
            <div>
              <Text fw={600} size="sm" className="text-gc">Mouvements de stock</Text>
              <Text size="xs" className="text-gc-muted">Références, entrées/sorties et montants</Text>
            </div>
          </div>
          <div className="w-full md:w-72">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Rechercher par référence..."
            />
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
              render: (data: any) => (
                <Text fw={500} className="text-gc">{data.ref}</Text>
              ),
            },
            {
              accessor: 'qa',
              title: <Text fw={600} size="sm" className="flex items-center gap-1.5"><FaArrowDown size={11} className="text-gc-pos" /> Entrant</Text>,
              textAlign: 'center',
              render: (data: any) => <Text className="num text-gc-pos" fw={500}>{data.qa}</Text>,
            },
            {
              accessor: 'qv',
              title: <Text fw={600} size="sm" className="flex items-center gap-1.5"><FaArrowUp size={11} className="text-gc-neg" /> Sortant</Text>,
              textAlign: 'center',
              render: (data: any) => <Text className="num text-gc-neg" fw={500}>{data.qv}</Text>,
            },
            {
              accessor: 'qr',
              title: <Text fw={600} size="sm">Stock restant</Text>,
              textAlign: 'center',
              sortable: true,
              render: (row: any) => {
                const critical = row.stock_seuil >= row.qr;
                const warning = !critical && row.stock_seuil + 5 >= row.qr;
                const color = critical ? 'red' : warning ? 'orange' : 'teal';
                const label = critical ? 'Critique' : warning ? 'Attention' : 'Normal';
                return (
                  <div className="flex items-center justify-center">
                    <HoverCard width={220} shadow="md" withArrow openDelay={200} closeDelay={100}>
                      <HoverCard.Target>
                        <Badge
                          color={color}
                          size="lg"
                          variant="light"
                          className="num cursor-pointer transition-transform duration-150 hover:scale-105"
                        >
                          {row?.qr}
                        </Badge>
                      </HoverCard.Target>
                      <HoverCard.Dropdown>
                        <div className="p-1">
                          <Text fw={600} size="sm" className="text-gc mb-2">Information de stock</Text>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                            <div className="text-gc-muted">Seuil d'alerte</div>
                            <div className="num text-gc font-medium">{row.stock_seuil}</div>
                            <div className="text-gc-muted">Statut</div>
                            <div className={`font-medium ${critical ? 'text-gc-neg' : warning ? 'text-gc-warn' : 'text-gc-pos'}`}>{label}</div>
                          </div>
                        </div>
                      </HoverCard.Dropdown>
                    </HoverCard>
                  </div>
                );
              },
            },
            {
              accessor: 'ma',
              title: <Text fw={600} size="sm">Montant entrant</Text>,
              textAlign: 'right',
              sortable: true,
              render: (data: any) => <Money value={data?.ma} tone="pos" />,
              footer: (
                <Group gap="xs" className="flex items-center justify-end bg-emerald-50 dark:bg-emerald-500/10 py-1.5 px-2 rounded-md">
                  <Box mb={-3}><TbSum size={16} className="text-gc-pos" /></Box>
                  <Text fw={700} size="xs" className="num text-gc-pos"><Money value={totalIn} /></Text>
                </Group>
              ),
            },
            {
              accessor: 'mv',
              title: <Text fw={600} size="sm">Montant sortant</Text>,
              textAlign: 'right',
              sortable: true,
              render: (data: any) => <Money value={data?.mv} tone="neg" />,
              footer: (
                <Group gap="xs" className="flex items-center justify-end bg-red-50 dark:bg-red-500/10 py-1.5 px-2 rounded-md">
                  <Box mb={-3}><TbSum size={16} className="text-gc-neg" /></Box>
                  <Text fw={700} size="xs" className="num text-gc-neg"><Money value={totalOut} /></Text>
                </Group>
              ),
            },
            {
              accessor: 'mr',
              title: <Text fw={600} size="sm">Montant restant</Text>,
              textAlign: 'right',
              sortable: true,
              render: (data: any) => <Money value={data?.mr} tone="info" />,
              footer: (
                <Group gap="xs" className="flex items-center justify-end bg-blue-50 dark:bg-blue-500/10 py-1.5 px-2 rounded-md">
                  <Box mb={-3}><TbSum size={16} className="text-gc-info" /></Box>
                  <Text fw={700} size="xs" className="num text-gc-info"><Money value={totalRest} /></Text>
                </Group>
              ),
            },
            {
              accessor: 'actions',
              title: <Text fw={600} size="sm" ta="center">Actions</Text>,
              textAlign: 'center',
              render: (rowData: any) => (
                <Tooltip label="Voir les détails" position="top" withArrow>
                  <Button
                    variant="light"
                    color="brand"
                    size="xs"
                    onClick={() => navigate(rowData._id)}
                    leftSection={<FaEye size={14} />}
                  >
                    Détails
                  </Button>
                </Tooltip>
              ),
            },
          ]}
          records={records}
          idAccessor="_id"
          fetching={isLoading}
          emptyState={
            <EmptyState
              icon={<FaBoxOpen size={26} />}
              title="Aucun article en inventaire trouvé"
              hint="Les mouvements d'achat et de vente alimenteront automatiquement cet inventaire."
            />
          }
          totalRecords={filtered(invs)?.length}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={(p) => {
            setSearchParams({ 'page': p.toString() });
            setPage(p);
          }}
          sortStatus={sortStatus}
          onSortStatusChange={setSortStatus}
          sortIcons={{
            sorted: <FaSortAlphaDownAlt size={13} className="text-gc-primary" />,
            unsorted: <FaSortAlphaDown size={13} className="text-gc-muted" />,
          }}
          className="border-none shadow-none"
          rowClassName={() => "transition-colors duration-150 hover:bg-muted/50"}
          paginationActiveBackgroundColor="var(--gc-primary)"
          bodyRef={bodyRef}
        />
      </div>
    </div>
  )
}

export default Inventory
