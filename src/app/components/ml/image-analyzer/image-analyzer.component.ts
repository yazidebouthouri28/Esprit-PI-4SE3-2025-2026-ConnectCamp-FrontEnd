import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MlIntegrationService, ImageAnalysisResponse } from '../../../services/ml-integration.service';

@Component({
  selector: 'app-image-analyzer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="analyzer-container">
      <input #fileInput type="file" multiple accept="image/*" (change)="onFilesSelected($event)" hidden>
      
      <div class="upload-section" *ngIf="!analyzedImages.length && !analyzing">
        <div class="upload-area" 
             (dragover)="onDragOver($event)" 
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             [class.dragging]="isDragging">
          <i class="fas fa-cloud-upload-alt"></i>
          <p>Drag & drop images here or <span class="clickable" (click)="fileInput.click()">browse</span></p>
        </div>
      </div>
      
      <div class="analyzing-section" *ngIf="analyzing">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
        <p>AI is analyzing your images...</p>
        <p class="sub-text">Detecting amenities, quality, and environment</p>
      </div>
      
      <div class="results-section" *ngIf="analyzedImages.length > 0">
        <h3>Analysis Results</h3>
        <div class="image-grid">
          <div *ngFor="let img of analyzedImages; let i = index" class="image-card">
            <div class="image-preview">
              <img [src]="img.previewUrl" alt="Preview">
              <div class="quality-badge" [ngClass]="getQualityClass(img.analysis.qualityScore)">
                <i class="fas fa-magic"></i>
                {{ img.analysis.qualityScore | number:'1.1-1' }}/10
              </div>
            </div>
            
            <div class="analysis-details">
              <div class="environment-tag" *ngIf="img.analysis.environment">
                <i class="fas fa-map-marker-alt"></i>
                {{ img.analysis.environment }}
                <span class="confidence">({{ img.analysis.environmentConfidence | percent }})</span>
              </div>
              
              <div class="amenities-section" *ngIf="img.analysis.amenities && img.analysis.amenities.length > 0">
                <h4>Detected Amenities:</h4>
                <div class="amenity-tags">
                  <span *ngFor="let amenity of img.analysis.amenities" class="amenity-tag">
                    {{ amenity.replace('_', ' ') }}
                  </span>
                </div>
              </div>
              
              <div class="suggestions-section" *ngIf="img.analysis.suggestions && img.analysis.suggestions.length > 0">
                <h4>Suggestions:</h4>
                <ul>
                  <li *ngFor="let suggestion of img.analysis.suggestions">
                    {{ suggestion }}
                  </li>
                </ul>
              </div>
            </div>
            
            <div class="image-actions">
              <button class="btn-use" (click)="useAsThumbnail(i)" *ngIf="img.analysis.qualityScore >= 7">
                <i class="fas fa-check"></i> Use as Thumbnail
              </button>
              <button class="btn-remove" (click)="removeImage(i)">
                <i class="fas fa-trash-alt"></i> Remove
              </button>
            </div>
          </div>
        </div>
        
        <div class="overall-score" *ngIf="overallScore > 0">
          <h4>Overall Listing Quality</h4>
          <div class="score-display">
            <div class="score-circle" [ngClass]="getQualityClass(overallScore)">
              {{ overallScore | number:'1.1-1' }}
            </div>
            <div class="score-bar">
              <div class="fill" [style.width.%]="overallScore * 10"></div>
            </div>
          </div>
          <p class="score-advice" *ngIf="overallScore < 7">
            Add more high-quality photos to improve visibility
          </p>
        </div>
        
        <div class="actions-footer">
          <button class="btn-add-more" (click)="fileInput.click()">
            <i class="fas fa-plus"></i> Add More Images
          </button>
          <button class="btn-done" (click)="done.emit(analyzedImages)">
            Done
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analyzer-container {
      background: white;
      border-radius: 12px;
      padding: 24px;
    }
    
    .upload-area {
      border: 3px dashed #dee2e6;
      border-radius: 12px;
      padding: 48px;
      text-align: center;
      transition: all 0.2s;
    }
    
    .upload-area.dragging {
      border-color: #6c5ce7;
      background: rgba(108, 92, 231, 0.05);
    }
    
    .upload-area i {
      font-size: 3em;
      color: #adb5bd;
      margin-bottom: 16px;
    }
    
    .upload-area p {
      color: #6c757d;
      margin: 0;
    }
    
    .clickable {
      color: #6c5ce7;
      cursor: pointer;
      font-weight: 600;
    }
    
    .analyzing-section {
      text-align: center;
      padding: 48px;
    }
    
    .analyzing-section i {
      color: #6c5ce7;
      margin-bottom: 16px;
    }
    
    .sub-text {
      color: #6c757d;
      font-size: 0.9em;
    }
    
    .results-section h3 {
      margin-bottom: 20px;
    }
    
    .image-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    
    .image-card {
      border: 1px solid #dee2e6;
      border-radius: 12px;
      overflow: hidden;
    }
    
    .image-preview {
      position: relative;
      height: 200px;
    }
    
    .image-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .quality-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    
    .quality-high {
      background: #d4edda;
      color: #155724;
    }
    
    .quality-medium {
      background: #fff3cd;
      color: #856404;
    }
    
    .quality-low {
      background: #f8d7da;
      color: #721c24;
    }
    
    .analysis-details {
      padding: 16px;
    }
    
    .environment-tag {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #6c5ce7;
      font-weight: 600;
    }
    
    .environment-tag .confidence {
      font-weight: normal;
      color: #6c757d;
      font-size: 0.9em;
    }
    
    .amenities-section h4,
    .suggestions-section h4 {
      font-size: 0.85em;
      margin-bottom: 8px;
      color: #495057;
    }
    
    .amenity-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }
    
    .amenity-tag {
      background: #e9ecef;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.8em;
      text-transform: capitalize;
    }
    
    .suggestions-section ul {
      margin: 0;
      padding-left: 20px;
      font-size: 0.85em;
      color: #6c757d;
    }
    
    .suggestions-section li {
      margin-bottom: 4px;
    }
    
    .image-actions {
      display: flex;
      gap: 8px;
      padding: 12px;
      border-top: 1px solid #dee2e6;
    }
    
    .btn-use {
      flex: 1;
      padding: 8px;
      background: #6c5ce7;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9em;
    }
    
    .btn-remove {
      padding: 8px 12px;
      background: #f8d7da;
      color: #721c24;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    
    .overall-score {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    
    .overall-score h4 {
      margin-bottom: 12px;
    }
    
    .score-display {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .score-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2em;
      font-weight: 700;
    }
    
    .score-bar {
      flex: 1;
      height: 12px;
      background: #e9ecef;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .fill {
      height: 100%;
      transition: width 0.3s ease;
    }
    
    .score-advice {
      margin-top: 12px;
      color: #856404;
      font-size: 0.9em;
    }
    
    .actions-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }
    
    .btn-add-more {
      padding: 12px 24px;
      background: transparent;
      color: #6c5ce7;
      border: 1px solid #6c5ce7;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .btn-done {
      padding: 12px 24px;
      background: #6c5ce7;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
  `]
})
export class ImageAnalyzerComponent {
  @Output() done = new EventEmitter<any[]>();
  @Output() thumbnailSelected = new EventEmitter<number>();
  
  isDragging = false;
  analyzing = false;
  analyzedImages: Array<{
    file: File;
    previewUrl: string;
    analysis: ImageAnalysisResponse;
  }> = [];
  
  constructor(private mlService: MlIntegrationService) {}
  
  onDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;
  }
  
  onDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
  }
  
  onDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = false;
    
    const files = e.dataTransfer?.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }
  
  onFilesSelected(e: any) {
    const files = e.target.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }
  
  async processFiles(files: File[]) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    
    this.analyzing = true;
    
    for (const file of imageFiles) {
      const previewUrl = URL.createObjectURL(file);
      
      try {
        const analysis = await this.mlService.analyzeImage(file).toPromise();
        this.analyzedImages.push({
          file,
          previewUrl,
          analysis: analysis!
        });
      } catch (err) {
        console.error('Failed to analyze image:', err);
      }
    }
    
    this.analyzing = false;
  }
  
  getQualityClass(score: number): string {
    if (score >= 7) return 'quality-high';
    if (score >= 5) return 'quality-medium';
    return 'quality-low';
  }
  
  get overallScore(): number {
    if (this.analyzedImages.length === 0) return 0;
    const sum = this.analyzedImages.reduce((acc, img) => acc + img.analysis.qualityScore, 0);
    return sum / this.analyzedImages.length;
  }
  
  useAsThumbnail(index: number) {
    this.thumbnailSelected.emit(index);
  }
  
  removeImage(index: number) {
    this.analyzedImages.splice(index, 1);
  }
}
