import { useQuery } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom"
import { InventoryService } from "../../services/Inventory.service";
import { Badge, Box, Button, Group, LoadingOverlay, Text, Stack } from "@mantine/core";
import { add, format, isAfter, isBefore } from "date-fns";
import { DataTable } from "mantine-datatable";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { DatePicker } from "@mantine/dates";
import { TbSum } from "react-icons/tb";
import { FaSortAlphaDown, FaSortAlphaDownAlt, FaShoppingCart, FaCalendarAlt, FaBoxOpen, FaBoxes } from "react-icons/fa";
import { formatN, sortByKey } from "../../lib/helpers";
import { authclient } from '../../../lib/auth-client';
import { PageHeader, SearchInput, EmptyState, Money } from "../../components/ui";
const PAGE_SIZE = 10;

function Inventori() {
    const {id} = useParams();
    const { data: session } = authclient.useSession()
    const [query1, setQuery1] = useState('');
  const [debouncedQuery1] = useDebouncedValue(query1, 200);
  const [page1, setPage1] = useState(1);
  const [records1, setRecords1] = useState<any>([]);
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(query, 200);
  const [page, setPage] = useState(1);
  const [dateSearchRange, setDateSearchRange] = useState<any>();
  const [bodyRef] = useAutoAnimate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortStatus, setSortStatus] = useState<any>({
      columnAccessor: 'type',
      direction: 'asc',
    });
    const [dateSearchRange1, setDateSearchRange1] = useState<any>();
  const [bodyRef1] = useAutoAnimate();
  const [searchParams1, setSearchParams1] = useSearchParams();
  const [sortStatus1, setSortStatus1] = useState<any>({
      columnAccessor: 'type',
      direction: 'asc',
    });
  const [records, setRecords] = useState<any>([]);
    const inventoryService = new InventoryService();
    const key  = ['get_inventory',id];
    const {data,isLoading} = useQuery({ queryKey: key, queryFn:() => inventoryService.getOneByUser(session!.user.id,id!) });

    const filtered = (DATA:any[] = []) => {
        return DATA?.filter(({ ref,date }) => {
          if (
            debouncedQuery !== '' &&
            !`${ref}`.toLowerCase().includes(debouncedQuery.trim().toLowerCase())
          )
            return false;
            if (
              dateSearchRange &&
              dateSearchRange[0] &&
              dateSearchRange[1] &&
              (isAfter(dateSearchRange[0],date) ||
               isBefore(dateSearchRange[1],date))
            )
              return false;
          return true;
        })
      }

      useEffect(() => {
        if(debouncedQuery1 === ''){
          if(searchParams1.has('page')){
            setPage1(parseInt(searchParams1.get('page') ?? '1'));
          }else {
            setPage1(1);
          }
         }
         else {
          setPage1(1);
         }
        const from1 = (page1 - 1) * PAGE_SIZE;
        const to1 = from1 + PAGE_SIZE;
        const d = sortByKey(data?.ventes, sortStatus1.columnAccessor);
        setRecords1(sortStatus1.direction === 'desc' ? (filtered(d).slice(from1, to1) ?? []).reverse() : filtered(d).slice(from1, to1) ?? []);
      }, [searchParams1,page1,data?.ventes,debouncedQuery1,dateSearchRange1,sortStatus1]);

      useEffect(() => {
        if(debouncedQuery === ''){
          if(searchParams.has('page')){
            setPage(parseInt(searchParams.get('page') ?? '1'));
          }else {
            setPage(1);
          }
         }
         else {
          setPage(1);
         }
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE;
        setRecords(filtered(data?.achats).slice(from, to) ?? []);
      }, [searchParams,page,data?.achats,debouncedQuery,dateSearchRange,sortStatus]);

  const totalQteVentes = records1.reduce((acc: number, cur: { qte: number }) => acc + cur.qte, 0);
  const totalMontantVentes = records1.reduce((acc: number, cur: { montant: number }) => acc + cur.montant, 0);
  const totalQteAchats = records.reduce((acc: number, cur: { qte: number }) => acc + cur.qte, 0);
  const totalMontantAchats = records.reduce((acc: number, cur: { montant: number }) => acc + cur.montant, 0);

  return (
    <div className="relative">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: 'brand', type: 'dots' }}
      />

      <PageHeader
        title="Détails d'inventaire"
        subtitle={`Mouvements et historique du produit ${data?.ref ?? ''}`}
        icon={<FaBoxOpen size={20} />}
      />

      {/* Ventes history */}
      <div className="gc-card mb-6 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="gc-icon-chip h-10 w-10 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <FaShoppingCart size={18} />
          </div>
          <div>
            <Text fw={600} size="sm" className="text-gc">Historique des ventes</Text>
            <Text size="xs" className="text-gc-muted">Ventes liées à cette référence</Text>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-72">
            <SearchInput value={query1} onChange={setQuery1} placeholder="Rechercher une vente..." />
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
              accessor: 'n',
              title: <Text fw={600} size="sm">N°</Text>,
              textAlign: 'center',
              render: (data: any) => <Badge color="brand" size="sm" variant="light">{data.n}</Badge>,
            },
            {
              accessor: 'ref',
              title: <Text fw={600} size="sm">Référence</Text>,
              textAlign: 'center',
              render: (data: any) => <Text fw={500} className="text-gc">{data.ref}</Text>,
            },
            {
              accessor: 'Date',
              title: <Text fw={600} size="sm" className="flex items-center gap-1.5"><FaCalendarAlt size={11} className="text-gc-info" /> Date</Text>,
              textAlign: 'center',
              sortable: true,
              render: ({date}) => <Text size="sm" className="text-gc-muted">{format(date, 'eeee dd/MM/yyyy')}</Text>,
              filter: ({ close }) => (
                <Stack className="gc-card p-3">
                  <Text size="sm" fw={500} className="text-gc mb-2">Filtrer par période</Text>
                  <DatePicker maxDate={add(new Date(), {days: 1})} type="range" value={dateSearchRange1} onChange={setDateSearchRange1} className="mb-2" />
                  <Button disabled={!dateSearchRange1} variant="light" color="brand" onClick={() => { setDateSearchRange1(undefined); close(); }} className="w-full">Effacer le filtre</Button>
                </Stack>
              ),
              filtering: Boolean(dateSearchRange1),
            },
            {
              accessor: 'qte',
              title: <Text fw={600} size="sm">Quantité</Text>,
              textAlign: 'center',
              sortable: true,
              render: (data: any) => <Text className="num text-gc-warn" fw={600}>{data.qte}</Text>,
              footer: (
                <Group gap="xs" className="flex items-center justify-center bg-amber-50 dark:bg-amber-500/10 py-1.5 px-2 rounded-md">
                  <Box mb={-3}><TbSum size={16} className="text-gc-warn" /></Box>
                  <Text fw={700} size="xs" className="num text-gc-warn">{formatN(totalQteVentes)} pièces</Text>
                </Group>
              ),
            },
            {
              accessor: 'montant',
              title: <Text fw={600} size="sm">Montant</Text>,
              textAlign: 'right',
              sortable: true,
              render: (data: any) => <Money value={data?.montant} tone="pos" />,
              footer: (
                <Group gap="xs" className="flex items-center justify-end bg-emerald-50 dark:bg-emerald-500/10 py-1.5 px-2 rounded-md">
                  <Box mb={-3}><TbSum size={16} className="text-gc-pos" /></Box>
                  <Text fw={700} size="xs" className="num text-gc-pos"><Money value={totalMontantVentes} /></Text>
                </Group>
              ),
            },
          ]}
          records={records1}
          idAccessor="_id"
          fetching={isLoading}
          emptyState={<EmptyState icon={<FaBoxOpen size={26} />} title="Aucune vente trouvée" hint="Les ventes de ce produit apparaîtront ici." />}
          totalRecords={filtered(data?.ventes)?.length}
          recordsPerPage={PAGE_SIZE}
          page={page1}
          onPageChange={(p) => { setSearchParams1({'page': p.toString()}); setPage1(p); }}
          sortStatus={sortStatus1}
          onSortStatusChange={setSortStatus1}
          sortIcons={{
            sorted: <FaSortAlphaDownAlt size={13} className="text-gc-primary" />,
            unsorted: <FaSortAlphaDown size={13} className="text-gc-muted" />,
          }}
          className="border-none shadow-none"
          rowClassName={() => "transition-colors duration-150 hover:bg-muted/50"}
          paginationActiveBackgroundColor="var(--gc-primary)"
          bodyRef={bodyRef1}
        />
      </div>

      {/* Approvisionnements history */}
      <div className="gc-card mt-6 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="gc-icon-chip h-10 w-10 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
            <FaBoxes size={18} />
          </div>
          <div>
            <Text fw={600} size="sm" className="text-gc">Historique des approvisionnements</Text>
            <Text size="xs" className="text-gc-muted">Achats liés à cette référence</Text>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="w-full md:w-72">
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un approvisionnement..." />
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
              accessor: 'n',
              title: <Text fw={600} size="sm">N°</Text>,
              textAlign: 'center',
              render: (data: any) => <Badge color="info" size="sm" variant="light">{data.n}</Badge>,
            },
            {
              accessor: 'ref',
              title: <Text fw={600} size="sm">Référence</Text>,
              textAlign: 'center',
              render: (data: any) => <Text fw={500} className="text-gc">{data.ref}</Text>,
            },
            {
              accessor: 'Date',
              title: <Text fw={600} size="sm" className="flex items-center gap-1.5"><FaCalendarAlt size={11} className="text-gc-info" /> Date</Text>,
              textAlign: 'center',
              sortable: true,
              render: ({date}) => <Text size="sm" className="text-gc-muted">{format(date, 'eeee dd/MM/yyyy')}</Text>,
              filter: ({ close }) => (
                <Stack className="gc-card p-3">
                  <Text size="sm" fw={500} className="text-gc mb-2">Filtrer par période</Text>
                  <DatePicker maxDate={add(new Date(), {days: 1})} type="range" value={dateSearchRange} onChange={setDateSearchRange} className="mb-2" />
                  <Button disabled={!dateSearchRange} variant="light" color="info" onClick={() => { setDateSearchRange(undefined); close(); }} className="w-full">Effacer le filtre</Button>
                </Stack>
              ),
              filtering: Boolean(dateSearchRange),
            },
            {
              accessor: 'qte',
              title: <Text fw={600} size="sm">Quantité</Text>,
              textAlign: 'center',
              sortable: true,
              render: (data: any) => <Text className="num text-gc-info" fw={600}>{data.qte}</Text>,
              footer: (
                <Group gap="xs" className="flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 py-1.5 px-2 rounded-md">
                  <Box mb={-3}><TbSum size={16} className="text-gc-info" /></Box>
                  <Text fw={700} size="xs" className="num text-gc-info">{formatN(totalQteAchats)} pièces</Text>
                </Group>
              ),
            },
            {
              accessor: 'montant',
              title: <Text fw={600} size="sm">Montant</Text>,
              textAlign: 'right',
              sortable: true,
              render: (data: any) => <Money value={data?.montant} tone="info" />,
              footer: (
                <Group gap="xs" className="flex items-center justify-end bg-blue-50 dark:bg-blue-500/10 py-1.5 px-2 rounded-md">
                  <Box mb={-3}><TbSum size={16} className="text-gc-info" /></Box>
                  <Text fw={700} size="xs" className="num text-gc-info"><Money value={totalMontantAchats} /></Text>
                </Group>
              ),
            },
          ]}
          records={records}
          idAccessor="_id"
          fetching={isLoading}
          emptyState={<EmptyState icon={<FaBoxOpen size={26} />} title="Aucun approvisionnement trouvé" hint="Les achats de ce produit apparaîtront ici." />}
          totalRecords={filtered(data?.achats)?.length}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={(p) => { setSearchParams({'page': p.toString()}); setPage(p); }}
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

export default Inventori
