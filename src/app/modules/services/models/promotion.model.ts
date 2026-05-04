export interface Promotion {
    id?: number;
    name: string; // Used as the Promo Code
    description: string;
    type: string; // e.g., 'PERCENTAGE', 'FIXED_AMOUNT'
    discountValue: number; // e.g., 20 for 20%
    startDate: Date | string;
    endDate: Date | string;
    isActive: boolean;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    maxUsage?: number;
    currentUsage?: number;
    targetAudience?: string;

    // Optional frontend alias properties to avoid breaking existing views immediately,
    // though the components will be updated.
    code?: string; 
    percentage?: number;
    active?: boolean;
}
