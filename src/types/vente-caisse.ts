export type VenteCaisse = {
  _id: string;
  montant: number;
  date: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateVenteCaisseDto = {
  montant: number;
  date: string;
};

export type UpdateVenteCaisseDto = Partial<CreateVenteCaisseDto>;
