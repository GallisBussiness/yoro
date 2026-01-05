import Api from "./Api";
import { Service } from "./Service";

export class PaiementDetteFournisseurService extends Service {
  constructor() {
    super(Api, 'paiement-dette-fournisseur');
  }

  async getByUser(id: string) {
    return this.api.get(`/${this.ressource}/user/${id}`).then(res => res.data);
  }

  async byDette(id: string) {
    return this.api.get(`/${this.ressource}/bydette/${id}`).then(res => res.data);
  }
}
