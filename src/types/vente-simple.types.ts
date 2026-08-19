export type VenteSimple = {
  _id: string;
  ref: string;
  montant: number;
  date: string;
  note?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type JourBucket = {
  jour: string;
  total: number;
  count: number;
};

export type Periode = 'jour' | 'semaine' | 'mois' | 'custom';

export type TotauxResultat = {
  periode: Periode;
  from: string;
  to: string;
  total: number;
  count: number;
  parJour: JourBucket[];
};

export type CreateVenteSimpleDto = {
  montant: number;
  note?: string;
};

export type UpdateVenteSimpleDto = {
  montant?: number;
  note?: string;
};
