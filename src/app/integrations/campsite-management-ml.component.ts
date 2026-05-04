// EXAMPLE: How to integrate ML into Campsite Management
// Add this to your existing campsite-edit.component.ts or campsite-form.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiPriceSuggestionComponent } from '../components/ml/ai-price-suggestion/ai-price-suggestion.component';
import { ImageAnalyzerComponent } from '../components/ml/image-analyzer/image-analyzer.component';

@Component({
  selector: 'app-campsite-management-ml-example',
  standalone: true,
  imports: [CommonModule, FormsModule, AiPriceSuggestionComponent, ImageAnalyzerComponent],
  template: `
    <div class="campsite-management-page">
      <h2>Edit Campsite: {{ campsiteName }}</h2>
      
      <!-- Basic Info Section -->
      <div class="form-section">
        <h3>Basic Information</h3>
        <div class="form-group">
          <label>Name:</label>
          <input type="text" [(ngModel)]="campsiteName" class="form-control">
        </div>
        <div class="form-group">
          <label>Description:</label>
          <textarea [(ngModel)]="description" rows="4" class="form-control"></textarea>
        </div>
      </div>
      
      <!-- ML FEATURE 1: AI Price Suggestion - Integrated into Pricing Section -->
      <div class="form-section pricing-section">
        <h3><i class="fas fa-tags"></i> Pricing</h3>
        <div class="current-price-input">
          <label>Current Price per Night:</label>
          <div class="price-input-group">
            <input type="number" [(ngModel)]="currentPrice" class="form-control">
            <span class="currency">DT</span>
          </div>
        </div>
        
        <!-- AI Price Suggestion embedded in pricing section -->
        <div class="ml-pricing-assistant">
          <app-ai-price-suggestion 
            [siteId]="campsiteId"
            [currentPrice]="currentPrice"
            (priceApplied)="updatePrice($event)">
          </app-ai-price-suggestion>
        </div>
      </div>
      
      <!-- ML FEATURE 2: Image Analysis - Integrated into Photos Section -->
      <div class="form-section photos-section">
        <h3><i class="fas fa-images"></i> Photos & AI Analysis</h3>
        <p class="section-help">Upload photos and AI will auto-detect amenities and assess quality</p>
        
        <app-image-analyzer 
          (done)="onImageAnalysisComplete($event)">
        </app-image-analyzer>
        
        <!-- Detected amenities automatically added to campsite -->
        <div class="detected-amenities" *ngIf="detectedAmenities.length > 0">
          <h4>AI Detected Amenities:</h4>
          <div class="amenity-tags">
            <span *ngFor="let amenity of detectedAmenities" class="amenity-tag ai-detected">
              <i class="fas fa-robot"></i> {{ amenity }}
            </span>
          </div>
          <button class="btn-accept-ai" (click)="acceptDetectedAmenities()">
            Add to Campsite Amenities
          </button>
        </div>
      </div>
      
      <!-- Amenities Section -->
      <div class="form-section">
        <h3>Amenities</h3>
        <div class="amenity-selector">
          <label *ngFor="let amenity of availableAmenities" class="amenity-checkbox">
            <input type="checkbox" [checked]="selectedAmenities.includes(amenity)" 
                   (change)="toggleAmenity(amenity)">
            {{ amenity }}
          </label>
        </div>
      </div>
      
      <!-- Save Actions -->
      <div class="actions">
        <button class="btn-save" (click)="saveCampsite()">Save Changes</button>
        <button class="btn-cancel">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .campsite-management-page {
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .form-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .pricing-section {
      border-left: 4px solid #667eea;
    }
    
    .photos-section {
      border-left: 4px solid #11998e;
    }
    
    .ml-pricing-assistant {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }
    
    .price-input-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .price-input-group input {
      width: 150px;
    }
    
    .currency {
      font-weight: 600;
      color: #666;
    }
    
    .detected-amenities {
      margin-top: 20px;
      padding: 15px;
      background: #f0f8ff;
      border-radius: 8px;
    }
    
    .amenity-tag.ai-detected {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .btn-accept-ai {
      margin-top: 10px;
      padding: 8px 16px;
      background: #27ae60;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
  `]
})
export class CampsiteManagementMlExampleComponent {
  campsiteId = 1;
  campsiteName = 'Camping Lac de Bizerte';
  description = 'Beautiful lakeside camping...';
  currentPrice = 65;
  
  availableAmenities = ['Pool', 'WiFi', 'BBQ', 'Beach Access', 'Restaurant', 'Playground'];
  selectedAmenities = ['Pool', 'WiFi'];
  detectedAmenities: string[] = [];
  
  updatePrice(newPrice: number) {
    this.currentPrice = newPrice;
  }
  
  onImageAnalysisComplete(results: Array<{ analysis?: { amenities?: string[] } }>) {
    const merged = new Set<string>();
    for (const row of results || []) {
      for (const a of row.analysis?.amenities ?? []) {
        merged.add(a);
      }
    }
    this.detectedAmenities = [...merged];
  }
  
  acceptDetectedAmenities() {
    this.detectedAmenities.forEach(amenity => {
      if (!this.selectedAmenities.includes(amenity)) {
        this.selectedAmenities.push(amenity);
      }
    });
    this.detectedAmenities = [];
  }
  
  toggleAmenity(amenity: string) {
    const index = this.selectedAmenities.indexOf(amenity);
    if (index > -1) {
      this.selectedAmenities.splice(index, 1);
    } else {
      this.selectedAmenities.push(amenity);
    }
  }
  
  saveCampsite() {
    // Save logic here
    console.log('Saving with AI-suggested price:', this.currentPrice);
    console.log('Amenities including AI-detected:', this.selectedAmenities);
  }
}
