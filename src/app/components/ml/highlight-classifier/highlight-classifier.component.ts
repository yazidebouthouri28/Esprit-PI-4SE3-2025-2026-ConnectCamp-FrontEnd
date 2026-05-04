import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MlIntegrationService, HighlightClassificationResponse } from '../../../services/ml-integration.service';

@Component({
  selector: 'app-highlight-classifier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="highlight-classifier">
      <div class="classifier-header">
        <i class="fas fa-magic"></i>
        <span>AI Category Suggestion</span>
        <span class="ai-badge">AI</span>
      </div>
      
      <div class="input-section" *ngIf="!assistFromParentForm">
        <div class="form-group">
          <label>Highlight Title:</label>
          <input 
            type="text" 
            [(ngModel)]="title" 
            (input)="onInputChange()"
            placeholder="Enter highlight title..."
            class="form-control">
        </div>
        
        <div class="form-group">
          <label>Description:</label>
          <textarea 
            [(ngModel)]="content" 
            (input)="onInputChange()"
            placeholder="Enter description..."
            rows="3"
            class="form-control"></textarea>
        </div>
        
        <button 
          class="classify-btn" 
          (click)="classify()"
          [disabled]="!title || !content || loading">
          <i class="fas fa-brain"></i>
          {{ loading ? 'Analyzing...' : 'Suggest Category' }}
        </button>
      </div>

      <div class="assist-section" *ngIf="assistFromParentForm">
        <p class="assist-hint">Uses the title and content from this form above.</p>
        <button 
          type="button"
          class="classify-btn"
          (click)="classify()"
          [disabled]="!title.trim() || !content.trim() || loading">
          <i class="fas fa-brain"></i>
          {{ loading ? 'Analyzing...' : 'Suggest category from fields above' }}
        </button>
      </div>
      
      <div class="classification-result" *ngIf="classification">
        <div class="result-header">
          <i class="fas fa-lightbulb"></i>
          <span>AI Suggestion</span>
        </div>
        
        <div class="suggested-category">
          <span class="category-label">Category:</span>
          <span class="category-value">{{ classification.predictedCategory }}</span>
          <span class="confidence-pill" [class.high]="classification.confidence > 0.8"
                [class.medium]="classification.confidence > 0.6 && classification.confidence <= 0.8"
                [class.low]="classification.confidence <= 0.6">
            {{ classification.confidence | percent }} confidence
          </span>
        </div>
        
        <div class="alternative-cats" *ngIf="classification.alternativeCategories?.length">
          <small>Alternatives: {{ classification.alternativeCategories.join(', ') }}</small>
        </div>

        <div class="tag-suggestions" *ngIf="suggestedTags.length">
          <div class="tag-title">AI Generated Tags</div>
          <div class="tag-list">
            <span class="tag-pill" *ngFor="let row of suggestedTags">
              #{{ row.tag }}
              <small *ngIf="row.relevance">{{ row.relevance | percent }}</small>
            </span>
          </div>
        </div>
        
        <div class="action-buttons">
          <button class="accept-btn" (click)="acceptSuggestion()">
            <i class="fas fa-check"></i> Use Category + Tags
          </button>
          <button class="retry-btn" (click)="classify()">
            <i class="fas fa-redo"></i> Retry
          </button>
        </div>
      </div>
      
      <div class="error-message" *ngIf="error">
        <i class="fas fa-exclamation-circle"></i>
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .highlight-classifier {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .classifier-header {
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
    
    .form-group {
      margin-bottom: 15px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #555;
      font-size: 0.9em;
    }
    
    .form-control {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 0.95em;
    }
    
    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }
    
    .classify-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    
    .classify-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    .classification-result {
      margin-top: 20px;
      padding: 15px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
      border-radius: 10px;
      border-left: 4px solid #667eea;
    }
    
    .result-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #667eea;
      margin-bottom: 12px;
    }
    
    .suggested-category {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    
    .category-label {
      font-size: 0.9em;
      color: #666;
    }
    
    .category-value {
      font-weight: 700;
      color: #333;
      font-size: 1.1em;
    }
    
    .confidence-pill {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.75em;
    }
    
    .confidence-pill.high {
      background: #d4edda;
      color: #155724;
    }
    
    .confidence-pill.medium {
      background: #fff3cd;
      color: #856404;
    }
    
    .confidence-pill.low {
      background: #f8d7da;
      color: #721c24;
    }
    
    .category-reason {
      font-size: 0.9em;
      color: #555;
      margin-bottom: 15px;
      padding: 8px;
      background: white;
      border-radius: 6px;
    }

    .tag-suggestions {
      margin: 12px 0 15px;
      padding: 10px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e7eaf0;
    }

    .tag-title {
      font-size: 0.75em;
      font-weight: 700;
      color: #667eea;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 8px;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .tag-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 9px;
      border-radius: 999px;
      background: #eef2ff;
      color: #3f4fa3;
      font-size: 0.82em;
      font-weight: 700;
    }

    .tag-pill small {
      color: #6b7280;
      font-weight: 600;
    }
    
    .action-buttons {
      display: flex;
      gap: 10px;
    }
    
    .accept-btn, .retry-btn {
      flex: 1;
      padding: 10px;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    
    .accept-btn {
      background: #27ae60;
      color: white;
      border: none;
    }
    
    .retry-btn {
      background: white;
      color: #667eea;
      border: 1px solid #667eea;
    }
    
    .error-message {
      margin-top: 15px;
      padding: 10px;
      background: #f8d7da;
      color: #721c24;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .assist-section {
      margin-bottom: 12px;
    }

    .assist-hint {
      margin: 0 0 10px 0;
      font-size: 0.85em;
      color: #666;
    }
  `]
})
export class HighlightClassifierComponent implements OnChanges {
  /** When true, hide duplicate title/body fields and classify from parent-bound inputs */
  @Input() assistFromParentForm = false;
  @Input() title = '';
  @Input() content = '';
  @Output() categorySelected = new EventEmitter<string>();
  @Output() tagsSelected = new EventEmitter<string[]>();
  
  classification?: HighlightClassificationResponse;
  suggestedTags: Array<{ tag: string; relevance: number }> = [];
  loading = false;
  error?: string;

  constructor(private mlService: MlIntegrationService) {}

  ngOnChanges() {
    this.classification = undefined;
    this.suggestedTags = [];
    this.error = undefined;
  }

  onInputChange() {
    this.classification = undefined;
    this.suggestedTags = [];
    this.error = undefined;
  }

  classify() {
    if (!this.title || !this.content) return;
    
    this.loading = true;
    this.error = undefined;
    
    this.mlService.classifyHighlight(this.title, this.content)
      .subscribe({
        next: (response) => {
          this.classification = response;
          this.suggestedTags = this.normalizeSuggestedTags(
            response?.suggestedTags,
            response?.predictedCategory,
            `${this.title} ${this.content}`
          );
          this.loading = false;
        },
        error: (err) => {
          this.classification = this.buildFallbackClassification();
          this.suggestedTags = this.normalizeSuggestedTags(
            this.classification.suggestedTags,
            this.classification.predictedCategory,
            `${this.title} ${this.content}`
          );
          this.error = 'AI service was slow, so fallback tags were generated locally.';
          this.loading = false;
        }
      });
  }

  acceptSuggestion() {
    if (this.classification) {
      this.categorySelected.emit(this.classification.predictedCategory);
      this.tagsSelected.emit(this.suggestedTags.map((row) => row.tag));
    }
  }

  private normalizeSuggestedTags(
    tags?: Array<{ tag: string; relevance: number }> | null,
    category?: string,
    sourceText: string = ''
  ): Array<{ tag: string; relevance: number }> {
    const seen = new Set<string>();
    const normalized: Array<{ tag: string; relevance: number }> = [];

    const addTag = (tag: string, relevance: number) => {
      const cleaned = this.cleanTag(tag);
      const key = cleaned.toLowerCase();
      if (!cleaned || seen.has(key)) return;
      seen.add(key);
      normalized.push({ tag: cleaned, relevance });
    };

    for (const row of tags ?? []) {
      addTag(String(row?.tag ?? ''), Number(row?.relevance ?? 0));
    }

    for (const row of this.tagsForCategory(category || this.detectFallbackCategory(sourceText.toLowerCase()), sourceText.toLowerCase())) {
      addTag(row.tag, row.relevance);
    }

    return normalized.slice(0, 8);
  }

  private cleanTag(raw: string): string {
    const tag = String(raw || '')
      .replace(/^#+/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();

    const banned = new Set(['ai', 'stubi ai', 'stub ai', 'generated', 'category', 'classification']);
    if (
      tag.length < 3 ||
      tag.length > 28 ||
      banned.has(tag) ||
      tag.endsWith(' ai') ||
      !/[a-z]/.test(tag) ||
      !/^[a-z0-9 ]+$/.test(tag)
    ) {
      return '';
    }

    return tag;
  }

  private buildFallbackClassification(): HighlightClassificationResponse {
    const text = `${this.title} ${this.content}`.toLowerCase();
    const category = this.detectFallbackCategory(text);
    return {
      predictedCategory: category,
      confidence: 0.62,
      alternativeCategories: ['FLORA', 'FAUNA', 'CLIMATE', 'GEOLOGY', 'HISTORY'].filter((item) => item !== category).slice(0, 2),
      suggestedTags: this.tagsForCategory(category, text),
      categoryProbabilities: {
        [category]: 0.62
      },
      usingFallback: true
    };
  }

  private detectFallbackCategory(text: string): string {
    if (/(fox|animal|bird|wildlife|fauna|species|habitat|fish)/.test(text)) return 'FAUNA';
    if (/(tree|flower|plant|forest|flora|olive|pine|green)/.test(text)) return 'FLORA';
    if (/(rock|mountain|cave|geology|terrain|cliff|lake)/.test(text)) return 'GEOLOGY';
    if (/(weather|climate|season|temperature|wind|rain|sun)/.test(text)) return 'CLIMATE';
    if (/(history|ancient|roman|ruin|heritage|culture)/.test(text)) return 'HISTORY';
    return 'FLORA';
  }

  private tagsForCategory(category: string, text: string): Array<{ tag: string; relevance: number }> {
    const tagsByCategory: Record<string, string[]> = {
      FLORA: ['plants', 'forest', 'native flora', 'greenery'],
      FAUNA: ['wildlife', 'animal habitat', 'desert species', 'nature watching'],
      GEOLOGY: ['terrain', 'rocks', 'landscape', 'mountain'],
      CLIMATE: ['weather', 'season', 'temperature', 'conditions'],
      HISTORY: ['heritage', 'culture', 'ancient site', 'history']
    };

    const tags = [...(tagsByCategory[category] ?? ['camping', 'nature', 'outdoor'])];
    if (category === 'FAUNA' && /fennec|fox|vulpes/.test(text)) {
      tags.unshift('fennec fox');
    }
    if (/desert/.test(text) && !tags.includes('desert')) {
      tags.push('desert');
    }
    if (/forest/.test(text) && !tags.includes('forest')) {
      tags.push('forest');
    }

    return tags.map((tag) => ({
      tag,
      relevance: text.includes(tag.split(' ')[0]) ? 0.9 : 0.74
    }));
  }
}
