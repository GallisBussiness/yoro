import Api from "./Api";
import { Service } from "./Service";

export interface Dette {
  _id?: string;
  montant: number;
  date: Date | string;
  client: string;
}

export class DetteService extends Service{
constructor(){
    super(Api,'dette');
}

async findByClient(id:string) {
    return this.api.get(`/${this.ressource}/by/${id}`).then(res => res.data);
  }

  async getByUser(id: string) {
    return this.api.get(`/${this.ressource}/user/${id}`).then(res => res.data);
  }
}