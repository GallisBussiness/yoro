import Api from "./Api";
import { Service } from "./Service";

export class PaiementClientService extends Service{
constructor(){
    super(Api,'paiement-client');
}

  async byVente(id:string) {
    return this.api.get(`/${this.ressource}/bydette/${id}`).then(res => res.data);
  }

  async getByUser(id: string) {
    return this.api.get(`/${this.ressource}/user/${id}`).then(res => res.data);
  }

}