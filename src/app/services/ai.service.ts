import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AiSitrepResponse {
    threatLevel: 'SAFE' | 'WATCH' | 'DANGER' | 'CRITICAL';
    summary: string;
    priorities: string[];
    escalationRisk: number;
    duplicateWarning: string | null;
    recommendedProtocol: string | null;
    alertCount: number;
}

export interface AiPackAdvisorRequest {
    userQuery: string;
    budget?: number;
    persons?: number;
    latitude?: number;
    longitude?: number;
    eonetEvents?: string[];
    siteRiskLevel?: string;
}

export interface AiPackAdvisorResponse {
    offTopic: boolean;
    recommendation: string;
    suggestedPackIds: number[];
    suggestedPackNames: string[];
    totalEstimatedCost: number;
    savingsEstimate: number;
    safetyNote: string | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

@Injectable({ providedIn: 'root' })
export class AiService {
    private base = `${environment.apiUrl}/api/ai`;

    constructor(private http: HttpClient) {}

    generateSitrep(): Observable<AiSitrepResponse> {
        return this.http.post<any>(`${this.base}/sitrep`, {}).pipe(
            map(res => res.data)
        );
    }

    advisePacks(request: AiPackAdvisorRequest): Observable<AiPackAdvisorResponse> {
        return this.http.post<any>(`${this.base}/pack-advisor`, request).pipe(
            map(res => res.data)
        );
    }

    generatePackDescription(name: string, services: string, site: string): Observable<string> {
        const params = { name, services, site };
        return this.http.post<any>(`${this.base}/generate-pack-description`, null, { params }).pipe(
            map(res => res.data)
        );
    }

    analyzeReputation(serviceId: number): Observable<string> {
        return this.http.post<any>(`${this.base}/service-reputation/${serviceId}`, {}).pipe(
            map(res => res.data)
        );
    }

    analyzePackReputation(packId: number): Observable<string> {
        return this.http.post<any>(`${this.base}/pack-reputation/${packId}`, {}).pipe(
            map(res => res.data)
        );
    }

    detectFraud(name: string, bio: string): Observable<boolean> {
        const params = { name, bio };
        return this.http.post<any>(`${this.base}/detect-fraud`, null, { params }).pipe(
            map(res => res.data)
        );
    }

    evaluateCandidate(name: string, bio: string, serviceName: string, serviceDesc: string, eventTitle: string, eventDesc: string): Observable<any> {
        const params = { name, bio, serviceName, serviceDesc, eventTitle, eventDesc };
        return this.http.post<any>(`${this.base}/evaluate-candidate`, null, { params }).pipe(
            map(res => res.data)
        );
    }
}
