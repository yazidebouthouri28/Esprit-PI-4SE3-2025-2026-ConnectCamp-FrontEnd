import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-product-detail',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-detail.component.html',
    styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent {
    @Input() product: any;
    @Output() back = new EventEmitter<void>();

    selectedOptions: { [key: string]: string } = {};
    selectedImage: string = '';

    ngOnChanges() {
        if (this.product) {
            // Set main image
            this.selectedImage = this.product.image;

            // Should select first from images array if available? 
            // Usually product.image is the main one, so we keep it.

            // Initialize first option as selected
            if (this.product.options) {
                this.product.options.forEach((opt: any) => {
                    if (opt.values.length > 0) {
                        this.selectedOptions[opt.name] = opt.values[0];
                    }
                });
            }
        }
    }

    goBack() {
        this.back.emit();
    }

    selectOption(optionName: string, value: string) {
        this.selectedOptions[optionName] = value;
    }
}
