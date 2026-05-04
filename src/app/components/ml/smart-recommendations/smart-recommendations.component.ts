import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserMlService, CampsiteRecommendation } from '../../../services/user-ml.service';

@Component({
  selector: 'app-smart-recommendations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="recommendations-widget">
      <div class="widget-header">
        <i class="fas fa-magic"></i>
        <span>🎯 Smart Recommendations</span>
        <span class="ai-badge">AI</span>
      </div>
      
      <div class="preferences-summary" *ngIf="summary">
        <i class="fas fa-user-cog"></i>
        {{ summary }}
      </div>
      
      <div class="recommendations-list" *ngIf="recommendations.length > 0">
        <div *ngFor="let rec of recommendations.slice(0, 5)" 
             class="recommendation-card"
             [class.high-match]="rec.matchScore >= 80"
             [class.medium-match]="rec.matchScore >= 60 && rec.matchScore < 80">
          
          <div class="match-badge">
            <span class="match-score">{{ rec.matchScore | number:'1.0-0' }}%</span>
            <span class="match-label">Match</span>
          </div>
          
          <div class="rec-content">
            <h4>{{ rec.name }}</h4>
            
            <div class="match-reasons">
              <span *ngFor="let reason of rec.matchReasons.slice(0, 2)" class="reason-tag">
                {{ reason }}
              </span>
            </div>
            
            <div class="rec-metrics">
              <span class="metric" title="Predicted rating">
                <i class="fas fa-star"></i> {{ rec.predictedRating | number:'1.1-1' }}
              </span>
              <span class="metric" title="Price value">
                <i class="fas fa-coins"></i> {{ rec.priceValueScore | number:'1.0-0' }}/100
              </span>
              <span class="metric" title="Photo quality">
                <i class="fas fa-camera"></i> {{ rec.imageQualityScore | number:'1.1-1' }}/10
              </span>
            </div>
          </div>
          
          <button class="view-btn" (click)="viewCampsite(rec.siteId)">
            <i class="fas fa-arrow-right"></i>
          </button>
        </div>
      </div>
      
      <div class="categories-section" *ngIf="topCategories.length > 0">
        <h5>Categories for you:</h5>
        <div class="category-tags">
          <span *ngFor="let cat of topCategories" class="category-tag">
            {{ cat }}
          </span>
        </div>
      </div>
      
      <div class="loading-state" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>AI is analyzing your preferences...</p>
      </div>
    </div>
  `,
  styles: [`
    .recommendations-widget {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    
    .preferences-summary {
      background: rgba(255,255,255,0.1);
      padding: 10px 15px;
      border-radius: 10px;
      margin-bottom: 15px;
      font-size: 0.9em;
      opacity: 0.9;
    }
    
    .recommendations-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .recommendation-card {
      background: white;
      color: #333;
      border-radius: 12px;
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
      transition: transform 0.2s;
    }
    
    .recommendation-card:hover {
      transform: translateX(5px);
    }
    
    .high-match {
      border-left: 4px solid #27ae60;
    }
    
    .medium-match {
      border-left: 4px solid #f39c12;
    }
    
    .match-badge {
      text-align: center;
      min-width: 60px;
    }
    
    .match-score {
      display: block;
      font-size: 1.4em;
      font-weight: 700;
      color: #667eea;
    }
    
    .match-label {
      font-size: 0.7em;
      color: #666;
    }
    
    .rec-content {
      flex: 1;
    }
    
    .rec-content h4 {
      margin: 0 0 8px 0;
      font-size: 1em;
    }
    
    .match-reasons {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 8px;
    }
    
    .reason-tag {
      background: #f0f0f0;
      padding: 3px 8px;
      border-radius: 8px;
      font-size: 0.75em;
      color: #555;
    }
    
    .rec-metrics {
      display: flex;
      gap: 15px;
      font-size: 0.8em;
      color: #666;
    }
    
    .metric i {
      color: #667eea;
    }
    
    .view-btn {
      background: #667eea;
      color: white;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .view-btn:hover {
      background: #764ba2;
    }
    
    .categories-section {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid rgba(255,255,255,0.2);
    }
    
    .categories-section h5 {
      margin: 0 0 10px 0;
      font-size: 0.9em;
      opacity: 0.9;
    }
    
    .category-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .category-tag {
      background: rgba(255,255,255,0.2);
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.8em;
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
export class SmartRecommendationsComponent implements OnInit {
  @Input() userId: number = 1;
  @Input() preferredAmenities: string[] = [];
  @Input() locationTypes: string[] = [];
  @Input() budgetMin?: number;
  @Input() budgetMax?: number;

  recommendations: CampsiteRecommendation[] = [];
  summary: string = '';
  topCategories: string[] = [];
  loading = true;

  constructor(
    private userMlService: UserMlService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRecommendations();
  }

  loadRecommendations() {
    this.loading = true;
    this.userMlService.getPersonalizedRecommendations(
      this.userId,
      this.preferredAmenities,
      this.locationTypes,
      this.budgetMin,
      this.budgetMax
    ).subscribe({
      next: (response) => {
        this.recommendations = response.recommendations;
        this.summary = response.userPreferencesSummary;
        this.topCategories = response.topCategories;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading recommendations:', err);
        this.loading = false;
      }
    });
  }

  viewCampsite(siteId: number): void {
    void this.router.navigate(['/campsites', siteId]);
  }
}
