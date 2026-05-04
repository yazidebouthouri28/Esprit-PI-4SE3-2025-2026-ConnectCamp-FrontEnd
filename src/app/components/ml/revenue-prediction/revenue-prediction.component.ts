import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MlIntegrationService, RevenuePredictionResponse } from '../../../services/ml-integration.service';

@Component({
  selector: 'app-revenue-prediction',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="revenue-prediction-card" *ngIf="prediction">
      <div class="card-header">
        <i class="fas fa-brain"></i>
        <span>AI Revenue Forecast</span>
        <span class="ai-badge">AI</span>
      </div>
      
      <div class="prediction-body">
        <div class="main-prediction">
          <span class="predicted-label">Predicted Total</span>
          <span class="predicted-amount">{{ prediction.predictedRevenue | number:'1.0-0' }} DT</span>
          <span class="confidence-badge" [class.high]="prediction.confidence === 'HIGH'"
                [class.medium]="prediction.confidence === 'MEDIUM'"
                [class.low]="prediction.confidence === 'LOW'">
            {{ prediction.confidence }} Confidence
          </span>
        </div>
        
        <div class="breakdown-section" *ngIf="prediction.breakdown">
          <h5>Revenue Breakdown</h5>
          <div class="breakdown-item">
            <span>Accommodation</span>
            <span>{{ prediction.breakdown.accommodation | number:'1.0-0' }} DT</span>
          </div>
          <div class="breakdown-item">
            <span>Activities</span>
            <span>{{ prediction.breakdown.activities | number:'1.0-0' }} DT</span>
          </div>
          <div class="breakdown-item">
            <span>Equipment</span>
            <span>{{ prediction.breakdown.equipment | number:'1.0-0' }} DT</span>
          </div>
          <div class="breakdown-item">
            <span>Meals</span>
            <span>{{ prediction.breakdown.meals | number:'1.0-0' }} DT</span>
          </div>
        </div>
        
        <div class="factors-section" *ngIf="prediction.keyFactors?.length">
          <h5>Key Factors</h5>
          <div class="factor-tags">
            <span *ngFor="let factor of prediction.keyFactors" class="factor-tag">
              {{ factor }}
            </span>
          </div>
        </div>
        
        <div class="fallback-notice" *ngIf="prediction.usingFallback">
          <i class="fas fa-exclamation-triangle"></i>
          Using fallback calculation - AI model unavailable
        </div>
      </div>
      
      <div class="loading-state" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>AI calculating revenue forecast...</p>
      </div>
    </div>
  `,
  styles: [`
    .revenue-prediction-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-top: 15px;
    }
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      color: #333;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .ai-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.7em;
      margin-left: auto;
    }
    
    .main-prediction {
      text-align: center;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 10px;
      margin-bottom: 15px;
    }
    
    .predicted-label {
      display: block;
      font-size: 0.9em;
      color: #666;
      margin-bottom: 5px;
    }
    
    .predicted-amount {
      display: block;
      font-size: 2em;
      font-weight: 700;
      color: #667eea;
    }
    
    .confidence-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 15px;
      font-size: 0.8em;
      margin-top: 8px;
    }
    
    .confidence-badge.high {
      background: #d4edda;
      color: #155724;
    }
    
    .confidence-badge.medium {
      background: #fff3cd;
      color: #856404;
    }
    
    .confidence-badge.low {
      background: #f8d7da;
      color: #721c24;
    }
    
    .breakdown-section {
      margin-bottom: 15px;
    }
    
    .breakdown-section h5 {
      margin: 0 0 10px 0;
      color: #555;
      font-size: 0.95em;
    }
    
    .breakdown-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f0f0f0;
      font-size: 0.9em;
    }
    
    .breakdown-item:last-child {
      border-bottom: none;
    }
    
    .factors-section h5 {
      margin: 0 0 10px 0;
      color: #555;
      font-size: 0.95em;
    }
    
    .factor-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .factor-tag {
      background: #e9ecef;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8em;
      color: #555;
    }
    
    .fallback-notice {
      margin-top: 15px;
      padding: 10px;
      background: #fff3cd;
      border-radius: 8px;
      font-size: 0.85em;
      color: #856404;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .loading-state {
      text-align: center;
      padding: 30px;
    }
    
    .loading-state i {
      font-size: 1.5em;
      margin-bottom: 10px;
      color: #667eea;
    }
  `]
})
export class RevenuePredictionComponent implements OnInit {
  @Input() reservationId!: number;
  prediction?: RevenuePredictionResponse;
  loading = true;

  constructor(private mlService: MlIntegrationService) {}

  ngOnInit() {
    this.loadPrediction();
  }

  loadPrediction() {
    this.loading = true;
    this.mlService.predictRevenue(this.reservationId)
      .subscribe({
        next: (response) => {
          this.prediction = response;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading revenue prediction:', err);
          this.loading = false;
        }
      });
  }
}
