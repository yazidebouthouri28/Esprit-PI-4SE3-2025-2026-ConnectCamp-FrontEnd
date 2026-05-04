export enum StatutCandidature {
    EN_ATTENTE = 'EN_ATTENTE',
    ACCEPTEE = 'ACCEPTEE',
    REJETEE = 'REJETEE',
    ANNULEE = 'ANNULEE',
    RETIREE = 'RETIREE'
}

export interface Candidature {
    id: number;
    numeroCandidature?: string;
    lettreMotivation: string;
    experiencePertinente?: string;
    competences?: string[];
    statut: StatutCandidature;
    notesEvaluation?: string;
    dateDecision?: string;
    candidatId?: number;
    candidatName?: string;
    eventServiceId?: number;
    eventServiceName?: string;
    createdAt?: string;
    scoreEvaluation?: number;
    aiCompatibilitySummary?: string;
    aiRecommendation?: string;
    isSuspicious?: boolean;

    // Legacy fields for compatibility during transition
    userId?: string | number;
    status?: string;
    appliedDate?: Date | string;
    serviceId?: number;
    motivation?: string;
    eventId?: number;
}
