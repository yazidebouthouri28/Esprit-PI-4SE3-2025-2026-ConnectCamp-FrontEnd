import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Review } from '../models/camping.models';

interface ReviewApiResponse {
    id: number;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
    userId?: number;
    userName?: string;
    userAvatar?: string;
    targetId?: number;
    createdAt?: string;
}

interface ReviewApiRequest {
    siteId: number;
    rating: number;
    title?: string;
    comment?: string;
    images?: string[];
    userId?: number;
}

@Injectable({
    providedIn: 'root'
})
export class ReviewService {
    private apiUrl = `${environment.apiUrl}/api/reviews`;

    constructor(private http: HttpClient) { }

    getReviewsBySite(siteId: number): Observable<Review[]> {
        return this.http.get<ReviewApiResponse[]>(`${this.apiUrl}/site/${siteId}`).pipe(
            map((reviews) => reviews.map((review) => this.fromApi(review, siteId)))
        );
    }

    /** Service Reviews (AI Sentiment) */
    getReviewsByService(serviceId: number): Observable<any[]> {
        return this.http.get<any>(`${environment.apiUrl}/api/service-reviews/service/${serviceId}`).pipe(
            map(response => response.data.content || [])
        );
    }

    createServiceReview(serviceId: number, userId: number, review: any): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/api/service-reviews/service/${serviceId}?userId=${userId}`, review).pipe(
            map(response => response.data)
        );
    }

    createReview(siteId: number, review: Partial<Review>): Observable<Review> {
        return this.http.post<ReviewApiResponse>(`${this.apiUrl}/site/${siteId}`, this.toApi(siteId, review)).pipe(
            map((created) => this.fromApi(created, siteId))
        );
    }

    updateReview(reviewId: number, siteId: number, review: Partial<Review>): Observable<Review> {
        return this.http.put<ReviewApiResponse>(`${this.apiUrl}/${reviewId}`, this.toApi(siteId, review)).pipe(
            map((updated) => this.fromApi(updated, siteId))
        );
    }

    deleteReview(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }

    private fromApi(review: ReviewApiResponse, fallbackSiteId: number): Review {
        return {
            id: review.id,
            rating: review.rating,
            title: review.title ?? '',
            comment: review.comment ?? '',
            images: review.images ?? [],
            siteId: review.targetId ?? fallbackSiteId,
            userId: review.userId,
            userName: review.userName,
            userAvatar: review.userAvatar,
            createdAt: review.createdAt ?? new Date().toISOString()
        };
    }

    private toApi(siteId: number, review: Partial<Review>): ReviewApiRequest {
        return {
            siteId,
            rating: review.rating ?? 5,
            title: review.title,
            comment: review.comment ?? '',
            images: review.images ?? [],
            userId: review.userId
        };
    }
}
