import Api from "./Api";
import { Service } from "./Service";

export interface DetteFournisseur {
  _id?: string;
  montant: number;
  date: Date | string;
  fournisseur: string;
}

export class DetteFournisseurService extends Service {
  constructor() {
    super(Api, 'dette-fournisseur');
  }

  async findByFournisseur(id: string) {
    return this.api.get(`/${this.ressource}/by/${id}`).then(res => res.data);
  }

  async getByUser(id: string) {
    return this.api.get(`/${this.ressource}/user/${id}`).then(res => res.data);
  }

  async getAllWithTotalPaiements() {
    return this.api.get(`/${this.ressource}/all-with-total`).then(res => res.data);
  }
}