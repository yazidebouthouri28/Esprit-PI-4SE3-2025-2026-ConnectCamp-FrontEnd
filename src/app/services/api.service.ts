import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getAll(endpoint: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${endpoint}`);
  }

  create(endpoint: string, body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/${endpoint}`, body);
  }

  update(endpoint: string, id: number, body: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${endpoint}/${id}`, body);
  }

  delete(endpoint: string, id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${endpoint}/${id}`);
  }
}