export enum ServiceType {
    HEBERGEMENT = 'HEBERGEMENT',
    RESTAURATION = 'RESTAURATION',
    ACTIVITE = 'ACTIVITE',
    LOCATION_EQUIPEMENT = 'LOCATION_EQUIPEMENT',
    TRANSPORT = 'TRANSPORT',
    SANTE_SECURITE = 'SANTE_SECURITE',
    AUTRE = 'AUTRE'
}

export interface CampingService {
    id?: number;
    name: string;
    description: string;
    type: ServiceType;
    price: number;
    pricingUnit?: string;
    providerId?: number;
    providerName?: string;
    siteId?: number;
    siteName?: string;
    images?: string[];
    isActive?: boolean;
    isAvailable?: boolean;
    maxCapacity?: number;
    duration?: string;
    rating?: number;
    reviewCount?: number;
    createdAt?: string;
}

/** ML response from GET /api/camping-services/{id}/ml/predict */
export interface ServiceMLResponse {
    predictedRating?: number;
    ratingLabel?: string;
    predictedDemand?: string;
    demandProbabilities?: { [key: string]: number };
    confidence?: number;
    advice?: string;
    error: boolean;
    errorMessage?: string;
}

export interface CampingServiceRequest {
    name: string;
    description: string;
    type: ServiceType;
    price: number;
    pricingUnit?: string;
    images?: string[];
    isActive?: boolean;
    isAvailable?: boolean;
    maxCapacity?: number;
    duration?: string;
}
