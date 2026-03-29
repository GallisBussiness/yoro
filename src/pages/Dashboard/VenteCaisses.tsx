import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Button, 
  Drawer, 
  Input, 
  InputNumber, 
  DatePicker, 
  Table, 
  Space, 
  Typography, 
  Tooltip, 
  Popconfirm, 
  Spin, 
  Card, 
  Tag, 
  Badge,
  Flex,
  Form
} from 'antd';

const { RangePicker } = DatePicker;
import { FaTrash, FaEdit, FaSearch, FaPlus, FaCashRegister, FaCalendar, FaMoneyBillWave, FaBarcode, FaPrint, FaEye, FaDownload } from "react-icons/fa";
import { toast } from 'sonner';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useNavigate } from "react-router-dom";
import { WeeklyRevenue } from "./WeeklyRevenue";
import { VenteCaisseService } from "../../services/vente-caisse.service";
import { VenteCaisse, VenteCaisseProduit } from "../../types/vente-caisse";
import { printTicket, downloadTicket, openTicketInNewTab } from "../../utils/ticketPdf";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Title, Text } = Typography;

const PAGE_SIZE = 10;

function VenteCaisses() {
  const navigate = useNavigate();
  const [openedU, setOpenedU] = useState(false);
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  
  const qc = useQueryClient();
  const venteCaisseService = new VenteCaisseService();
  const key = ['vente-caisse'];
  const [formU] = Form.useForm();

  const { data: venteCaisses, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => venteCaisseService.getAll(),
  });

  const { mutate: updateVenteCaisse, isPending: loadingUpdate } = useMutation({
    mutationFn: (data: { id: string, data: any }) => venteCaisseService.update(data.id, data.data),
    onSuccess: () => {
      setOpenedU(false);
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

  const onUpdate = (values: any) => {
    const data = {
      montantTotal: values.montantTotal,
      date: dayjs(values.date).toISOString()
    };
    updateVenteCaisse({ id: formU.getFieldValue('_id'), data });
  };

  const handleUpdate = (data: VenteCaisse) => {
    formU.setFieldsValue({
      ...data,
      date: dayjs(data.date)
    });
    setOpenedU(true);
  };

  const getFilteredData = () => {
    let data = venteCaisses || [];
    
    if (query) {
      data = data.filter((v: VenteCaisse) => 
        `${v.montantTotal}${new Date(v.date).toLocaleDateString()}${v.numero || ''}`.toLowerCase().includes(query.trim().toLowerCase())
      );
    }
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      data = data.filter((vente: VenteCaisse) => {
        const venteDate = dayjs(vente.date);
        return venteDate.isSameOrAfter(dateRange[0], 'day') && venteDate.isSameOrBefore(dateRange[1], 'day');
      });
    }
    
    return data;
  };

  const calculateTotal = (venteCaisses: VenteCaisse[] = []) => {
    return venteCaisses.reduce((sum, vente) => sum + (vente.montantTotal || 0), 0);
  };

  const columns = [
    {
      title: (
        <Space>
          <FaBarcode className="text-purple-500" />
          <Text strong>Produits</Text>
        </Space>
      ),
      dataIndex: 'produits',
      key: 'produits',
      width: 250,
      render: (prods: VenteCaisseProduit[]) => (
        <div className="space-y-1">
          {prods?.slice(0, 3).map((p, i) => (
            <Tag key={i} color="blue" className="text-xs">
              {p.nom} x{p.quantite}
            </Tag>
          ))}
          {prods?.length > 3 && (
            <Tag color="default">+{prods.length - 3} autres</Tag>
          )}
          {(!prods || prods.length === 0) && (
            <Text type="secondary" className="text-xs">Aucun produit</Text>
          )}
        </div>
      )
    },
    {
      title: <Text strong className="text-green-600">Montant Total</Text>,
      dataIndex: 'montantTotal',
      key: 'montantTotal',
      align: 'center' as const,
      sorter: (a: VenteCaisse, b: VenteCaisse) => (a.montantTotal || 0) - (b.montantTotal || 0),
      render: (montantTotal: number) => (
        <Tag color="green" className="text-base px-3 py-1 font-bold">
          {montantTotal?.toLocaleString()} FCFA
        </Tag>
      )
    },
    {
      title: (
        <Space>
          <FaCalendar className="text-blue-500" />
          <Text strong>Date</Text>
        </Space>
      ),
      dataIndex: 'date',
      key: 'date',
      align: 'center' as const,
      sorter: (a: VenteCaisse, b: VenteCaisse) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: 'descend' as any,
      render: (date: string) => (
        <Text className="text-gray-800 dark:text-gray-200 text-xs">
          {new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour:'numeric',
            minute:'numeric'
          })}
        </Text>
      )
    },
    {
      title: <Text strong className="text-gray-700 dark:text-gray-300">Actions</Text>,
      key: 'actions',
      align: 'center' as const,
      render: (_: any, record: VenteCaisse) => (
        <Space size="small">
          <Tooltip title="Imprimer ticket">
            <Button
              icon={<FaPrint />}
              onClick={() => printTicket(record)}
              className="text-green-600 border-green-600"
            />
          </Tooltip>
          <Tooltip title="Télécharger PDF">
            <Button
              icon={<FaDownload />}
              onClick={() => downloadTicket(record)}
              className="text-blue-600 border-blue-600"
            />
          </Tooltip>
          <Tooltip title="Voir aperçu">
            <Button
              icon={<FaEye />}
              onClick={() => openTicketInNewTab(record)}
              className="text-purple-600 border-purple-600"
            />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="primary"
              icon={<FaEdit />}
              onClick={() => handleUpdate(record)}
              className="bg-gradient-to-r from-green-500 to-green-600"
              size="small"
            />
          </Tooltip>
          <Popconfirm
            title="Supprimer cette vente?"
            description="Êtes-vous sûr de vouloir supprimer cette vente?"
            onConfirm={() => confirm(record._id)}
            onCancel={cancel}
            okText="Confirmer"
            cancelText="Annuler"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Supprimer">
              <Button danger icon={<FaTrash />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loadingDelete} tip="Suppression en cours...">
      <div className="min-h-screen">
        <div className="mt-2">
          <div className="mb-6">
            <Flex gap="middle" wrap="wrap" align="center">
              <div>
                <Title level={2} className="text-gray-800 dark:text-gray-200 mb-1">Gestion des Ventes Caisse</Title>
                <Text className="text-gray-600 dark:text-gray-400">Gérez vos ventes en caisse</Text>
              </div>
              <Badge count={getFilteredData()?.length || 0} showZero color="#52c41a" overflowCount={999}>
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <FaCashRegister />
                  <Text className="text-white">ventes</Text>
                </div>
              </Badge>
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <FaMoneyBillWave />
                <Text className="text-white">Total: {calculateTotal(getFilteredData()).toLocaleString()} FCFA</Text>
              </div>
            </Flex>
          </div>

          <Card
            className="bg-white dark:bg-gray-800 shadow-lg mb-6"
            style={{
              backgroundImage: "linear-gradient(to right bottom, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.8))",
              backdropFilter: "blur(10px)"
            }}
          >
            <WeeklyRevenue add={
              <Button
                type="primary"
                icon={<FaPlus className="h-5 w-5" />}
                onClick={() => navigate('/dashboard/vente-caisses/nouvelle')}
                className="bg-purple-600 hover:bg-purple-700 transition-colors duration-300 shadow-md"
                size="large"
              >
                Nouvelle Vente Caisse
              </Button>
            }>
              <>
                <div className="flex flex-col md:flex-row gap-4 items-center w-full my-5">
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher par montant ou date..."
                    prefix={<FaSearch className="text-gray-500" />}
                    className="shadow-sm flex-1"
                    size="large"
                    allowClear
                  />
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
                    format="DD/MM/YYYY"
                    placeholder={['Date début', 'Date fin']}
                    className="shadow-sm"
                    size="large"
                    style={{ minWidth: '300px' }}
                  />
                </div>
                <Table
                  columns={columns}
                  dataSource={getFilteredData()}
                  rowKey="_id"
                  loading={isLoading}
                  pagination={{
                    pageSize: PAGE_SIZE,
                    showSizeChanger: true,
                    showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} ventes`,
                    pageSizeOptions: ['10', '20', '50', '100'],
                  }}
                  locale={{
                    emptyText: (
                      <div className="flex flex-col items-center justify-center py-10">
                        <Text className="text-lg font-medium text-gray-600 dark:text-gray-400">
                          Aucune vente caisse trouvée
                        </Text>
                        <Text className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                          Ajoutez votre première vente en cliquant sur "Nouvelle Vente Caisse"
                        </Text>
                        <Button
                          type="primary"
                          icon={<FaPlus />}
                          onClick={() => navigate('/dashboard/vente-caisses/nouvelle')}
                          className="bg-gradient-to-r from-green-500 to-green-600"
                        >
                          Ajouter une vente
                        </Button>
                      </div>
                    )
                  }}
                  className="overflow-hidden"
                  bordered
                />
              </>
            </WeeklyRevenue>
          </Card>
        </div>

        {/* Drawer Modification */}
        <Drawer
          title={
            <Space>
              <FaEdit className="text-blue-500" />
              <Title level={3} className="text-gray-800 dark:text-gray-200 mb-0">Modification de la Vente</Title>
            </Space>
          }
          placement="right"
          onClose={() => setOpenedU(false)}
          open={openedU}
          width={500}
        >
          <Spin spinning={loadingUpdate} tip="Mise à jour en cours...">
            <Form
              form={formU}
              layout="vertical"
              onFinish={onUpdate}
            >
              <Card className="bg-blue-50 dark:bg-gray-800 border border-blue-100 dark:border-gray-700 shadow-sm mb-4">
                <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 block">
                  Informations de la vente
                </Text>

                <Form.Item
                  label="Montant Total"
                  name="montantTotal"
                  rules={[
                    { required: true, message: 'Montant requis' },
                    { type: 'number', min: 0, message: 'Le montant doit être positif' }
                  ]}
                >
                  <InputNumber
                    placeholder="Entrez le montant total"
                    prefix={<FaMoneyBillWave className="text-gray-500" />}
                    className="w-full"
                    min={0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                    parser={value => value!.replace(/\s?/g, '') as any}
                    addonAfter="FCFA"
                    size="large"
                  />
                </Form.Item>

                <Form.Item
                  label="Date"
                  name="date"
                  rules={[{ required: true, message: 'Date requise' }]}
                >
                  <DatePicker
                    placeholder="Sélectionnez la date"
                    format="DD/MM/YYYY"
                    className="w-full"
                    size="large"
                  />
                </Form.Item>
              </Card>

              <Space className="mt-6">
                <Button onClick={() => setOpenedU(false)}>
                  Annuler
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<FaEdit />}
                  className="bg-gradient-to-r from-blue-500 to-blue-600"
                >
                  Mettre à jour
                </Button>
              </Space>
            </Form>
          </Spin>
        </Drawer>

      </div>
    </Spin>
  );
}

export default VenteCaisses;
