export type VenteCaisseProduit = {
  nom: string;
  quantite: number;
  prixUnitaire: number;
  montant: number;
};

export type VenteCaisse = {
  _id: string;
  numero?: string;
  produits: VenteCaisseProduit[];
  montantTotal: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateVenteCaisseDto = {
  produits: VenteCaisseProduit[];
  montantTotal: number;
  date: string;
};

export type UpdateVenteCaisseDto = Partial<CreateVenteCaisseDto>;
