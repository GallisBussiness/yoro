import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { VenteService } from "../../services/vente.service";
import { WeeklyRevenue } from "./WeeklyRevenue";
import { LoadingOverlay, Table, Paper, Text, Group, Badge, Box, Divider, Title, Button, Tooltip, Modal, Radio } from "@mantine/core";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatN } from "../../lib/helpers";
import { FaShoppingCart, FaUser, FaCalendarAlt, FaFileInvoiceDollar, FaTag, FaBoxes, FaPrint } from "react-icons/fa";
import Breadcrumb from '../../components/Breadcrumbs/Breadcrumb';
import { ParamService } from "../../services/paramservice";
import { authclient } from "../../../lib/auth-client";
import { printInvoice } from "./invoice";
import { useState } from "react";

function Vente() {
  const { id } = useParams();
  const { data: session } = authclient.useSession();
  const [selectedFormat, setSelectedFormat] = useState<'A4' | 'A5'>('A4');
  const [printModalOpened, setPrintModalOpened] = useState(false);
  const key = ['vente', id];
  const venteService = new VenteService();
  const params = new ParamService();
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: () => venteService.getOne(id!),
  })

  const { data: paramsData, isLoading: paramsLoading } = useQuery({
    queryKey: ['params'],
    queryFn: () => params.getByUser(session?.user?.id!),
  })


  
  // Calculer le total des produits
  const calculateTotal = () => {
    if (!data?.produits) return 0;
    return data.produits.reduce((acc: number, item: any) => acc + (item.pu * item.qte), 0);
  }

  const Invoice = () => {
    printInvoice(data,selectedFormat,paramsData);
    setPrintModalOpened(false);
  }

  return (
    <div className="mx-auto p-4">
      <Breadcrumb pageName="Détails de la vente" />
      
      <LoadingOverlay
        visible={isLoading || paramsLoading}
        zIndex={1000}
        overlayProps={{ radius: 'md', blur: 3 }}
        loaderProps={{ color: '#8A2BE2', type: 'bars' }}
      />
      
      {data && (
        <WeeklyRevenue add={''}>
          <Paper 
            p="md" 
            radius="md" 
            className="bg-white dark:bg-gray-800 shadow-xl mb-4"
            style={{
              backgroundImage: "linear-gradient(to right bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.9))",
              backdropFilter: "blur(10px)"
            }}
          >
            {/* En-tête avec informations de la vente */}
            <div className="mb-6">
              <Group justify="space-between" className="mb-3">
                <Group>
                  <div className="flex flex-col items-center justify-center bg-orange-50 dark:bg-orange-900/20 p-3 rounded-full">
                    <FaShoppingCart size={24} className="text-orange-500" />
                  </div>
                  <div>
                    <Text fw={700} size="lg" className="text-gray-800 dark:text-gray-200">
                      Vente #{data.ref}
                    </Text>
                    <Text size="sm" color="dimmed">
                      Détails de la commande de vente
                    </Text>
                  </div>
                </Group>
                
                <Group>
                  {/* Boutons pour le ticket de caisse */}
                  <Group gap="xs">
                    <Tooltip label="Imprimer le ticket">
                      <Button
                        variant="light"
                        color="orange"
                        radius="md"
                        leftSection={<FaPrint size={16} />}
                        onClick={() => {
                        setPrintModalOpened(true);
                        }}
                        className="transition-all hover:shadow-md"
                      >
                        Imprimer
                      </Button>
                    </Tooltip>
                  </Group>
                  
                  <Badge 
                    size="lg" 
                    radius="md"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-2"
                  >
                    {formatN(calculateTotal() - (data.remise || 0))} FCFA
                  </Badge>
                </Group>
              </Group>
              
              <Divider className="my-4" />
              
              {/* Informations de la vente */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <Box className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <Group gap="xs">
                      <FaCalendarAlt className="text-blue-500" />
                      <Text size="sm" fw={500} className="text-blue-700 dark:text-blue-300">Date</Text>
                    </Group>
                    <Text size="sm" className="mt-1">
                      {data.date ? format(new Date(data.date), 'dd MMMM yyyy', { locale: fr }) : 'N/A'}
                    </Text>
                  </Box>
                </div>
                
                <div>
                  <Box className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <Group gap="xs">
                      <FaUser className="text-green-500" />
                      <Text size="sm" fw={500} className="text-green-700 dark:text-green-300">Client</Text>
                    </Group>
                    <Text size="sm" className="mt-1">
                      {data.client?.nom || 'N/A'}
                    </Text>
                  </Box>
                </div>
                
                <div>
                  <Box className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                    <Group gap="xs">
                      <FaBoxes className="text-purple-500" />
                      <Text size="sm" fw={500} className="text-purple-700 dark:text-purple-300">Articles</Text>
                    </Group>
                    <Text size="sm" className="mt-1">
                      {data.produits?.length || 0} produit(s)
                    </Text>
                  </Box>
                </div>
                
                <div>
                  <Box className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md">
                    <Group gap="xs">
                      <FaTag className="text-amber-500" />
                      <Text size="sm" fw={500} className="text-amber-700 dark:text-amber-300">Remise</Text>
                    </Group>
                    <Text size="sm" className="mt-1">
                      {formatN(data.remise || 0)} FCFA
                    </Text>
                  </Box>
                </div>
              </div>
              
              {/* Résumé financier */}
              <Box className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-md mb-4">
                <Group className="mb-2">
                  <FaFileInvoiceDollar className="text-orange-500" />
                  <Title order={5} className="text-gray-800 dark:text-gray-200">
                    Résumé financier
                  </Title>
                </Group>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Text size="sm" className="text-gray-500 dark:text-gray-400">Montant total:</Text>
                    <Text fw={600}>{formatN(calculateTotal())} FCFA</Text>
                  </div>
                  
                  <div>
                    <Text size="sm" className="text-gray-500 dark:text-gray-400">Remise:</Text>
                    <Text fw={600}>{formatN(data.remise || 0)} FCFA</Text>
                  </div>
                  
                  <div>
                    <Text size="sm" className="text-gray-500 dark:text-gray-400">Net à payer:</Text>
                    <Text fw={600} className="text-orange-600 dark:text-orange-400">
                      {formatN(calculateTotal() - (data.remise || 0))} FCFA
                    </Text>
                  </div>
                </div>
              </Box>
            </div>
            
            {/* Tableau des produits */}
            <Box>
              <Title order={4} className="mb-4 flex items-center gap-2">
                <FaBoxes className="text-orange-500" /> 
                <span className="text-gray-800 dark:text-gray-200">Liste des produits</span>
              </Title>
              
              <Table 
                striped 
                highlightOnHover 
                withColumnBorders
                className="overflow-hidden rounded-md border border-gray-200 dark:border-gray-700"
              >
                <Table.Thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                  <Table.Tr>
                    <Table.Th className="text-white font-medium">N°</Table.Th>
                    <Table.Th className="text-white font-medium">Référence</Table.Th>
                    <Table.Th className="text-white font-medium">Quantité</Table.Th>
                    <Table.Th className="text-white font-medium">Unité</Table.Th>
                    <Table.Th className="text-white font-medium">Description</Table.Th>
                    <Table.Th className="text-white font-medium">Prix unitaire</Table.Th>
                    <Table.Th className="text-white font-medium">Total</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data?.produits.map((el: any, i: number) => (
                    <Table.Tr 
                      key={el.ref} 
                      className="transition-colors hover:bg-orange-50 dark:hover:bg-orange-900/10"
                    >
                      <Table.Td className="font-medium text-gray-700 dark:text-gray-300">{i + 1}</Table.Td>
                      <Table.Td>
                        <Badge 
                          variant="light" 
                          color="blue"
                          className="font-mono"
                        >
                          {el.ref}
                        </Badge>
                      </Table.Td>
                      <Table.Td className="font-medium">{el.qte}</Table.Td>
                      <Table.Td>{el.unite}</Table.Td>
                      <Table.Td>{el.nom}</Table.Td>
                      <Table.Td>{formatN(el.pu)} FCFA</Table.Td>
                      <Table.Td className="font-medium text-orange-600 dark:text-orange-400">
                        {formatN(el.pu * el.qte)} FCFA
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
                <Table.Tfoot className="bg-gray-50 dark:bg-gray-800/50">
                  <Table.Tr>
                    <Table.Td colSpan={5}></Table.Td>
                    <Table.Td className="font-bold">Total:</Table.Td>
                    <Table.Td className="font-bold text-orange-600 dark:text-orange-400">
                      {formatN(calculateTotal())} FCFA
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td colSpan={5}></Table.Td>
                    <Table.Td className="font-bold">Remise:</Table.Td>
                    <Table.Td className="font-bold text-orange-600 dark:text-orange-400">
                      {formatN(data.remise || 0)} FCFA
                    </Table.Td>
                  </Table.Tr>
                  <Table.Tr>
                    <Table.Td colSpan={5}></Table.Td>
                    <Table.Td className="font-bold">Net à payer:</Table.Td>
                    <Table.Td className="font-bold text-orange-600 dark:text-orange-400">
                      {formatN(calculateTotal() - (data.remise || 0))} FCFA
                    </Table.Td>
                  </Table.Tr>
                </Table.Tfoot>
              </Table>
            </Box>
          </Paper>
        </WeeklyRevenue>
      )}

<Modal
     opened={printModalOpened}
     onClose={() => setPrintModalOpened(false)}
     title={
       <Text size="lg" fw={700} className="text-slate-800 dark:text-white">
         Format d'impression
       </Text>
     }
     size="sm"
     centered
   >
     <div className="space-y-4">
       <Text size="sm" className="text-slate-600 dark:text-slate-300">
         Veuillez sélectionner le format de papier pour l'impression de la facture :
       </Text>
       
       <div className="space-y-2">
         <Radio.Group
           value={selectedFormat}
           onChange={(value: string) => setSelectedFormat(value as 'A4' | 'A5')}
           name="formatPaper"
           className="space-y-2"
         >
           <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
             <Radio value="A4" label={
               <div className="ml-2">
                 <Text size="sm" fw={500}>Format A4</Text>
                 <Text size="xs" color="dimmed">210 × 297 mm - Format standard</Text>
               </div>
             } />
           </div>
           
           <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
             <Radio value="A5" label={
               <div className="ml-2">
                 <Text size="sm" fw={500}>Format A5</Text>
                 <Text size="xs" color="dimmed">148 × 210 mm - Format moyen</Text>
               </div>
             } />
           </div>
         </Radio.Group>
       </div>
       
       <div className="flex justify-end gap-3 mt-4">
         <Button variant="subtle" color="gray" onClick={() => setPrintModalOpened(false)}>
           Annuler
         </Button>
         <Button 
           className="bg-orange-500 hover:bg-orange-600"
           onClick={Invoice}
           leftSection={<FaPrint size={14} />}
         >
           Imprimer
         </Button>
       </div>
     </div>
   </Modal>
    </div>
  )
}

export default Vente
