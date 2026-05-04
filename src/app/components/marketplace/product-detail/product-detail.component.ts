import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QualityBadgeComponent } from '../../quality-badge/quality-badge.component';
import { CartService } from '../../../services/cart.service';
import { CartItem } from '../../../models/api.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, QualityBadgeComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnChanges {
  @Input() product: any;
  @Output() back = new EventEmitter<void>();

  selectedOptions: { [key: string]: string } = {};
  selectedImage: string = '';

  constructor(private cartService: CartService) {}

  ngOnChanges() {
    if (this.product) {
      this.selectedImage = this.product.image;
      if (this.product.options) {
        this.product.options.forEach((opt: any) => {
          if (opt.values.length > 0) {
            this.selectedOptions[opt.name] = opt.values[0];
          }
        });
      }
    }
  }

  goBack()  { this.back.emit(); }

  selectOption(optionName: string, value: string) {
    this.selectedOptions[optionName] = value;
  }

  getImageUrl(path: string | undefined): string {
    return this.cartService.getImageUrl(path);
  }

  addToCart() {
    if (!this.product) return;
    
    const item: CartItem = {
      productId: this.product.id,
      productName: this.product.name,
      price: this.product.price,
      quantity: 1,
      image: this.product.image,
      type: 'PURCHASE'
    };

    this.cartService.addToCart(item).subscribe({
      next: () => {
        alert('✅ Product added to cart!');
      },
      error: () => {
        alert('❌ Failed to add to cart. Please check your connection.');
      }
    });
  }
}
