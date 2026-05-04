// EXAMPLE: How to integrate ML into Camp Highlight Management
// Add this to your existing highlight-create.component.ts or highlight-form.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HighlightClassifierComponent } from '../components/ml/highlight-classifier/highlight-classifier.component';

@Component({
  selector: 'app-highlight-management-ml-example',
  standalone: true,
  imports: [CommonModule, FormsModule, HighlightClassifierComponent],
  template: `
    <div class="highlight-management-page">
      <h2>Create New Camp Highlight</h2>
      
      <div class="form-layout">
        <!-- Left Column: Basic Form -->
        <div class="form-main">
          <div class="form-group">
            <label>Title *</label>
            <input 
              type="text" 
              [(ngModel)]="highlight.title" 
              placeholder="e.g., Sunset Yoga by the Lake"
              class="form-control">
          </div>
          
          <div class="form-group">
            <label>Category</label>
            <select [(ngModel)]="highlight.category" class="form-control">
              <option value="">-- Select Category --</option>
              <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Description *</label>
            <textarea 
              [(ngModel)]="highlight.content" 
              placeholder="Describe this highlight..."
              rows="6"
              class="form-control"></textarea>
          </div>
          
          <div class="form-group">
            <label>Image</label>
            <input type="file" (change)="onImageSelected($event)" class="form-control">
          </div>
        </div>
        
        <!-- Right Column: ML Assistant -->
        <div class="ml-sidebar">
          <app-highlight-classifier
            [title]="highlight.title"
            [content]="highlight.content"
            (categorySelected)="onCategorySelected($event)">
          </app-highlight-classifier>
          
          <!-- AI Category Preview -->
          <div class="category-preview" *ngIf="highlight.category">
            <h4>Selected Category</h4>
            <div class="selected-cat-badge">
              {{ highlight.category }}
            </div>
            <p class="ai-help" *ngIf="categorySelectedByAi">
              <i class="fas fa-robot"></i> Suggested by AI
            </p>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="form-actions">
        <button class="btn-save" (click)="saveHighlight()" [disabled]="!isValid()">
          <i class="fas fa-save"></i> Save Highlight
        </button>
        <button class="btn-preview">Preview</button>
        <button class="btn-cancel">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .highlight-management-page {
      max-width: 1000px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .form-layout {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 30px;
      margin-top: 20px;
    }
    
    .form-main {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .ml-sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }
    
    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1em;
    }
    
    .category-preview {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      text-align: center;
    }
    
    .category-preview h4 {
      margin: 0 0 15px 0;
      color: #555;
    }
    
    .selected-cat-badge {
      display: inline-block;
      padding: 10px 25px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 20px;
      font-weight: 600;
      font-size: 1.1em;
    }
    
    .ai-help {
      margin-top: 10px;
      color: #667eea;
      font-size: 0.9em;
    }
    
    .form-actions {
      margin-top: 30px;
      display: flex;
      gap: 15px;
    }
    
    .btn-save {
      padding: 12px 30px;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
    
    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    @media (max-width: 768px) {
      .form-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HighlightManagementMlExampleComponent {
  highlight = {
    title: '',
    content: '',
    category: '',
    image: null as File | null
  };
  
  categories = ['Activity', 'Facility', 'Event', 'Service', 'Nature', 'Wellness'];
  categorySelectedByAi = false;
  
  onCategorySelected(category: string) {
    this.highlight.category = category;
    this.categorySelectedByAi = true;
  }
  
  onImageSelected(event: any) {
    this.highlight.image = event.target.files[0];
  }
  
  isValid() {
    return this.highlight.title && 
           this.highlight.content && 
           this.highlight.category;
  }
  
  saveHighlight() {
    console.log('Saving highlight with AI-suggested category:', this.highlight);
  }
}
