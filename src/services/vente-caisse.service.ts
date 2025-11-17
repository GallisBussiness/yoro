import Api from "./Api";
import { Service } from "./Service";

export class VenteCaisseService extends Service{
constructor(){
    super(Api,'vente-caisse');
}

async getByUser(id: string) {
    return this.api.get(`/${this.ressource}/user/${id}`).then(res => res.data);
  }
}
