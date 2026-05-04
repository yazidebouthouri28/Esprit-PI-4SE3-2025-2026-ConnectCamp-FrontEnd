import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MlIntegrationService, CancellationRiskResponse } from '../../../services/ml-integration.service';

@Component({
  selector: 'app-cancellation-risk-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="risk-container" *ngIf="riskData">
      <div class="risk-header" [ngClass]="'risk-' + riskData.riskLevel.toLowerCase()">
        <i class="fas" [ngClass]="getRiskIcon()"></i>
        <span class="risk-label">{{ riskData.riskLevel }} RISK</span>
        <span class="risk-score">{{ riskData.riskScore | percent }}</span>
        <span class="confidence" *ngIf="riskData.confidence > 0">
          ({{ riskData.confidence | percent }} confidence)
        </span>
      </div>
      
      <div class="risk-bar-container">
        <div class="risk-bar">
          <div class="risk-fill" 
               [style.width.%]="riskData.riskScore * 100"
               [ngClass]="'fill-' + riskData.riskLevel.toLowerCase()">
          </div>
        </div>
      </div>
      
      <div class="risk-factors" *ngIf="riskData.featureImportance && riskData.featureImportance.length > 0">
        <h4>Key Factors:</h4>
        <div class="factor-list">
          <div *ngFor="let factor of riskData.featureImportance.slice(0, 3)" 
               class="factor-item">
            <span class="factor-name">{{ factor.feature }}</span>
            <div class="factor-bar">
              <div class="factor-fill" [style.width.%]="factor.impact * 100"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="recommendation" *ngIf="riskData.recommendation">
        <i class="fas fa-lightbulb"></i>
        <span>{{ riskData.recommendation }}</span>
      </div>
      
      <div class="fallback-warning" *ngIf="riskData.usingFallback">
        <i class="fas fa-exclamation-triangle"></i>
        <span>ML service unavailable - using fallback analysis</span>
      </div>
    </div>
    
    <div class="loading" *ngIf="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Analyzing cancellation risk...</span>
    </div>
    
    <div class="error" *ngIf="error">
      <i class="fas fa-exclamation-circle"></i>
      <span>Could not analyze risk</span>
    </div>
  `,
  styles: [`
    .risk-container {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .risk-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      font-weight: 600;
    }
    
    .risk-high { color: #dc3545; }
    .risk-medium { color: #ffc107; }
    .risk-low { color: #28a745; }
    
    .risk-score {
      font-size: 1.2em;
      margin-left: auto;
    }
    
    .confidence {
      font-size: 0.85em;
      color: #666;
      font-weight: normal;
    }
    
    .risk-bar-container {
      margin-bottom: 16px;
    }
    
    .risk-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .risk-fill {
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .fill-high { background: linear-gradient(90deg, #dc3545, #ff6b6b); }
    .fill-medium { background: linear-gradient(90deg, #ffc107, #ffd93d); }
    .fill-low { background: linear-gradient(90deg, #28a745, #5cb85c); }
    
    .risk-factors h4 {
      font-size: 0.9em;
      margin-bottom: 8px;
      color: #495057;
    }
    
    .factor-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .factor-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .factor-name {
      font-size: 0.85em;
      width: 120px;
      color: #666;
    }
    
    .factor-bar {
      flex: 1;
      height: 6px;
      background: #e9ecef;
      border-radius: 3px;
      overflow: hidden;
    }
    
    .factor-fill {
      height: 100%;
      background: #6c757d;
      transition: width 0.3s ease;
    }
    
    .recommendation {
      margin-top: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 6px;
      display: flex;
      gap: 8px;
      align-items: flex-start;
    }
    
    .recommendation i {
      color: #ffc107;
    }
    
    .fallback-warning {
      margin-top: 12px;
      padding: 8px 12px;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      display: flex;
      gap: 8px;
      align-items: center;
      font-size: 0.85em;
      color: #856404;
    }
    
    .loading, .error {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      color: #666;
    }
    
    .error {
      color: #dc3545;
    }
  `]
})
export class CancellationRiskBadgeComponent implements OnInit {
  @Input() reservationId!: number;
  
  riskData: CancellationRiskResponse | null = null;
  loading = true;
  error = false;
  
  constructor(private mlService: MlIntegrationService) {}
  
  ngOnInit() {
    this.loadRiskAnalysis();
  }
  
  loadRiskAnalysis() {
    this.mlService.analyzeCancellationRisk(this.reservationId).subscribe({
      next: (data) => {
        this.riskData = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load cancellation risk:', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
  
  getRiskIcon(): string {
    if (!this.riskData) return 'fa-question-circle';
    
    switch (this.riskData.riskLevel) {
      case 'HIGH': return 'fa-exclamation-triangle';
      case 'MEDIUM': return 'fa-exclamation-circle';
      case 'LOW': return 'fa-check-circle';
      default: return 'fa-question-circle';
    }
  }
}
