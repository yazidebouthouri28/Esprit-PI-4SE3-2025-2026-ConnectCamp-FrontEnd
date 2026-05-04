import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserMlService, BestTimeToBookResponse, MonthlyForecast } from '../../../services/user-ml.service';

@Component({
  selector: 'app-best-time-to-book',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="best-time-widget">
      <div class="widget-header">
        <i class="fas fa-calendar-alt"></i>
        <span>📅 Best Time to Book</span>
        <span class="ai-badge">AI</span>
      </div>
      
      <div class="current-price-section">
        <span class="label">Current price:</span>
        <span class="price">{{ currentPrice }} DT</span>
        <span class="per-night">/night</span>
      </div>
      
      <div class="recommendation-banner" *ngIf="bestTimeData">
        <div class="urgency-indicator" [class.high]="bestTimeData.urgencyLevel === 'high'" 
             [class.medium]="bestTimeData.urgencyLevel === 'medium'">
          <i class="fas" [class.fa-exclamation-circle]="bestTimeData.urgencyLevel === 'high'"
             [class.fa-clock]="bestTimeData.urgencyLevel === 'medium'"
             [class.fa-check-circle]="bestTimeData.urgencyLevel === 'low'"></i>
          <span>{{ getUrgencyText(bestTimeData.urgencyLevel) }}</span>
        </div>
        
        <p class="ai-summary">{{ bestTimeData.recommendationSummary }}</p>
        
        <div class="savings-highlight" *ngIf="bestTimeData.savingsOpportunity > 0">
          <i class="fas fa-piggy-bank"></i>
          <span>💰 Save up to <strong>{{ bestTimeData.savingsOpportunity | number:'1.0-0' }} DT</strong></span>
        </div>
      </div>
      
      <div class="months-comparison" *ngIf="bestTimeData">
        <div class="best-months">
          <h5><i class="fas fa-thumbs-up"></i> Best months</h5>
          <div class="month-cards">
            <div *ngFor="let month of bestTimeData.bestMonthsToBook.slice(0, 3)" 
                 class="month-card best">
              <div class="month-name">{{ month.monthName }}</div>
              <div class="month-price">{{ month.predictedPrice | number:'1.0-0' }} DT</div>
              <div class="savings-badge" *ngIf="month.priceChangePercent < 0">
                {{ month.priceChangePercent | number:'1.0-0' }}%
              </div>
              <div class="demand-badge" [class.low]="month.demandLevel === 'low'"
                   [class.medium]="month.demandLevel === 'medium'"
                   [class.high]="month.demandLevel === 'high'">
                {{ getDemandLabel(month.demandLevel) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="worst-months">
          <h5><i class="fas fa-thumbs-down"></i> Avoid</h5>
          <div class="month-cards">
            <div *ngFor="let month of bestTimeData.worstMonthsToAvoid.slice(0, 2)" 
                 class="month-card worst">
              <div class="month-name">{{ month.monthName }}</div>
              <div class="month-price">{{ month.predictedPrice | number:'1.0-0' }} DT</div>
              <div class="increase-badge" *ngIf="month.priceChangePercent > 0">
                +{{ month.priceChangePercent | number:'1.0-0' }}%
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="ai-confidence">
        <i class="fas fa-robot"></i>
        <span>Forecast based on seasonality and demand analysis</span>
      </div>
      
      <div class="loading-state" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>AI is analyzing price trends...</p>
      </div>
    </div>
  `,
  styles: [`
    .best-time-widget {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      border-radius: 16px;
      padding: 20px;
      color: white;
    }
    
    .widget-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.1em;
      font-weight: 600;
      margin-bottom: 15px;
    }
    
    .ai-badge {
      background: rgba(255,255,255,0.2);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7em;
      margin-left: auto;
    }
    
    .current-price-section {
      background: rgba(255,255,255,0.1);
      padding: 12px 15px;
      border-radius: 10px;
      margin-bottom: 15px;
    }
    
    .label {
      font-size: 0.9em;
      opacity: 0.9;
    }
    
    .price {
      font-size: 1.5em;
      font-weight: 700;
      margin-left: 10px;
    }
    
    .per-night {
      font-size: 0.8em;
      opacity: 0.8;
    }
    
    .recommendation-banner {
      background: rgba(255,255,255,0.95);
      color: #333;
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .urgency-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      margin-bottom: 10px;
      color: #27ae60;
    }
    
    .urgency-indicator.high {
      color: #e74c3c;
    }
    
    .urgency-indicator.medium {
      color: #f39c12;
    }
    
    .ai-summary {
      font-size: 0.95em;
      line-height: 1.5;
      margin: 0 0 10px 0;
    }
    
    .savings-highlight {
      background: #d4edda;
      padding: 10px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #155724;
    }
    
    .savings-highlight i {
      font-size: 1.3em;
    }
    
    .months-comparison {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 15px;
    }
    
    .best-months h5, .worst-months h5 {
      margin: 0 0 10px 0;
      font-size: 0.9em;
      opacity: 0.9;
    }
    
    .month-cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .month-card {
      background: rgba(255,255,255,0.9);
      color: #333;
      border-radius: 10px;
      padding: 12px;
      position: relative;
    }
    
    .month-card.best {
      border-left: 4px solid #27ae60;
    }
    
    .month-card.worst {
      border-left: 4px solid #e74c3c;
      opacity: 0.9;
    }
    
    .month-name {
      font-weight: 600;
      font-size: 0.9em;
    }
    
    .month-price {
      font-size: 1.2em;
      font-weight: 700;
      color: #11998e;
    }
    
    .savings-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #27ae60;
      color: white;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.75em;
      font-weight: 600;
    }
    
    .increase-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #e74c3c;
      color: white;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.75em;
      font-weight: 600;
    }
    
    .demand-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.7em;
      margin-top: 5px;
    }
    
    .demand-badge.low {
      background: #d4edda;
      color: #155724;
    }
    
    .demand-badge.medium {
      background: #fff3cd;
      color: #856404;
    }
    
    .demand-badge.high {
      background: #f8d7da;
      color: #721c24;
    }
    
    .ai-confidence {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255,255,255,0.2);
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8em;
      opacity: 0.9;
    }
    
    .loading-state {
      text-align: center;
      padding: 30px;
    }
    
    .loading-state i {
      font-size: 2em;
      margin-bottom: 10px;
    }
  `]
})
export class BestTimeToBookComponent implements OnInit {
  @Input() siteId: number = 1;
  @Input() currentPrice: number = 50;
  @Input() desiredMonth: number = new Date().getMonth() + 1;

  bestTimeData?: BestTimeToBookResponse;
  loading = true;

  constructor(private userMlService: UserMlService) {}

  ngOnInit() {
    this.loadBestTimeData();
  }

  loadBestTimeData() {
    this.loading = true;
    this.userMlService.getBestTimeToBook(this.siteId, this.currentPrice, this.desiredMonth)
      .subscribe({
        next: (response) => {
          this.bestTimeData = response;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading best time data:', err);
          this.loading = false;
        }
      });
  }

  getUrgencyText(level: string): string {
    switch(level) {
      case 'high': return '⚡ Book now!';
      case 'medium': return '⏰ Prices rising soon';
      case 'low': return '✅ No urgency';
      default: return '';
    }
  }

  getDemandLabel(level: string): string {
    switch(level) {
      case 'low': return 'Low demand';
      case 'medium': return 'Medium demand';
      case 'high': return 'High demand';
      default: return '';
    }
  }
}
