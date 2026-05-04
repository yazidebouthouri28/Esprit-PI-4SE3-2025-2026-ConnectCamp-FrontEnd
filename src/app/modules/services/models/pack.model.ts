/** DTO retourné par GET /api/packs/stats/with-services */
export interface PackServiceStats {
    packId: number;
    packName: string;
    packType: string;
    price: number;
    originalPrice?: number;
    siteName: string;
    serviceCount: number;
    totalServicesValue: number;
    discountPercentage: number;
}

/** DTO retourné par GET /api/packs/value-ranking */
export interface PackValueRank {
    rank: number;
    packId: number;
    packName: string;
    packType: string;
    siteName: string;
    packPrice: number;
    totalServicesValue: number;
    savingsAmount: number;
    valueScore: number;
    serviceCount: number;
}

/** Pack dans le résultat du bundle optimizer */
export interface PackOptimizerItem {
    packId: number;
    packName: string;
    packType: string;
    packPrice: number;
    siteName: string;
    serviceCount: number;
    totalServicesValue: number;
    maxPersons: number | null;
    valueScore: number;
    savingsAmount: number;
}

/** DTO retourné par GET /api/packs/bundle-optimizer */
export interface BundleOptimizerResult {
    selectedPacks: PackOptimizerItem[];
    totalPrice: number;
    totalServicesValue: number;
    totalSavings: number;
    budget: number;
    remainingBudget: number;
    persons: number | null;
    packCount: number;
    message: string;
}

export interface Pack {
    id?: number;
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    serviceIds: number[];
    siteId?: number;
    discount: number;
    available: boolean;
    image?: string;
    imageUrl?: string;
    images?: string[];
    promotion?: string;
    season?: string;
    /** Valid values: ADVENTURE, CUSTOM, FAMILY, RELAXATION, PREMIUM, VIP, BASIC, GROUP, STANDARD */
    category?: string;
    score?: number;
    isActive?: boolean;
    serviceNames?: string[];
    serviceCount?: number;
    discountPercentage?: number;
    durationDays?: number;
    maxPersons?: number;
}

/** DTO retourné par GET /api/packs/quality-metrics (AI Quality Advisor) */
export interface PackQuality {
    packId: number;
    packName: string;
    siteName: string;
    siteLocation: string;
    price: number;
    averageRating: number;
    totalReviews: number;
    avgServiceQuality: number;
    avgValueForMoney: number;
    topPros: string[];
    topCons: string[];
    trustScore: number;
}
