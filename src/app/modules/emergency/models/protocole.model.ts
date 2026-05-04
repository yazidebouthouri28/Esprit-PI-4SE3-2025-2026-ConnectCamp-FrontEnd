export interface Protocole {
    id?: number;
    name: string;
    description: string;
    emergencyType: 'FIRE' | 'MEDICAL' | 'SECURITY' | 'WEATHER' | 'EVACUATION' | 'NATURAL_DISASTER' | 'OTHER' | string;
    stepsList: string[];
    steps?: string; // Optional raw steps string
    createdAt?: Date | string;
    updatedAt?: Date | string;
    // Fallback properties for flexible API matching
    title?: string;
    type?: string;
    protocolSteps?: string[];
    isActive?: boolean;
    lastUpdated?: Date | string;
}
