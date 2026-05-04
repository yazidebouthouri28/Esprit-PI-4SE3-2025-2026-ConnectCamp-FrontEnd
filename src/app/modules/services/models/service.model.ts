export interface Service {
    id: number;
    name: string;
    description: string;
    price: number;
    type: string;
    available: boolean;
    campingId?: number;
    targetRole?: 'USER' | 'ORGANIZER';
    images?: string[];
    isActive?: boolean;
    isCamperOnly?: boolean;
    isOrganizerService?: boolean;
}
