export interface Medal {
    id: number;
    name: string;
    icon: string;
    type: string;
}

export interface BadgeRule {
    id: number;
    numero: number;
    regle: string;
}

export interface Badge {
    id: number;
    name: string;
    icon: string;
    medalId: number;
    medalName: string;
    rules: BadgeRule[];
}
