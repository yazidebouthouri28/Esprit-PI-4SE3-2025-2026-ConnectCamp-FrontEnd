// EXAMPLE: How to integrate ML into Reservation Management
// Add this to your existing reservation-detail.component.ts or reservation-view.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CancellationRiskBadgeComponent } from '../components/ml/cancellation-risk-badge/cancellation-risk-badge.component';
import { RevenuePredictionComponent } from '../components/ml/revenue-prediction/revenue-prediction.component';

@Component({
  selector: 'app-reservation-management-ml-example',
  standalone: true,
  imports: [CommonModule, CancellationRiskBadgeComponent, RevenuePredictionComponent],
  template: `
    <div class="reservation-management-page">
      <!-- Existing Reservation Info -->
      <div class="reservation-header">
        <h2>Reservation #{{ reservationId }}</h2>
        <span class="status-badge">{{ reservationStatus }}</span>
      </div>
      
      <div class="reservation-details">
        <div class="detail-row">
          <label>Guest:</label>
          <span>{{ guestName }}</span>
        </div>
        <div class="detail-row">
          <label>Campsite:</label>
          <span>{{ campsiteName }}</span>
        </div>
        <div class="detail-row">
          <label>Dates:</label>
          <span>{{ checkIn }} - {{ checkOut }}</span>
        </div>
      </div>
      
      <!-- ML FEATURE 1: Cancellation Risk - Integrated into reservation details -->
      <div class="ml-section cancellation-section">
        <h3><i class="fas fa-exclamation-triangle"></i> Risk Assessment</h3>
        <app-cancellation-risk-badge 
          [reservationId]="reservationId">
        </app-cancellation-risk-badge>
      </div>
      
      <!-- ML FEATURE 2: Revenue Prediction - Integrated into financial section -->
      <div class="ml-section revenue-section">
        <h3><i class="fas fa-chart-line"></i> Revenue Forecast</h3>
        <app-revenue-prediction 
          [reservationId]="reservationId">
        </app-revenue-prediction>
      </div>
      
      <!-- Existing Actions -->
      <div class="actions">
        <button class="btn-confirm">Confirm</button>
        <button class="btn-cancel">Cancel</button>
        <button class="btn-modify">Modify</button>
      </div>
    </div>
  `,
  styles: [`
    .reservation-management-page {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .reservation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .ml-section {
      margin: 20px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 12px;
    }
    
    .ml-section h3 {
      margin: 0 0 15px 0;
      color: #333;
    }
  `]
})
export class ReservationManagementMlExampleComponent {
  reservationId = 123;
  reservationStatus = 'PENDING';
  guestName = 'John Doe';
  campsiteName = 'Camping Lac';
  checkIn = '2025-06-15';
  checkOut = '2025-06-20';
}
