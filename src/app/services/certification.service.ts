import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Certification, CertificationItem } from '../models/camping.models';

type BackendCertificationStatus =
    | 'PENDING'
    | 'UNDER_REVIEW'
    | 'CERTIFIED'
    | 'REJECTED'
    | 'EXPIRED'
    | 'REVOKED'
    | 'SUSPENDED'
    | 'APPROVED';

interface CertificationApiResponse {
    id: number;
    certificationCode?: string;
    title?: string;
    description?: string;
    issuingOrganization?: string;
    issueDate?: string;
    expirationDate?: string;
    status?: BackendCertificationStatus;
    documentUrl?: string;
    verificationUrl?: string;
    score?: number;
    siteId?: number;
    items?: CertificationItemApiResponse[];
}

interface CertificationApiRequest {
    title: string;
    description?: string;
    issuingOrganization: string;
    issueDate: string;
    expirationDate?: string;
    documentUrl?: string;
    verificationUrl?: string;
    score?: number;
    siteId: number;
}

interface CertificationItemApiResponse {
    id: number;
    name?: string;
    description?: string;
    score?: number;
    requiredScore?: number;
    passed?: boolean;
    completedAt?: string;
    criteriaName?: string;
    comment?: string;
    certificationId?: number;
}

interface CertificationItemApiRequest {
    name: string;
    description?: string;
    score: number;
    requiredScore: number;
    passed?: boolean;
    completedAt?: string;
    criteriaName: string;
    comment?: string;
    certificationId: number;
}

@Injectable({
    providedIn: 'root'
})
export class CertificationService {
    private certUrl = `${environment.apiUrl}/api/certifications`;
    private itemUrl = `${environment.apiUrl}/api/certification-items`;

    constructor(private http: HttpClient) { }

    getCertificationsBySite(siteId: number): Observable<Certification[]> {
        return this.http.get<any>(`${this.certUrl}/site/${siteId}`).pipe(
            map((res) => {
                const certifications = res.data ? res.data : res;
                if (!Array.isArray(certifications)) return [];
                return certifications.map((cert: any) => this.fromCertificationApi(cert, siteId));
            })
        );
    }

    createCertification(siteId: number, cert: Partial<Certification>): Observable<Certification> {
        const payload: CertificationApiRequest = {
            title: cert.title ?? 'Campsite Certification',
            description: cert.description,
            issuingOrganization: cert.issuingOrganization ?? 'Admin Inspection Team',
            issueDate: this.toDateOnlyString(cert.issueDate),
            expirationDate: cert.expirationDate ? this.toDateOnlyString(cert.expirationDate) : undefined,
            documentUrl: cert.documentUrl,
            verificationUrl: cert.verificationUrl,
            score: cert.score ?? 0,
            siteId
        };

        return this.http.post<any>(`${this.certUrl}/site/${siteId}`, payload).pipe(
            map((res) => {
                const created = res.data ? res.data : res;
                return this.fromCertificationApi(created, siteId);
            })
        );
    }

    updateCertificationStatus(id: number, status: string): Observable<Certification> {
        const backendStatus = this.toBackendStatus(status);
        const params = new HttpParams().set('status', backendStatus);

        return this.http.put<any>(`${this.certUrl}/${id}/status`, null, { params }).pipe(
            map((res) => {
                const updated = res.data ? res.data : res;
                return this.fromCertificationApi(updated, updated.siteId ?? 0);
            })
        );
    }

    deleteCertification(id: number): Observable<void> {
        return this.http.delete<void>(`${this.certUrl}/${id}`);
    }

    updateItemScore(itemId: number, score: number): Observable<CertificationItem> {
        return this.http.patch<CertificationItemApiResponse>(
            `${this.itemUrl}/${itemId}`,
            { score }
        ).pipe(map((updated) => this.fromItemApi(updated, updated.certificationId ?? 0)));
    }

    // Items
    addCertificationItem(item: Partial<CertificationItem> & { certificationId: number }): Observable<CertificationItem> {
        const payload: CertificationItemApiRequest = {
            name: item.name || `${item.criteriaName ?? 'CRITERIA'} Item`,
            description: item.description,
            score: item.score ?? 0,
            requiredScore: item.requiredScore ?? 7,
            passed: item.passed,
            completedAt: item.completedAt ? new Date(item.completedAt).toISOString() : undefined,
            criteriaName: item.criteriaName ?? 'SAFETY',
            comment: item.comment ?? '',
            certificationId: item.certificationId
        };

        return this.http.post<CertificationItemApiResponse>(`${this.itemUrl}/certification/${item.certificationId}`, payload).pipe(
            map((created) => this.fromItemApi(created, item.certificationId))
        );
    }

    private fromCertificationApi(cert: CertificationApiResponse, fallbackSiteId: number): Certification {
        return {
            id: cert.id,
            certificationCode: cert.certificationCode,
            title: cert.title ?? '',
            description: cert.description ?? '',
            issuingOrganization: cert.issuingOrganization ?? '',
            issueDate: cert.issueDate ?? '',
            expirationDate: cert.expirationDate ?? '',
            status: this.fromBackendStatus(cert.status ?? 'PENDING'),
            score: cert.score ?? 0,
            documentUrl: cert.documentUrl ?? '',
            verificationUrl: cert.verificationUrl ?? '',
            siteId: cert.siteId ?? fallbackSiteId,
            items: (cert.items ?? []).map((item) => this.fromItemApi(item, cert.id))
        };
    }

    private fromItemApi(item: CertificationItemApiResponse, fallbackCertificationId: number): CertificationItem {
        return {
            id: item.id,
            name: item.name ?? '',
            description: item.description ?? '',
            criteriaName: this.toCriteriaName(item.criteriaName),
            score: item.score ?? 0,
            requiredScore: item.requiredScore ?? 0,
            passed: item.passed ?? false,
            comment: item.comment ?? '',
            completedAt: item.completedAt ?? '',
            certificationId: item.certificationId ?? fallbackCertificationId
        };
    }

    private toDateOnlyString(value?: Date | string): string {
        if (!value) {
            return new Date().toISOString().slice(0, 10);
        }
        const date = value instanceof Date ? value : new Date(value);
        return date.toISOString().slice(0, 10);
    }

    private toBackendStatus(status: string): BackendCertificationStatus {
        if (status === 'APPROVED') {
            return 'CERTIFIED';
        }
        return (status as BackendCertificationStatus) ?? 'PENDING';
    }

    private fromBackendStatus(status: BackendCertificationStatus): Certification['status'] {
        if (status === 'CERTIFIED') {
            return 'APPROVED';
        }
        return status as Certification['status'];
    }

    private toCriteriaName(value?: string): CertificationItem['criteriaName'] {
        const allowed: CertificationItem['criteriaName'][] = [
            'SAFETY',
            'CLEANLINESS',
            'EQUIPMENT',
            'SERVICES',
            'PRICE',
            'RATING',
            'DISTANCE',
            'CAPACITY',
            'DATE',
            'AVAILABILITY',
            'POPULARITY',
            'CATEGORY',
            'LOCATION'
        ];

        if (value && allowed.includes(value as CertificationItem['criteriaName'])) {
            return value as CertificationItem['criteriaName'];
        }
        return 'SAFETY';
    }
}
