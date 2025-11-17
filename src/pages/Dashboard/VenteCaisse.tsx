import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button, LoadingOverlay, Text, Paper, Title, Badge, Card, Avatar, Divider } from "@mantine/core";
import { WeeklyRevenue } from "./WeeklyRevenue";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { FaArrowLeft, FaCashRegister, FaCalendarAlt, FaMoneyBillWave } from "react-icons/fa";
import { formatN } from "../../lib/helpers";
import { VenteCaisseService } from "../../services/vente-caisse.service";

function VenteCaisse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const venteCaisseService = new VenteCaisseService();

  // Récupérer les informations de la vente caisse
  const { data: venteCaisse, isLoading } = useQuery({
    queryKey: ['get_vente_caisse', id],
    queryFn: () => venteCaisseService.getOne(id!)
  });

  return (
    <div className="min-h-screen">
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{ radius: 'sm', blur: 2 }}
        loaderProps={{ color: '#8A2BE2', type: 'dots' }}
      />
      <div className="mb-6 flex items-center">
        <Button 
          variant="subtle" 
          leftSection={<FaArrowLeft />} 
          onClick={() => navigate('/dashboard/vente-caisses')}
          className="text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-300"
        >
          Retour à la liste
        </Button>
      </div>

      <WeeklyRevenue add={''}>
        <>
          {/* Informations de la vente caisse */}
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
                  color="green"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md"
                >
                  <FaCashRegister size={32} />
                </Avatar>
                <div>
                  <Title order={2} className="text-gray-800 dark:text-gray-200">Vente Caisse</Title>
                  <Badge size="lg" radius="md" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white mt-1">
                    Détails de la vente
                  </Badge>
                </div>
              </div>
            </div>

            <Divider className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <Card p="md" radius="md" className="bg-green-50 dark:bg-gray-700 border border-green-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <FaMoneyBillWave className="text-green-500" />
                  <Text fw={600} className="text-gray-700 dark:text-gray-200">Montant</Text>
                </div>
                <Text size="xl" fw={700} className="text-green-600 dark:text-green-400 pl-7">
                  {formatN(venteCaisse?.montant || 0)} FCFA
                </Text>
              </Card>
              
              <Card p="md" radius="md" className="bg-blue-50 dark:bg-gray-700 border border-blue-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <FaCalendarAlt className="text-blue-500" />
                  <Text fw={600} className="text-gray-700 dark:text-gray-200">Date</Text>
                </div>
                <Text size="lg" className="text-gray-800 dark:text-gray-100 pl-7">
                  {venteCaisse?.date ? format(new Date(venteCaisse.date), 'dd MMMM yyyy', { locale: fr }) : 'Non renseignée'}
                </Text>
              </Card>
            </div>

            {/* Informations supplémentaires */}
            <Divider className="my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card p="md" radius="md" className="bg-purple-50 dark:bg-gray-700 border border-purple-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <FaCalendarAlt className="text-purple-500" />
                  <Text fw={600} className="text-gray-700 dark:text-gray-200">Date de création</Text>
                </div>
                <Text size="sm" className="text-gray-600 dark:text-gray-300 pl-7">
                  {venteCaisse?.createdAt ? format(new Date(venteCaisse.createdAt), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Non disponible'}
                </Text>
              </Card>

              <Card p="md" radius="md" className="bg-indigo-50 dark:bg-gray-700 border border-indigo-100 dark:border-gray-600 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <FaCalendarAlt className="text-indigo-500" />
                  <Text fw={600} className="text-gray-700 dark:text-gray-200">Dernière modification</Text>
                </div>
                <Text size="sm" className="text-gray-600 dark:text-gray-300 pl-7">
                  {venteCaisse?.updatedAt ? format(new Date(venteCaisse.updatedAt), 'dd MMMM yyyy à HH:mm', { locale: fr }) : 'Non disponible'}
                </Text>
              </Card>
            </div>

            {/* Statistiques */}
            <Divider className="my-6" />

            <Paper p="md" radius="md" className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <Text size="sm" className="opacity-90 mb-1">Montant total de cette vente</Text>
                  <Text size="xl" fw={700}>
                    {formatN(venteCaisse?.montant || 0)} FCFA
                  </Text>
                </div>
                <FaMoneyBillWave size={48} className="opacity-50" />
              </div>
            </Paper>
          </Paper>
        </>
      </WeeklyRevenue>
    </div>
  );
}

export default VenteCaisse;
