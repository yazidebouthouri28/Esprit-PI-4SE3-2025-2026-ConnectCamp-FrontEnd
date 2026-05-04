export interface Alerte {
    id: number;
    title: string;
    description: string;
    emergencyType: 'FIRE' | 'MEDICAL' | 'SECURITY' | 'WEATHER' | 'OTHER';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
    location: string;
    latitude?: number;
    longitude?: number;
    reportedBy: string;
    reportedById?: number;
    reportedByName?: string;
    reportedAt: Date | string;
    siteId?: number;
    siteName?: string;
    // Keeping 'type' for legacy compatibility if needed, but aligning with 'emergencyType'
    type: 'FIRE' | 'MEDICAL' | 'SECURITY' | 'WEATHER' | 'OTHER';
}

/** DTO retourné par GET /api/emergency-alerts/stats/with-interventions */
export interface AlertWithInterventionStats {
    alertId: number;
    alertCode: string;
    title: string;
    emergencyType: string;
    severity: string;
    status: string;
    siteName: string;
    reportedByName: string;
    interventionCount: number;
    reportedAt: Date | string;
}

/** DTO retourné par GET /api/emergency-alerts/risk-score/{siteId} */
export interface SiteRiskScore {
    siteId: number;
    siteName: string;
    riskScore: number;
    riskLevel: 'SAFE' | 'WATCH' | 'DANGER' | 'CRITICAL';
    activeAlertCount: number;
    criticalAlertCount: number;
    unacknowledgedCount: number;
    lastAlertAt: Date | string | null;
}

/** DTO retourné par GET /api/emergency-alerts/intervention-efficiency */
export interface InterventionEfficiency {
    emergencyType: string;
    totalAlerts: number;
    totalInterventions: number;
    avgResponseMinutes: number | null;
    resolutionRate: number;
    avgInterventionsPerAlert: number;
}

/** ML response from POST /api/emergency-alerts/{id}/ml/predict */
export interface EmergencyMLResponse {
    predictedSeverity?: string;
    confidence?: number;
    probabilities?: { [key: string]: number };
    predictedMinutes?: number;
    confidenceRange?: { min: number; max: number };
    inputSummary?: { [key: string]: any };
    error: boolean;
    errorMessage?: string;
}

/** NASA EONET v3 natural event */
export interface EonetEvent {
    id: string;
    title: string;
    description?: string;
    link: string;
    categories: { id: string; title: string }[];
    geometry: {
        date: string;
        type: string;
        coordinates: number[];
    }[];
}
