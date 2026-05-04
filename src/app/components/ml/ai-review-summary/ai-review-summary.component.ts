import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserMlService, ReviewSummaryResponse } from '../../../services/user-ml.service';

@Component({
  selector: 'app-ai-review-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="review-summary-widget">
      <div class="widget-header">
        <i class="fas fa-brain"></i>
        <span>📝 AI Review Summary</span>
        <span class="ai-badge">AI</span>
      </div>
      
      <div class="loading-state" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>AI is analyzing {{ reviews.length }} reviews...</p>
      </div>
      
      <div class="summary-content" *ngIf="!loading && reviewData">
        <!-- AI Summary -->
        <div class="ai-summary-box">
          <i class="fas fa-robot"></i>
          <p>{{ reviewData.aiSummary }}</p>
        </div>
        
        <!-- Sentiment Gauge -->
        <div class="sentiment-section">
          <h5>Sentiment Analysis</h5>
          <div class="sentiment-bar">
            <div class="positive-segment" 
                 [style.width.%]="reviewData.sentiment.positivePct"
                 title="{{ reviewData.sentiment.positivePct | number:'1.0-0' }}% positive">
              <i class="fas fa-smile"></i>
              {{ reviewData.sentiment.positivePct | number:'1.0-0' }}%
            </div>
            <div class="neutral-segment" 
                 [style.width.%]="reviewData.sentiment.neutralPct"
                 title="{{ reviewData.sentiment.neutralPct | number:'1.0-0' }}% neutral">
              {{ reviewData.sentiment.neutralPct | number:'1.0-0' }}%
            </div>
            <div class="negative-segment" 
                 [style.width.%]="reviewData.sentiment.negativePct"
                 title="{{ reviewData.sentiment.negativePct | number:'1.0-0' }}% negative">
              <i class="fas fa-frown"></i>
              {{ reviewData.sentiment.negativePct | number:'1.0-0' }}%
            </div>
          </div>
        </div>
        
        <!-- Pros Section -->
        <div class="pros-section" *ngIf="reviewData.topMentionedPros.length > 0">
          <h5><i class="fas fa-thumbs-up"></i> Top Pros Mentioned</h5>
          <div class="feature-list">
            <div *ngFor="let pro of reviewData.topMentionedPros.slice(0, 4)" class="feature-item pro">
              <span class="feature-name">{{ pro.feature }}</span>
              <div class="feature-bar">
                <div class="fill" [style.width.%]="pro.mention_pct"></div>
              </div>
              <span class="feature-pct">{{ pro.mention_pct | number:'1.0-0' }}%</span>
            </div>
          </div>
        </div>
        
        <!-- Cons Section -->
        <div class="cons-section" *ngIf="reviewData.topMentionedCons.length > 0">
          <h5><i class="fas fa-thumbs-down"></i> Cons to Consider</h5>
          <div class="feature-list">
            <div *ngFor="let con of reviewData.topMentionedCons.slice(0, 3)" class="feature-item con">
              <span class="feature-name">{{ con.feature }}</span>
              <div class="feature-bar">
                <div class="fill" [style.width.%]="con.mention_pct"></div>
              </div>
              <span class="feature-pct">{{ con.mention_pct | number:'1.0-0' }}%</span>
            </div>
          </div>
        </div>
        
        <!-- Representative Quotes -->
        <div class="quotes-section" *ngIf="reviewData.representativeQuotes.length > 0">
          <h5><i class="fas fa-quote-left"></i> What Guests Say</h5>
          <div class="quotes-list">
            <div *ngFor="let quote of reviewData.representativeQuotes.slice(0, 3)" class="quote-item">
              <i class="fas fa-comment"></i>
              <p>{{ quote }}</p>
            </div>
          </div>
        </div>
        
        <!-- Confidence Footer -->
        <div class="confidence-footer">
          <i class="fas fa-check-circle"></i>
          <span>Analysis based on {{ reviewData.totalReviewsAnalyzed }} reviews 
                (confidence: {{ reviewData.confidenceScore | number:'1.0-0' }}%)</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .review-summary-widget {
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
      margin-bottom: 15px;
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
    
    .ai-summary-box {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      border-left: 4px solid #6c5ce7;
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 20px;
      display: flex;
      gap: 12px;
    }
    
    .ai-summary-box i {
      font-size: 1.5em;
      color: #6c5ce7;
    }
    
    .ai-summary-box p {
      margin: 0;
      color: #444;
      line-height: 1.5;
      font-size: 0.95em;
    }
    
    .sentiment-section {
      margin-bottom: 20px;
    }
    
    .sentiment-section h5 {
      margin: 0 0 10px 0;
      color: #555;
      font-size: 0.9em;
    }
    
    .sentiment-bar {
      display: flex;
      height: 40px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .positive-segment {
      background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      font-weight: 600;
      min-width: 60px;
    }
    
    .neutral-segment {
      background: #e9ecef;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 500;
    }
    
    .negative-segment {
      background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      font-weight: 600;
      min-width: 60px;
    }
    
    .pros-section, .cons-section {
      margin-bottom: 20px;
    }
    
    .pros-section h5 {
      color: #27ae60;
      margin: 0 0 10px 0;
      font-size: 0.9em;
    }
    
    .cons-section h5 {
      color: #e74c3c;
      margin: 0 0 10px 0;
      font-size: 0.9em;
    }
    
    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .feature-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    
    .feature-item.pro {
      border-left: 3px solid #27ae60;
    }
    
    .feature-item.con {
      border-left: 3px solid #e74c3c;
    }
    
    .feature-name {
      flex: 0 0 120px;
      font-size: 0.9em;
      color: #555;
    }
    
    .feature-bar {
      flex: 1;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .feature-bar .fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    
    .feature-item.pro .fill {
      background: #27ae60;
    }
    
    .feature-item.con .fill {
      background: #e74c3c;
    }
    
    .feature-pct {
      flex: 0 0 50px;
      text-align: right;
      font-size: 0.85em;
      color: #666;
      font-weight: 600;
    }
    
    .quotes-section {
      margin-bottom: 20px;
    }
    
    .quotes-section h5 {
      color: #555;
      margin: 0 0 10px 0;
      font-size: 0.9em;
    }
    
    .quotes-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    
    .quote-item {
      display: flex;
      gap: 10px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 10px;
      font-style: italic;
    }
    
    .quote-item i {
      color: #6c5ce7;
      font-size: 0.9em;
    }
    
    .quote-item p {
      margin: 0;
      color: #555;
      font-size: 0.9em;
      line-height: 1.4;
    }
    
    .confidence-footer {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 1px solid #e9ecef;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.8em;
      color: #666;
    }
    
    .confidence-footer i {
      color: #27ae60;
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
export class AiReviewSummaryComponent implements OnInit {
  @Input() siteId: number = 1;
  @Input() reviews: string[] = [
    "Beautiful campsite with very clean pool! Staff is super friendly.",
    "Great stay, kids loved it. WiFi works well.",
    "Beautiful mountain view, accessible hiking trails. Recommended!",
    "A bit expensive but quality is there. Spotless facilities.",
    "Perfect for family weekend. BBQ available, very convenient."
  ];

  reviewData?: ReviewSummaryResponse;
  loading = true;

  constructor(private userMlService: UserMlService) {}

  ngOnInit() {
    this.loadReviewSummary();
  }

  loadReviewSummary() {
    this.loading = true;
    this.userMlService.getReviewSummary(this.siteId, this.reviews)
      .subscribe({
        next: (response) => {
          this.reviewData = response;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading review summary:', err);
          this.loading = false;
        }
      });
  }
}
