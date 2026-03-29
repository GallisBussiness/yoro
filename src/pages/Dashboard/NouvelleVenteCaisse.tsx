import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Button, 
  InputNumber, 
  Typography, 
  Card, 
  Tag, 
  Divider,
  Select
} from 'antd';
import { FaTrash, FaPlus, FaCashRegister, FaMoneyBillWave, FaBarcode, FaPrint, FaMinus, FaArrowLeft, FaShoppingCart } from "react-icons/fa";
import { toast } from 'sonner';
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom";
import { VenteCaisseService } from "../../services/vente-caisse.service";
import { ArticleService } from "../../services/article.service";
import { VenteCaisse } from "../../types/vente-caisse";
import useScanDetection from 'use-scan-detection';
import { authclient } from '../../../lib/auth-client';
import { printTicket } from "../../utils/ticketPdf";

const { Title, Text } = Typography;

function NouvelleVenteCaisse() {
  const { data: session } = authclient.useSession();
  const navigate = useNavigate();
  
  // État local pour les produits (format interne)
  type ProduitLocal = {
    nom: string;
    prixUnitaire: number;
    quantite: number;
    ref: string;
  };
  const [produits, setProduits] = useState<ProduitLocal[]>([]);
  const [searchValue, setSearchValue] = useState('');
  
  const qc = useQueryClient();
  const venteCaisseService = new VenteCaisseService();
  const articleService = new ArticleService();

  // Récupérer les articles
  const { data: articles } = useQuery({
    queryKey: ['articles'],
    queryFn: () => articleService.getByUser(session!.user.id),
    enabled: session !== null
  });

  const { mutate: createVenteCaisse, isPending: loadingCreate } = useMutation({
    mutationFn: (data: any) => venteCaisseService.create(data),
    onSuccess: (newVente: VenteCaisse) => {
      qc.invalidateQueries({ queryKey: ['vente-caisse'] });
      toast.success('Vente caisse créée avec succès');
      // Imprimer automatiquement le ticket
      printTicket(newVente);
      // Réinitialiser le formulaire
      setProduits([]);
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    }
  });

  // Scanner de code-barres
  useScanDetection({
    onComplete: (code: String) => {
      const codeStr = code.toString();
      const article = articles?.find((a: any) => a.ref === codeStr || a.codeBarre === codeStr);
      if (article) {
        addOrIncrementProduct(article);
        toast.success(`${article.nom} ajouté`, { icon: '📦' });
      } else {
        toast.error(`Produit non trouvé: ${codeStr}`);
      }
    },
    minLength: 3
  });

  // Ajouter ou incrémenter un produit
  const addOrIncrementProduct = (article: any) => {
    const existingIndex = produits.findIndex(p => p.ref === article.ref);
    if (existingIndex !== -1) {
      const updated = [...produits];
      updated[existingIndex].quantite += 1;
      setProduits(updated);
      toast.success(`Quantité de ${article.nom} augmentée`, { icon: '⬆️' });
    } else {
      setProduits([...produits, {
        ref: article.ref,
        nom: article.nom,
        prixUnitaire: article.prix,
        quantite: 1
      }]);
    }
  };

  // Calculs
  const montantTotal = produits.reduce((sum, p) => sum + (p.prixUnitaire * p.quantite), 0);
  const nombreArticles = produits.reduce((sum, p) => sum + p.quantite, 0);

  const updateQuantity = (index: number, delta: number) => {
    const updated = [...produits];
    updated[index].quantite = Math.max(1, updated[index].quantite + delta);
    setProduits(updated);
  };

  const setQuantity = (index: number, qte: number) => {
    const updated = [...produits];
    updated[index].quantite = Math.max(1, qte);
    setProduits(updated);
  };

  const removeProduct = (index: number) => {
    setProduits(produits.filter((_, i) => i !== index));
  };

  const handleValidate = () => {
    if (produits.length === 0) {
      toast.error('Ajoutez au moins un produit');
      return;
    }
    // Transformer les produits au format attendu par le backend
    const produitsFormatted = produits.map(p => ({
      nom: p.nom,
      quantite: p.quantite,
      prixUnitaire: p.prixUnitaire,
      montant: p.prixUnitaire * p.quantite
    }));
    
    const data = {
      produits: produitsFormatted,
      montantTotal,
      date: new Date().toISOString()
    };
    createVenteCaisse(data);
  };

  const handleNewSale = () => {
    setProduits([]);
  };

  // Filtrer les articles pour la recherche
  const filteredArticles = articles?.filter((a: any) => 
    a.nom.toLowerCase().includes(searchValue.toLowerCase()) ||
    a.ref.toLowerCase().includes(searchValue.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button 
            icon={<FaArrowLeft />} 
            onClick={() => navigate('/dashboard/ventes-caisse')}
            className="bg-slate-700 text-white border-none hover:bg-slate-600"
          >
            Retour
          </Button>
          <div>
            <Title level={3} className="text-white mb-0 flex items-center gap-2">
              <FaCashRegister className="text-green-400" />
              Caisse Enregistreuse
            </Title>
            <Text className="text-slate-400">
              {dayjs().format('dddd DD MMMM YYYY - HH:mm')}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Tag color="blue" className="text-lg px-4 py-1">
            <FaShoppingCart className="inline mr-2" />
            {nombreArticles} article{nombreArticles > 1 ? 's' : ''}
          </Tag>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Section Gauche - Recherche et Produits */}
        <div className="lg:col-span-2 space-y-4">
          {/* Barre de recherche */}
          <Card className="bg-slate-800 border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <FaBarcode className="text-purple-400 text-xl" />
              <Text className="text-white font-medium">Scanner ou rechercher un produit</Text>
            </div>
            <Select
              showSearch
              placeholder="Tapez le nom ou scannez le code-barres..."
              className="w-full"
              size="large"
              value={null}
              searchValue={searchValue}
              onSearch={setSearchValue}
              filterOption={false}
              onChange={(value) => {
                const article = articles?.find((a: any) => a._id === value);
                if (article) {
                  addOrIncrementProduct(article);
                  setSearchValue('');
                }
              }}
              options={filteredArticles.slice(0, 10).map((a: any) => ({
                value: a._id,
                label: (
                  <div className="flex justify-between items-center py-1">
                    <div>
                      <span className="font-medium">{a.nom}</span>
                      <span className="text-gray-400 text-xs ml-2">({a.ref})</span>
                    </div>
                    <Tag color="green">{a.prix?.toLocaleString()} F</Tag>
                  </div>
                )
              }))}
              notFoundContent={
                <div className="text-center py-4 text-gray-400">
                  <FaBarcode size={30} className="mx-auto mb-2 opacity-30" />
                  <p>Aucun produit trouvé</p>
                </div>
              }
            />
            <Text className="text-slate-500 text-xs mt-2 block">
              💡 Scannez un code-barres ou tapez le nom du produit
            </Text>
          </Card>

          {/* Liste des produits */}
          <Card className="bg-slate-800 border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <Text className="text-white font-medium text-lg">
                Panier ({produits.length} produit{produits.length > 1 ? 's' : ''})
              </Text>
              {produits.length > 0 && (
                <Button size="small" danger onClick={() => setProduits([])}>
                  Vider le panier
                </Button>
              )}
            </div>

            {produits.length === 0 ? (
              <div className="text-center py-16">
                <FaShoppingCart size={60} className="mx-auto mb-4 text-slate-600" />
                <Text className="text-slate-400 text-lg block">Panier vide</Text>
                <Text className="text-slate-500 text-sm">Scannez ou recherchez des produits</Text>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {produits.map((prod, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-4 bg-slate-700/50 rounded-xl border border-slate-600 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex-1">
                      <Text strong className="text-white text-base block">{prod.nom}</Text>
                      <Text className="text-slate-400 text-sm">
                        {prod.prixUnitaire.toLocaleString()} F × {prod.quantite}
                      </Text>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-slate-600 rounded-lg">
                        <Button 
                          type="text"
                          icon={<FaMinus className="text-white" />} 
                          onClick={() => updateQuantity(index, -1)}
                          disabled={prod.quantite <= 1}
                          className="text-white hover:bg-slate-500"
                        />
                        <InputNumber
                          min={1}
                          value={prod.quantite}
                          onChange={(val) => setQuantity(index, val || 1)}
                          className="w-16 text-center bg-transparent border-none text-white"
                          controls={false}
                        />
                        <Button 
                          type="text"
                          icon={<FaPlus className="text-white" />} 
                          onClick={() => updateQuantity(index, 1)}
                          className="text-white hover:bg-slate-500"
                        />
                      </div>
                      <div className="w-28 text-right">
                        <Text strong className="text-green-400 text-lg">
                          {(prod.prixUnitaire * prod.quantite).toLocaleString()} F
                        </Text>
                      </div>
                      <Button 
                        type="text"
                        danger 
                        icon={<FaTrash />} 
                        onClick={() => removeProduct(index)}
                        className="hover:bg-red-500/20"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Section Droite - Récapitulatif et Paiement */}
        <div className="space-y-4">
          {/* Récapitulatif */}
          <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
            <Title level={4} className="text-white mb-4 flex items-center gap-2">
              <FaMoneyBillWave className="text-green-400" />
              <span className="font-bold text-white">Récapitulatif</span>
            </Title>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-700">
                <Text className="text-slate-400">Sous-total</Text>
                <Text className="text-white text-xl font-medium">
                  {montantTotal.toLocaleString()} F
                </Text>
              </div>

              <Divider className="border-slate-600 my-4" />

              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-center">
                <Text className="text-green-100 text-sm block mb-1">TOTAL À PAYER</Text>
                <Text className="text-white text-4xl font-bold">
                  {montantTotal.toLocaleString()}
                </Text>
                <Text className="text-green-100 text-lg ml-2">FCFA</Text>
              </div>
            </div>
          </Card>

          {/* Boutons d'action */}
          <div className="space-y-3">
            <Button
              type="primary"
              size="large"
              block
              icon={<FaCashRegister />}
              onClick={handleValidate}
              loading={loadingCreate}
              disabled={produits.length === 0}
              className="h-16 text-xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 border-none hover:from-green-600 hover:to-emerald-700 shadow-lg shadow-green-500/30"
            >
              VALIDER ({montantTotal.toLocaleString()} F)
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button
                size="large"
                icon={<FaTrash />}
                onClick={handleNewSale}
                disabled={produits.length === 0}
                className="h-12 bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
              >
                Annuler
              </Button>
              <Button
                size="large"
                icon={<FaPrint />}
                disabled={produits.length === 0}
                className="h-12 bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
              >
                Imprimer
              </Button>
            </div>
          </div>

          {/* Raccourcis clavier */}
          <Card className="bg-slate-800/50 border-slate-700">
            <Text className="text-slate-400 text-xs block mb-2">Raccourcis clavier</Text>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Tag className="bg-slate-700 text-slate-300 border-none">F2</Tag>
                <Text className="text-slate-400">Rechercher</Text>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="bg-slate-700 text-slate-300 border-none">F8</Tag>
                <Text className="text-slate-400">Valider</Text>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="bg-slate-700 text-slate-300 border-none">Esc</Tag>
                <Text className="text-slate-400">Annuler</Text>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="bg-slate-700 text-slate-300 border-none">F12</Tag>
                <Text className="text-slate-400">Imprimer</Text>
              </div>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}

export default NouvelleVenteCaisse;
