import Api from "./Api";
import { Service } from "./Service";
import { VenteSimple, TotauxResultat, CreateVenteSimpleDto, UpdateVenteSimpleDto } from "../types/vente-simple.types";

export class VenteSimpleService extends Service {
  constructor() {
    super(Api, 'vente-simple');
  }

  // Création — ne pas envoyer userId ni date (backend tire userId de la session, date = today)
  async createVente(data: CreateVenteSimpleDto): Promise<VenteSimple> {
    return this.api.post(`/${this.ressource}`, data).then(res => res.data);
  }

  async updateVente(id: string, data: UpdateVenteSimpleDto): Promise<VenteSimple> {
    return this.api.patch(`/${this.ressource}/${id}`, data).then(res => res.data);
  }

  async findAllByRange(from?: string, to?: string): Promise<VenteSimple[]> {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    return this.api.get(`/${this.ressource}`, { params }).then(res => res.data);
  }

  async getTotalJour(): Promise<TotauxResultat> {
    return this.api.get(`/${this.ressource}/total/jour`).then(res => res.data);
  }

  async getTotalSemaine(): Promise<TotauxResultat> {
    return this.api.get(`/${this.ressource}/total/semaine`).then(res => res.data);
  }

  async getTotalMois(): Promise<TotauxResultat> {
    return this.api.get(`/${this.ressource}/total/mois`).then(res => res.data);
  }

  async getTotalByRange(from: string, to: string): Promise<TotauxResultat> {
    return this.api.get(`/${this.ressource}/total`, { params: { from, to } }).then(res => res.data);
  }
}
