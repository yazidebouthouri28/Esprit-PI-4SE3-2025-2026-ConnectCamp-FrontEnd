export interface Intervention {
    id: number;
    alerteId: number;
    agentId: string;
    description: string;
    startTime: Date | string;
    endTime?: Date | string;
    status: 'ON_THE_WAY' | 'ON_SITE' | 'COMPLETED';
}
