export enum StatutCandidature {
    EN_ATTENTE = 'EN_ATTENTE',
    ACCEPTEE = 'ACCEPTEE',
    REJETEE = 'REJETEE',
    ANNULEE = 'ANNULEE',
    RETIREE = 'RETIREE'
}

export interface Candidature {
    id?: number;
    numeroCandidature?: string;
    lettreMotivation: string;
    experience?: string;
    competences?: string;
    statut: StatutCandidature;
    notesEvaluation?: string;
    dateDecision?: string;
    candidatId?: number;
    candidatName?: string;
    eventServiceId?: number;
    eventServiceName?: string;
    createdAt?: string;

    // Legacy fields for transition
    motivation?: string;
    status?: string;
    serviceId?: number;
    userId?: string | number;
    appliedDate?: Date | string;
}
