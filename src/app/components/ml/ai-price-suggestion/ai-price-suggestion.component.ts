import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { MlIntegrationService, PricingOptimizationResponse } from '../../../services/ml-integration.service';

@Component({
  selector: 'app-ai-price-suggestion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="price-suggestion-container" *ngIf="priceData">
      <div class="header">
        <i class="fas fa-robot"></i>
        <h3>AI Pricing Suggestion</h3>
        <span class="confidence-badge" *ngIf="priceData.confidence > 0">
          {{ priceData.confidence | percent }} confidence
        </span>
      </div>
      
      <div class="price-comparison">
        <div class="current-price">
          <span class="label">Current Price</span>
          <span class="value">{{ formatPrice(currentPrice) }}</span>
        </div>
        
        <div class="arrow">
          <i class="fas fa-arrow-right"></i>
        </div>
        
        <div class="suggested-price" [class.higher]="priceData.revenueImpact > 0">
          <span class="label">AI Suggests</span>
          <span class="value">{{ formatPrice(priceData.optimalPrice) }}</span>
          <span class="impact" [class.positive]="priceData.revenueImpact > 0">
            {{ priceData.revenueImpact > 0 ? '+' : '' }}{{ priceData.revenueImpact | number:'1.1-1' }}% revenue
          </span>
        </div>
      </div>
      
      <div class="factors-section" *ngIf="priceData.factors && priceData.factors.length > 0">
        <h4>Why this price?</h4>
        <div class="factor-list">
          <div *ngFor="let factor of priceData.factors" class="factor-item">
            <i class="fas fa-check-circle"></i>
            <div class="factor-info">
              <span class="factor-name">{{ factor.name }}</span>
              <span class="factor-impact">{{ formatImpact(factor.impact) }}</span>
              <span class="factor-explanation">{{ factor.explanation }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="chart-section">
        <h4>6-Month Forecast</h4>
        <canvas id="priceForecastChart"></canvas>
      </div>
      
      <div class="actions">
        <button class="btn-apply" (click)="applySuggestion()" [disabled]="applying">
          <i class="fas fa-check"></i>
          {{ applying ? 'Applying...' : 'Apply Suggested Price' }}
        </button>
        <button class="btn-ignore" (click)="dismiss()">
          Ignore
        </button>
      </div>
      
      <div class="fallback-warning" *ngIf="priceData.usingFallback">
        <i class="fas fa-exclamation-triangle"></i>
        <span>AI service unavailable - using fallback pricing</span>
      </div>
    </div>
    
    <div class="loading" *ngIf="loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>AI is analyzing optimal pricing...</span>
    </div>
    
    <div class="error" *ngIf="error">
      <i class="fas fa-exclamation-circle"></i>
      <span>Could not load pricing suggestion</span>
    </div>
  `,
  styles: [`
    .price-suggestion-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .header i {
      font-size: 1.5em;
      color: #6c5ce7;
    }
    
    .header h3 {
      margin: 0;
      flex: 1;
    }
    
    .confidence-badge {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
    }
    
    .price-comparison {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 24px;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .current-price, .suggested-price {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .label {
      font-size: 0.85em;
      color: #6c757d;
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 1.8em;
      font-weight: 700;
      color: #495057;
    }
    
    .suggested-price .value {
      color: #6c5ce7;
    }
    
    .suggested-price.higher .value {
      color: #00b894;
    }
    
    .impact {
      font-size: 0.85em;
      margin-top: 4px;
    }
    
    .impact.positive {
      color: #00b894;
    }
    
    .arrow {
      color: #adb5bd;
      font-size: 1.2em;
    }
    
    .factors-section h4 {
      font-size: 0.95em;
      margin-bottom: 12px;
      color: #495057;
    }
    
    .factor-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .factor-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .factor-item i {
      color: #00b894;
      margin-top: 2px;
    }
    
    .factor-info {
      display: flex;
      flex-direction: column;
    }
    
    .factor-name {
      font-weight: 600;
      color: #495057;
    }
    
    .factor-impact {
      color: #00b894;
      font-weight: 600;
      font-size: 0.9em;
    }
    
    .factor-explanation {
      font-size: 0.85em;
      color: #6c757d;
    }
    
    .chart-section {
      margin-bottom: 24px;
    }
    
    .chart-section h4 {
      font-size: 0.95em;
      margin-bottom: 12px;
      color: #495057;
    }
    
    .actions {
      display: flex;
      gap: 12px;
    }
    
    .btn-apply {
      flex: 1;
      padding: 12px 24px;
      background: #6c5ce7;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .btn-apply:hover:not(:disabled) {
      background: #5a4fcf;
    }
    
    .btn-apply:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .btn-ignore {
      padding: 12px 24px;
      background: transparent;
      color: #6c757d;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      cursor: pointer;
    }
    
    .btn-ignore:hover {
      background: #f8f9fa;
    }
    
    .fallback-warning {
      margin-top: 16px;
      padding: 12px;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9em;
      color: #856404;
    }
    
    .loading, .error {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px;
      color: #6c757d;
    }
    
    .error {
      color: #dc3545;
    }
  `]
})
export class AiPriceSuggestionComponent implements OnInit, OnChanges, OnDestroy {
  @Input() siteId!: number;
  @Input() currentPrice!: number;
  @Output() priceApplied = new EventEmitter<number>();
  @Output() dismissed = new EventEmitter<void>();
  
  priceData: PricingOptimizationResponse | null = null;
  loading = true;
  error = false;
  applying = false;
  chart: Chart | null = null;
  private reloadTimer: ReturnType<typeof setTimeout> | null = null;
  
  constructor(private mlService: MlIntegrationService) {}
  
  ngOnInit() {
    this.loadPriceSuggestion();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['currentPrice'] || changes['currentPrice'].firstChange) return;
    if (!this.siteId || Number(changes['currentPrice'].currentValue || 0) <= 0) return;

    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }

    this.reloadTimer = setTimeout(() => {
      this.loadPriceSuggestion();
      this.reloadTimer = null;
    }, 350);
  }

  ngOnDestroy(): void {
    if (this.reloadTimer) {
      clearTimeout(this.reloadTimer);
    }
    this.chart?.destroy();
  }
  
  loadPriceSuggestion() {
    this.loading = true;
    this.error = false;
    this.mlService.getOptimalPrice(this.siteId, this.currentPrice).subscribe({
      next: (data) => {
        this.priceData = data;
        this.loading = false;
        setTimeout(() => this.renderChart(), 100);
      },
      error: (err) => {
        console.error('Failed to load price suggestion:', err);
        this.priceData = this.buildFallbackPriceSuggestion();
        this.error = false;
        this.loading = false;
        setTimeout(() => this.renderChart(), 100);
      }
    });
  }

  formatPrice(value: number): string {
    const amount = Number(value || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${amount} DT`;
  }

  formatImpact(value: string): string {
    return (value || '').replace(/\$/g, 'DT ');
  }

  private buildFallbackPriceSuggestion(): PricingOptimizationResponse {
    const current = Number(this.currentPrice || 0);
    
    let optimal = Math.max(10, Math.round(current * 1.1 * 100) / 100);

    // Prevent infinite loop: if we just applied the fallback suggestion, don't increase it again.
    if (this.priceData?.usingFallback && Math.abs(current - this.priceData.optimalPrice) < 0.01) {
      optimal = current;
    }

    const revenueImpact = current > 0 ? Math.round(((optimal - current) / current) * 1000) / 10 : 0;
    const difference = Math.max(0, optimal - current);

    return {
      optimalPrice: optimal,
      confidence: 0.5,
      revenueImpact: revenueImpact,
      usingFallback: true,
      factors: [{
        name: 'Fallback Mode',
        impact: `+${difference.toFixed(0)} DT`,
        explanation: difference > 0 ? 'AI pricing endpoint is unavailable, so a conservative local estimate is shown.' : 'Price is already at the fallback optimal level.'
      }],
      forecastData: Array.from({ length: 6 }, (_, index) => {
        const month = index + 1;
        const peak = month >= 6 && month <= 8;
        return {
          month,
          suggestedPrice: Math.round(optimal * (peak ? 1.15 : 0.95) * 100) / 100,
          demand: peak ? 0.8 : 0.5
        };
      })
    };
  }
  
  renderChart() {
    if (!this.priceData?.forecastData) return;
    
    const ctx = document.getElementById('priceForecastChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.chart?.destroy();
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.priceData.forecastData.map(f => `Month ${f.month}`),
        datasets: [{
          label: 'Suggested Price (DT)',
          data: this.priceData.forecastData.map(f => f.suggestedPrice),
          borderColor: '#6c5ce7',
          backgroundColor: 'rgba(108, 92, 231, 0.1)',
          tension: 0.4,
          fill: true
        }, {
          label: 'Demand Index',
          data: this.priceData.forecastData.map(f => f.demand * 100),
          borderColor: '#00b894',
          backgroundColor: 'transparent',
          tension: 0.4,
          yAxisID: 'y1'
        }]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Price (DT)'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Demand (%)'
            }
          }
        }
      }
    };
    
    this.chart = new Chart(ctx, config);
  }
  
  applySuggestion() {
    if (!this.priceData) return;
    
    this.applying = true;
    // Simulate API call to update price
    setTimeout(() => {
      this.priceApplied.emit(this.priceData!.optimalPrice);
      this.applying = false;
    }, 1000);
  }
  
  dismiss() {
    this.dismissed.emit();
  }
}
