import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActionIcon,
  NumberInput,
  Select,
  Text,
} from '@mantine/core';
import { toast } from 'sonner';
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ScanLine, ShoppingCart, Trash2, Plus, Minus,
  Receipt, Printer, Keyboard, PackageSearch,
} from 'lucide-react';
import { VenteCaisseService } from "../../services/vente-caisse.service";
import { ArticleService } from "../../services/article.service";
import { VenteCaisse } from "../../types/vente-caisse";
import useScanDetection from 'use-scan-detection';
import { authclient } from '../../../lib/auth-client';
import { printTicket } from "../../utils/ticketPdf";
import { Card, CardContent } from '../../components/shadcn/card';
import { Button } from '../../components/shadcn/button';
import { Badge } from '../../components/shadcn/badge';
import { Separator } from '../../components/shadcn/separator';
import { formatN } from '../../lib/helpers';

const formatToday = () => {
  const d = new Date();
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${jours[d.getDay()]} ${d.getDate()} ${mois[d.getMonth()]} ${d.getFullYear()} - ${h}:${m}`;
};

function NouvelleVenteCaisse() {
  const { data: session } = authclient.useSession();
  const navigate = useNavigate();

  type ProduitLocal = { nom: string; prixUnitaire: number; quantite: number; ref: string; };
  const [produits, setProduits] = useState<ProduitLocal[]>([]);
  const [searchValue, setSearchValue] = useState('');

  const qc = useQueryClient();
  const venteCaisseService = new VenteCaisseService();
  const articleService = new ArticleService();

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
      printTicket(newVente);
      setProduits([]);
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    }
  });

  useScanDetection({
    onComplete: (code: String) => {
      const codeStr = code.toString();
      const article = articles?.find((a: any) => a.ref === codeStr || a.codeBarre === codeStr);
      if (article) {
        addOrIncrementProduct(article);
        toast.success(`${article.nom} ajouté`);
      } else {
        toast.error(`Produit non trouvé: ${codeStr}`);
      }
    },
    minLength: 3
  });

  const addOrIncrementProduct = (article: any) => {
    const existingIndex = produits.findIndex(p => p.ref === article.ref);
    if (existingIndex !== -1) {
      const updated = [...produits];
      updated[existingIndex].quantite += 1;
      setProduits(updated);
      toast.success(`Quantité de ${article.nom} augmentée`);
    } else {
      setProduits([...produits, {
        ref: article.ref,
        nom: article.nom,
        prixUnitaire: article.prix,
        quantite: 1
      }]);
    }
  };

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

  const handleNewSale = () => setProduits([]);

  const handlePrint = () => {
    if (produits.length === 0) return;
    // Reconstitute a minimal VenteCaisse-like object for printTicket
    const mockVente = {
      _id: 'temp',
      produits: produits.map(p => ({ nom: p.nom, quantite: p.quantite, prixUnitaire: p.prixUnitaire, montant: p.prixUnitaire * p.quantite })),
      montantTotal,
      date: new Date().toISOString(),
    } as any;
    printTicket(mockVente);
  };

  const filteredArticles = articles?.filter((a: any) =>
    a.nom.toLowerCase().includes(searchValue.toLowerCase()) ||
    a.ref.toLowerCase().includes(searchValue.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/ventes-caisse')}>
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Receipt className="h-5 w-5 text-emerald-500" />
              Caisse enregistreuse
            </h2>
            <p className="text-sm text-muted-foreground">{formatToday()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="info" className="gap-1.5 px-3 py-1.5 text-sm">
            <ShoppingCart className="h-4 w-4" />
            {nombreArticles} article{nombreArticles > 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Section Gauche — Recherche + Panier */}
        <div className="space-y-4 lg:col-span-2">
          {/* Recherche */}
          <Card>
            <CardContent className="p-4 md:p-5">
              <div className="mb-3 flex items-center gap-2">
                <ScanLine className="h-5 w-5 text-primary" />
                <Text fw={600} size="sm" className="text-foreground">Scanner ou rechercher un produit</Text>
              </div>
              <Select
                searchable
                placeholder="Tapez le nom ou scannez le code-barres..."
                size="sm"
                radius={8}
                value={null}
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                filter={({ options }) => options}
                nothingFoundMessage="Aucun produit trouvé"
                leftSection={<ScanLine className="h-4 w-4 text-muted-foreground" />}
                data={filteredArticles.slice(0, 10).map((a: any) => ({
                  value: a._id,
                  label: a.nom,
                  article: a,
                })) as any}
                onChange={(value) => {
                  const article = articles?.find((a: any) => a._id === value);
                  if (article) {
                    addOrIncrementProduct(article);
                    setSearchValue('');
                  }
                }}
                renderOption={({ option }: any) => (
                  <div className="flex w-full items-center justify-between py-1">
                    <div>
                      <span className="font-medium text-foreground">{option.article?.nom}</span>
                      <span className="ml-2 text-xs text-muted-foreground">({option.article?.ref})</span>
                    </div>
                    <Badge variant="pos" className="num">{formatN(option.article?.prix)} F</Badge>
                  </div>
                )}
              />
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <PackageSearch className="h-3.5 w-3.5" />
                Scannez un code-barres ou tapez le nom du produit
              </p>
            </CardContent>
          </Card>

          {/* Panier */}
          <Card>
            <CardContent className="p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <Text fw={600} size="sm" className="text-foreground">
                  Panier ({produits.length} produit{produits.length > 1 ? 's' : ''})
                </Text>
                {produits.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setProduits([])}>
                    <Trash2 className="h-3.5 w-3.5" />
                    Vider
                  </Button>
                )}
              </div>

              {produits.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-base font-medium text-foreground">Panier vide</p>
                  <p className="mt-1 text-sm text-muted-foreground">Scannez ou recherchez des produits</p>
                </div>
              ) : (
                <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
                  {produits.map((prod, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40"
                    >
                      <div className="min-w-0 flex-1">
                        <Text fw={600} size="sm" className="block truncate text-foreground">{prod.nom}</Text>
                        <Text size="xs" className="num text-muted-foreground">
                          {formatN(prod.prixUnitaire)} F × {prod.quantite}
                        </Text>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Quantity stepper */}
                        <div className="flex items-center rounded-lg border border-border bg-muted">
                          <ActionIcon variant="subtle" color="gray" onClick={() => updateQuantity(index, -1)} disabled={prod.quantite <= 1}>
                            <Minus className="h-3.5 w-3.5" />
                          </ActionIcon>
                          <NumberInput
                            min={1}
                            value={prod.quantite}
                            onChange={(val) => setQuantity(index, typeof val === 'number' ? val : (val ? Number(val) : 1))}
                            hideControls
                            variant="unstyled"
                            className="num w-14 text-center text-sm font-semibold text-foreground"
                          />
                          <ActionIcon variant="subtle" color="gray" onClick={() => updateQuantity(index, 1)}>
                            <Plus className="h-3.5 w-3.5" />
                          </ActionIcon>
                        </div>
                        {/* Line total */}
                        <div className="num w-28 text-right text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {formatN(prod.prixUnitaire * prod.quantite)} F
                        </div>
                        <ActionIcon variant="subtle" color="red" onClick={() => removeProduct(index)}>
                          <Trash2 className="h-4 w-4" />
                        </ActionIcon>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section Droite — Récapitulatif + Actions */}
        <div className="space-y-4">
          {/* Récapitulatif */}
          <Card className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white">
            <CardContent className="p-4 md:p-5">
              <h4 className="mb-4 flex items-center gap-2 text-sm font-bold text-white">
                <Receipt className="h-4 w-4 text-emerald-400" />
                Récapitulatif
              </h4>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 py-2">
                  <span className="text-sm text-slate-400">Sous-total</span>
                  <span className="num text-lg font-medium text-white">{formatN(montantTotal)} F</span>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-center">
                  <p className="mb-1 text-xs uppercase tracking-wider text-emerald-100">Total à payer</p>
                  <p className="num text-3xl font-extrabold text-white">{formatN(montantTotal)}</p>
                  <p className="text-sm text-emerald-100">FCFA</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              size="lg"
              className="h-14 w-full text-base font-bold"
              onClick={handleValidate}
              disabled={produits.length === 0}
            >
              {loadingCreate ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                  Validation…
                </span>
              ) : (
                <>
                  <Receipt className="h-5 w-5" />
                  Valider ({formatN(montantTotal)} F)
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="lg" onClick={handleNewSale} disabled={produits.length === 0}>
                <Trash2 className="h-4 w-4" />
                Annuler
              </Button>
              <Button variant="outline" size="lg" onClick={handlePrint} disabled={produits.length === 0}>
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
            </div>
          </div>

          {/* Raccourcis clavier */}
          <Card>
            <CardContent className="p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Keyboard className="h-3.5 w-3.5" />
                Raccourcis clavier
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'F2', action: 'Rechercher' },
                  { key: 'F8', action: 'Valider' },
                  { key: 'Esc', action: 'Annuler' },
                  { key: 'F12', action: 'Imprimer' },
                ].map((s) => (
                  <div key={s.key} className="flex items-center gap-2">
                    <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground">
                      {s.key}
                    </kbd>
                    <span className="text-muted-foreground">{s.action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default NouvelleVenteCaisse;
