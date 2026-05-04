// EXAMPLE: ML Dashboard integrated into Admin Dashboard
// Add this to your existing admin-dashboard.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MlDashboardComponent } from '../components/ml/ml-dashboard/ml-dashboard.component';

@Component({
  selector: 'app-admin-dashboard-ml-example',
  standalone: true,
  imports: [CommonModule, MlDashboardComponent],
  template: `
    <div class="admin-dashboard">
      <!-- Existing Dashboard Stats -->
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div class="quick-stats">
          <div class="stat-card">
            <span class="stat-value">{{ totalReservations }}</span>
            <span class="stat-label">Reservations</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ totalCampsites }}</span>
            <span class="stat-label">Campsites</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ totalUsers }}</span>
            <span class="stat-label">Users</span>
          </div>
        </div>
      </div>
      
      <!-- ML Section - Integrated into Admin Dashboard -->
      <div class="ml-dashboard-section">
        <div class="section-header">
          <h2><i class="fas fa-brain"></i> AI & Machine Learning</h2>
          <a routerLink="/admin/ml-center" class="view-all-link">View All ML Features →</a>
        </div>
        
        <app-ml-dashboard></app-ml-dashboard>
        
        <!-- Quick ML Actions -->
        <div class="ml-quick-actions">
          <h3>Quick AI Tools</h3>
          <div class="action-grid">
            <a routerLink="/admin/campsites" class="action-card">
              <i class="fas fa-tags"></i>
              <span>AI Pricing</span>
              <small>Optimize campsite prices</small>
            </a>
            <a routerLink="/admin/reservations" class="action-card">
              <i class="fas fa-exclamation-triangle"></i>
              <span>Risk Alerts</span>
              <small>View cancellation risks</small>
            </a>
            <a routerLink="/admin/highlights" class="action-card">
              <i class="fas fa-magic"></i>
              <span>Auto-Classification</span>
              <small>Classify highlights</small>
            </a>
            <a routerLink="/admin/analytics" class="action-card">
              <i class="fas fa-chart-line"></i>
              <span>Revenue Forecast</span>
              <small>Predict earnings</small>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .quick-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin: 20px 0;
    }
    
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .stat-value {
      display: block;
      font-size: 2em;
      font-weight: 700;
      color: #667eea;
    }
    
    .stat-label {
      color: #666;
    }
    
    .ml-dashboard-section {
      margin-top: 30px;
    }
    
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .section-header h2 {
      margin: 0;
      color: #333;
    }
    
    .view-all-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }
    
    .ml-quick-actions {
      margin-top: 30px;
      padding: 25px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .ml-quick-actions h3 {
      margin: 0 0 20px 0;
      color: #333;
    }
    
    .action-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
    }
    
    .action-card {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 10px;
      text-decoration: none;
      color: #333;
      text-align: center;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .action-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .action-card i {
      font-size: 2em;
      color: #667eea;
      margin-bottom: 10px;
      display: block;
    }
    
    .action-card span {
      display: block;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .action-card small {
      color: #666;
      font-size: 0.85em;
    }
    
    @media (max-width: 768px) {
      .action-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class AdminDashboardMlExampleComponent {
  totalReservations = 156;
  totalCampsites = 24;
  totalUsers = 892;
}
