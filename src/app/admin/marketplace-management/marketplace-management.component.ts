import { Component, Input } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';

interface MarketplaceItem {
    id: number;
    sku: string;
    name: string;
    category: string;
    price: number;
    rental: number;
    stock: number;
    status: string;
}

import { Router } from '@angular/router';

@Component({
    selector: 'app-marketplace-management',
    standalone: true,
    imports: [CommonModule, NgClass],
    templateUrl: './marketplace-management.component.html',
    styleUrl: './marketplace-management.component.css'
})
export class MarketplaceManagementComponent {
    constructor(private router: Router) {}

    @Input() set section(value: string) {
        if (value && value !== 'marketplace') {
            this.activePortalSection = value;
        }
    }

    activePortalSection = 'products_categories';
    activeTab = 'products'; // For Products & Categories
    activeInventoryTab = 'stock'; // For Inventory & Warehouses
    activeOrdersTab = 'sales'; // For Orders & Rentals

    categories = [
        { id: 1, name: 'Tentes & Abris', description: 'Tous types de tentes', count: 8, icon: '⛺', subcategories: ['Tentes Familiales', 'Tentes 2-3 Personnes'] },
        { id: 2, name: 'Sacs & Bagages', description: 'Sacs à dos', count: 6, icon: '🎒' },
        { id: 3, name: 'Cuisine', description: 'Equipement cuisine', count: 5, icon: '🔥' },
        { id: 4, name: 'Couchage', description: 'Sacs de couchage', count: 5, icon: '💤' },
    ];

    products = [
        { id: 1, sku: 'TENT-FAM-001', name: '4-Person Family Tent', category: 'Tentes & Abris', price: 299.99, rental: 45, stock: 45, status: 'Active' },
        { id: 2, sku: 'SLEEP-PREM-001', name: 'Premium Sleeping Bag -20°C', category: 'Couchage', price: 189.99, rental: 25, stock: 12, status: 'Active' },
        { id: 3, sku: 'COOK-STOV-001', name: 'Portable Camp Stove', category: 'Cuisine', price: 89.99, rental: null, stock: 67, status: 'Active' },
    ];

    inventory = [
        { id: 1, productName: '4-Person Family Tent', warehouse: 'Main Warehouse', location: 'A1-B3-C2', current: 45, reserved: 8, available: 37, alertAt: 20, status: 'ok' },
        { id: 2, productName: 'Premium Sleeping Bag -20°C', warehouse: 'Main Warehouse', location: 'B2-C1-B4', current: 12, reserved: 3, available: 9, alertAt: 15, status: 'low' },
        { id: 3, productName: 'Portable Camp Stove', warehouse: 'Secondary Warehouse', location: 'C3-D2-E1', current: 67, reserved: 5, available: 62, alertAt: 25, status: 'ok' },
    ];

    gearOrders = [
        { id: 'ORD-001', customer: 'David Johnson', email: 'david@example.com', date: '2026-02-14', total: 350.50, status: 'delivered', type: 'sale' },
        { id: 'ORD-002', customer: 'Emma Wilson', email: 'emma@example.com', date: '2026-02-15', total: 95.00, status: 'pending', type: 'sale' },
    ];

    gearRentals = [
        { id: 'RNT-001', customer: 'David Johnson', product: '4-Person Family Tent', email: 'david@example.com', startDate: '2026-02-10', endDate: '2026-02-17', total: 90.00, deposit: 60.00, status: 'active', daysLeft: 1 },
        { id: 'RNT-002', customer: 'Emma Wilson', product: 'Premium Sleeping Bag', email: 'emma@example.com', startDate: '2026-02-08', endDate: '2026-02-15', total: 50.00, deposit: 40.00, status: 'overdue', daysLeft: -1 },
    ];

    setPortalSection(section: string) {
        this.activePortalSection = section;
    }

    setTab(tab: string) {
        this.activeTab = tab;
    }

    setInventoryTab(tab: string) {
        this.activeInventoryTab = tab;
    }

    setOrdersTab(tab: string) {
        this.activeOrdersTab = tab;
    }

    getStatusClass(status: string): string {
        switch (status.toLowerCase()) {
            case 'active':
            case 'delivered':
            case 'in stock':
                return 'bg-green-100 text-green-700';
            case 'low':
            case 'low stock':
            case 'pending':
            case 'shipped':
                return 'bg-yellow-100 text-yellow-700';
            case 'cancelled':
            case 'out of stock':
                return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    }

    onAddAction() {
        if (this.activePortalSection === 'products_categories') {
            if (this.activeTab === 'categories') {
                alert('🛠️ Category creation is managed in the backend or specific Admin section.');
            } else {
                if (confirm('Products are usually added by Sellers. Do you want to go to the Seller dashboard to add a product?')) {
                    this.router.navigate(['/seller']);
                }
            }
        } else {
            alert('🛠️ This management action is not yet implemented in the mock view.');
        }
    }
}
