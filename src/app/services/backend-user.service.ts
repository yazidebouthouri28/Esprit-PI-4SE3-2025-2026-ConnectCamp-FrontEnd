import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UserDTO {
    id: number;
    name: string;
    username: string;
    email: string;
    phone: string;
    role: string;
    isActive: boolean;
    avatar: string;
    createdAt: string;
}

export interface PageResponse<T> {
    content: T[];
    pageNumber: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    last: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

@Injectable({
    providedIn: 'root'
})
export class BackendUserService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/users`;

    private getHeaders() {
        const token = localStorage.getItem('token');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    getAllUsers(): Observable<ApiResponse<UserDTO[]>> {
        return this.http.get<ApiResponse<UserDTO[]>>(this.apiUrl, { headers: this.getHeaders() });
    }

    getActiveUsers(page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<UserDTO>>> {
        const params = new HttpParams().set('page', page).set('size', size);
        return this.http.get<ApiResponse<PageResponse<UserDTO>>>(`${this.apiUrl}/active`, { headers: this.getHeaders(), params });
    }

    searchUsers(keyword: string, page: number = 0, size: number = 10): Observable<ApiResponse<PageResponse<UserDTO>>> {
        const params = new HttpParams().set('keyword', keyword).set('page', page).set('size', size);
        return this.http.get<ApiResponse<PageResponse<UserDTO>>>(`${this.apiUrl}/search`, { headers: this.getHeaders(), params });
    }

    suspendUser(id: number, reason: string): Observable<ApiResponse<UserDTO>> {
        const params = new HttpParams().set('reason', reason);
        return this.http.post<ApiResponse<UserDTO>>(`${this.apiUrl}/${id}/suspend`, {}, { headers: this.getHeaders(), params });
    }

    unsuspendUser(id: number): Observable<ApiResponse<UserDTO>> {
        return this.http.post<ApiResponse<UserDTO>>(`${this.apiUrl}/${id}/unsuspend`, {}, { headers: this.getHeaders() });
    }

    updateUserRole(id: number, role: string): Observable<ApiResponse<UserDTO>> {
        const params = new HttpParams().set('role', role);
        return this.http.put<ApiResponse<UserDTO>>(`${this.apiUrl}/${id}/role`, {}, { headers: this.getHeaders(), params });
    }
}
