import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserMlService, MatchScoreResponse, MatchDetail } from '../../../services/user-ml.service';

@Component({
  selector: 'app-campsite-match-score',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="match-score-widget">
      <div class="widget-header">
        <i class="fas fa-bullseye"></i>
        <span>🎯 Match Score</span>
        <span class="ai-badge">AI</span>
      </div>
      
      <div class="loading-state" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>AI is calculating the match...</p>
      </div>
      
      <div class="match-content" *ngIf="!loading && matchData">
        <!-- Main Score Circle -->
        <div class="score-circle-section">
          <div class="score-circle" [class.excellent]="matchData.overallMatchScore >= 85"
               [class.good]="matchData.overallMatchScore >= 70 && matchData.overallMatchScore < 85"
               [class.average]="matchData.overallMatchScore >= 50 && matchData.overallMatchScore < 70"
               [class.poor]="matchData.overallMatchScore < 50">
            <span class="score-value">{{ matchData.overallMatchScore | number:'1.0-0' }}</span>
            <span class="score-label">Match</span>
          </div>
          <div class="grade-badge">{{ matchData.matchGrade }}</div>
        </div>
        
        <!-- Recommendation -->
        <div class="recommendation-box" [class.positive]="matchData.overallMatchScore >= 70"
             [class.warning]="matchData.overallMatchScore >= 50 && matchData.overallMatchScore < 70"
             [class.negative]="matchData.overallMatchScore < 50">
          <i class="fas" [class.fa-check-circle]="matchData.overallMatchScore >= 70"
             [class.fa-exclamation-triangle]="matchData.overallMatchScore >= 50 && matchData.overallMatchScore < 70"
             [class.fa-times-circle]="matchData.overallMatchScore < 50"></i>
          <p>{{ matchData.personalizedRecommendation }}</p>
        </div>
        
        <!-- Deal Breakers -->
        <div class="deal-breakers" *ngIf="matchData.dealBreakers.length > 0">
          <h5><i class="fas fa-exclamation-triangle"></i> Watch Out For</h5>
          <div class="breaker-list">
            <div *ngFor="let breaker of matchData.dealBreakers" class="breaker-item">
              {{ breaker }}
            </div>
          </div>
        </div>
        
        <!-- Match Details -->
        <div class="match-details-section">
          <h5><i class="fas fa-chart-bar"></i> Match Details</h5>
          <div class="detail-cards">
            <div *ngFor="let detail of matchData.matchDetails" class="detail-card">
              <div class="detail-header">
                <span class="detail-category">{{ detail.category }}</span>
                <span class="detail-score" [class.high]="detail.score >= 80"
                      [class.medium]="detail.score >= 60 && detail.score < 80"
                      [class.low]="detail.score < 60">
                  {{ detail.score | number:'1.0-0' }}%
                </span>
              </div>
              <p class="detail-explanation">{{ detail.explanation }}</p>
              
              <div class="feature-tags" *ngIf="detail.matchingFeatures.length > 0">
                <span *ngFor="let feature of detail.matchingFeatures.slice(0, 3)" class="feature-tag match">
                  <i class="fas fa-check"></i> {{ feature }}
                </span>
              </div>
              
              <div class="feature-tags" *ngIf="detail.missingFeatures.length > 0">
                <span *ngFor="let feature of detail.missingFeatures.slice(0, 2)" class="feature-tag missing">
                  <i class="fas fa-times"></i> {{ feature }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Top Matching Aspects -->
        <div class="top-aspects" *ngIf="matchData.topMatchingAspects.length > 0">
          <h5><i class="fas fa-star"></i> Top Matching Aspects</h5>
          <div class="aspect-tags">
            <span *ngFor="let aspect of matchData.topMatchingAspects" class="aspect-tag">
              {{ aspect }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .match-score-widget {
      background: white;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    
    .widget-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.1em;
      font-weight: 600;
      color: #333;
      margin-bottom: 20px;
    }
    
    .widget-header i {
      color: #6c5ce7;
    }
    
    .ai-badge {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.7em;
      margin-left: auto;
    }
    
    .score-circle-section {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      margin-bottom: 20px;
    }
    
    .score-circle {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border: 4px solid #e9ecef;
      transition: all 0.3s;
    }
    
    .score-circle.excellent {
      border-color: #27ae60;
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
    }
    
    .score-circle.good {
      border-color: #11998e;
      background: linear-gradient(135deg, #d1f2eb 0%, #a9dfbf 100%);
    }
    
    .score-circle.average {
      border-color: #f39c12;
      background: linear-gradient(135deg, #fcf3cf 0%, #f9e79f 100%);
    }
    
    .score-circle.poor {
      border-color: #e74c3c;
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
    }
    
    .score-value {
      font-size: 2.5em;
      font-weight: 700;
      color: #333;
    }
    
    .score-label {
      font-size: 0.8em;
      color: #666;
    }
    
    .grade-badge {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.2em;
    }
    
    .recommendation-box {
      padding: 15px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }
    
    .recommendation-box.positive {
      background: #d4edda;
      color: #155724;
    }
    
    .recommendation-box.warning {
      background: #fff3cd;
      color: #856404;
    }
    
    .recommendation-box.negative {
      background: #f8d7da;
      color: #721c24;
    }
    
    .recommendation-box i {
      font-size: 1.3em;
    }
    
    .recommendation-box p {
      margin: 0;
      font-size: 0.95em;
      line-height: 1.5;
    }
    
    .deal-breakers {
      margin-bottom: 20px;
    }
    
    .deal-breakers h5 {
      color: #e74c3c;
      margin: 0 0 10px 0;
      font-size: 0.9em;
    }
    
    .breaker-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .breaker-item {
      background: #f8d7da;
      color: #721c24;
      padding: 10px 15px;
      border-radius: 8px;
      font-size: 0.9em;
      border-left: 3px solid #e74c3c;
    }
    
    .match-details-section {
      margin-bottom: 20px;
    }
    
    .match-details-section h5 {
      color: #555;
      margin: 0 0 15px 0;
      font-size: 0.95em;
    }
    
    .detail-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .detail-card {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 10px;
      border-left: 4px solid #6c5ce7;
    }
    
    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .detail-category {
      font-weight: 600;
      color: #333;
    }
    
    .detail-score {
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.85em;
    }
    
    .detail-score.high {
      background: #d4edda;
      color: #155724;
    }
    
    .detail-score.medium {
      background: #fff3cd;
      color: #856404;
    }
    
    .detail-score.low {
      background: #f8d7da;
      color: #721c24;
    }
    
    .detail-explanation {
      margin: 0 0 10px 0;
      font-size: 0.9em;
      color: #666;
    }
    
    .feature-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    
    .feature-tag {
      padding: 4px 10px;
      border-radius: 15px;
      font-size: 0.75em;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .feature-tag.match {
      background: #d4edda;
      color: #155724;
    }
    
    .feature-tag.missing {
      background: #f8d7da;
      color: #721c24;
    }
    
    .top-aspects {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e9ecef;
    }
    
    .top-aspects h5 {
      color: #27ae60;
      margin: 0 0 10px 0;
      font-size: 0.9em;
    }
    
    .aspect-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    
    .aspect-tag {
      background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
      color: #155724;
      padding: 6px 14px;
      border-radius: 15px;
      font-size: 0.85em;
      font-weight: 500;
    }
    
    .loading-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }
    
    .loading-state i {
      font-size: 2em;
      margin-bottom: 15px;
      color: #6c5ce7;
    }
  `]
})
export class CampsiteMatchScoreComponent implements OnInit {
  @Input() siteId: number = 1;
  @Input() siteName: string = '';
  @Input() userAmenities: string[] = ['wifi', 'piscine'];
  @Input() budgetMin?: number = 30;
  @Input() budgetMax?: number = 80;
  @Input() preferredLocations: string[] = ['lac', 'montagne'];
  @Input() siteFeatures: any = {
    amenities: ['wifi', 'piscine', 'bbq'],
    price_per_night: 65,
    rating: 4.7,
    image_quality: 9.0,
    location_type: 'lac'
  };

  matchData?: MatchScoreResponse;
  loading = true;

  constructor(private userMlService: UserMlService) {}

  ngOnInit() {
    this.loadMatchScore();
  }

  loadMatchScore() {
    this.loading = true;
    this.userMlService.getMatchScore(
      this.siteId,
      this.siteName,
      this.siteFeatures,
      this.userAmenities,
      this.budgetMin,
      this.budgetMax,
      this.preferredLocations
    ).subscribe({
      next: (response) => {
        this.matchData = response;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading match score:', err);
        this.loading = false;
      }
    });
  }
}
