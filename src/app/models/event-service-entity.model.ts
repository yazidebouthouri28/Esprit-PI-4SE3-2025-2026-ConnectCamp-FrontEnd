export interface EventServiceEntity {
    id: number;
    name: string;
    description: string;
    serviceType: string;
    price: number;
    included: boolean;
    optional: boolean;
    quantity: number;
    quantiteRequise: number;
    quantiteAcceptee: number;
    notes: string;
    eventId: number;
    eventTitle?: string;
    serviceId: number;
    serviceName?: string;
    providerId?: number;
    providerName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface EventServiceEntityRequest {
    name: string;
    description?: string;
    serviceType: string;
    price: number;
    included?: boolean;
    optional?: boolean;
    quantiteRequise: number;
    eventId: number;
    serviceId: number;
}
