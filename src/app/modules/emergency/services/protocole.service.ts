import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Protocole } from '../models/protocole.model';

@Injectable({
    providedIn: 'root'
})
export class ProtocoleService {
    private apiUrl = `${environment.apiUrl}/api/emergency-protocols`;

    constructor(private http: HttpClient) { }

    getAll(): Observable<Protocole[]> {
        return this.http.get<any>(this.apiUrl).pipe(
            map(response => response.data)
        );
    }

    getById(id: number): Observable<Protocole> {
        return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
            map(response => response.data)
        );
    }

    create(protocole: Protocole): Observable<Protocole> {
        return this.http.post<any>(this.apiUrl, protocole).pipe(
            map(response => response.data)
        );
    }

    update(id: number, protocole: Protocole): Observable<Protocole> {
        return this.http.put<any>(`${this.apiUrl}/${id}`, protocole).pipe(
            map(response => response.data)
        );
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
