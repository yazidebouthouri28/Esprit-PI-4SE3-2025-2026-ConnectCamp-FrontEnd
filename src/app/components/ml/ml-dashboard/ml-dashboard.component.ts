import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { MlIntegrationService, MlDashboardStats } from '../../../services/ml-integration.service';

@Component({
  selector: 'app-ml-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ml-dashboard">
      <header class="dashboard-header">
        <h1><i class="fas fa-brain"></i> Machine Learning Dashboard</h1>
        <div class="status-badge" [class.online]="stats?.status === 'healthy'">
          {{ stats?.status || 'Unknown' }}
        </div>
      </header>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon cancellation">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <div class="stat-content">
            <h3>Cancellation Predictions</h3>
            <div class="big-number">{{ stats?.totalPredictions?.['cancellation'] || 0 | number }}</div>
            <div class="accuracy" *ngIf="stats?.modelPerformance?.['cancellation']">
              AUC-ROC: {{ stats?.modelPerformance?.['cancellation']?.auc_roc }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon pricing">
            <i class="fas fa-dollar-sign"></i>
          </div>
          <div class="stat-content">
            <h3>Price Optimizations</h3>
            <div class="big-number">{{ stats?.totalPredictions?.['pricing'] || 0 | number }}</div>
            <div class="accuracy" *ngIf="stats?.modelPerformance?.['pricing']">
              R²: {{ stats?.modelPerformance?.['pricing']?.r2 }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon image">
            <i class="fas fa-image"></i>
          </div>
          <div class="stat-content">
            <h3>Images Analyzed</h3>
            <div class="big-number">{{ stats?.totalPredictions?.['image'] || 0 | number }}</div>
            <div class="accuracy" *ngIf="stats?.modelPerformance?.['image']">
              Acc: {{ stats?.modelPerformance?.['image']?.accuracy }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon highlight">
            <i class="fas fa-highlighter"></i>
          </div>
          <div class="stat-content">
            <h3>Highlights Classified</h3>
            <div class="big-number">{{ stats?.totalPredictions?.['highlight'] || 0 | number }}</div>
            <div class="accuracy" *ngIf="stats?.modelPerformance?.['highlight']">
              Acc: {{ stats?.modelPerformance?.['highlight']?.accuracy }}
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon revenue">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="stat-content">
            <h3>Revenue Predictions</h3>
            <div class="big-number">{{ stats?.totalPredictions?.['revenue'] || 0 | number }}</div>
            <div class="accuracy" *ngIf="stats?.modelPerformance?.['revenue']">
              MAPE: {{ stats?.modelPerformance?.['revenue']?.mape }}%
            </div>
          </div>
        </div>
      </div>
      
      <div class="charts-section">
        <div class="chart-container">
          <h3>Model Performance Over Time</h3>
          <canvas id="performanceChart"></canvas>
        </div>
        
        <div class="chart-container">
          <h3>Prediction Distribution</h3>
          <canvas id="distributionChart"></canvas>
        </div>
      </div>
      
      <div class="model-versions">
        <h3>Model Versions</h3>
        <div class="version-list">
          <div *ngFor="let model of getModelVersions()" class="version-item">
            <span class="model-name">{{ model.name }}</span>
            <span class="version-tag">{{ model.version }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ml-dashboard {
      padding: 24px;
      background: #f8f9fa;
      min-height: 100vh;
    }
    
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    
    .dashboard-header h1 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .dashboard-header h1 i {
      color: #6c5ce7;
    }
    
    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9em;
      font-weight: 600;
      background: #f8d7da;
      color: #721c24;
    }
    
    .status-badge.online {
      background: #d4edda;
      color: #155724;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5em;
    }
    
    .stat-icon.cancellation { background: #fee; color: #e74c3c; }
    .stat-icon.pricing { background: #efe; color: #27ae60; }
    .stat-icon.image { background: #eef; color: #3498db; }
    .stat-icon.highlight { background: #fef; color: #9b59b6; }
    .stat-icon.revenue { background: #ffe; color: #f39c12; }
    
    .stat-content h3 {
      margin: 0 0 8px 0;
      font-size: 0.95em;
      color: #6c757d;
    }
    
    .big-number {
      font-size: 2em;
      font-weight: 700;
      color: #2d3436;
    }
    
    .accuracy {
      font-size: 0.85em;
      color: #00b894;
      font-weight: 600;
    }
    
    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .chart-container h3 {
      margin: 0 0 16px 0;
      font-size: 1em;
      color: #2d3436;
    }
    
    .model-versions {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .model-versions h3 {
      margin: 0 0 16px 0;
    }
    
    .version-list {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .version-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .model-name {
      color: #6c757d;
      font-size: 0.9em;
    }
    
    .version-tag {
      background: #6c5ce7;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.8em;
      font-weight: 600;
    }
  `]
})
export class MlDashboardComponent implements OnInit {
  stats: MlDashboardStats | null = null;
  performanceChart: Chart | null = null;
  distributionChart: Chart | null = null;
  
  constructor(private mlService: MlIntegrationService) {}
  
  ngOnInit() {
    this.loadStats();
  }
  
  loadStats() {
    this.mlService.getMlDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        setTimeout(() => this.renderCharts(), 100);
      },
      error: (err) => {
        console.error('Failed to load ML stats:', err);
      }
    });
  }
  
  renderCharts() {
    this.renderPerformanceChart();
    this.renderDistributionChart();
  }
  
  renderPerformanceChart() {
    const ctx = document.getElementById('performanceChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Accuracy',
          data: [0.85, 0.87, 0.88, 0.89],
          borderColor: '#6c5ce7',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            min: 0.8,
            max: 1.0
          }
        }
      }
    };
    
    this.performanceChart = new Chart(ctx, config);
  }
  
  renderDistributionChart() {
    const ctx = document.getElementById('distributionChart') as HTMLCanvasElement;
    if (!ctx) return;
    
    const config: ChartConfiguration = {
      type: 'doughnut',
      data: {
        labels: ['Cancellation', 'Pricing', 'Image', 'Highlight', 'Revenue'],
        datasets: [{
          data: [
            this.stats?.totalPredictions?.['cancellation'] || 100,
            this.stats?.totalPredictions?.['pricing'] || 80,
            this.stats?.totalPredictions?.['image'] || 150,
            this.stats?.totalPredictions?.['highlight'] || 60,
            this.stats?.totalPredictions?.['revenue'] || 90
          ],
          backgroundColor: ['#e74c3c', '#27ae60', '#3498db', '#9b59b6', '#f39c12']
        }]
      },
      options: {
        responsive: true
      }
    };
    
    this.distributionChart = new Chart(ctx, config);
  }
  
  getModelVersions(): Array<{ name: string; version: string }> {
    if (!this.stats?.modelVersions) return [];
    
    return Object.entries(this.stats.modelVersions).map(([name, version]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      version: version as string
    }));
  }
}
