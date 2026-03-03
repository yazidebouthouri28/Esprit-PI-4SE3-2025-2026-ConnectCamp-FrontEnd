import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="bg-forest-green text-cream-beige mt-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <!-- About -->
          <div>
            <h3 class="text-lg font-bold mb-4 flex items-center gap-2">
              <span class="text-2xl">⛺</span>
              CampConnect
            </h3>
            <p class="text-sage-green text-sm">
              Your ultimate camping companion. Discover, connect, and explore the great outdoors.
            </p>
          </div>

          <!-- Quick Links -->
          <div>
            <h3 class="text-lg font-bold mb-4">Quick Links</h3>
            <ul class="space-y-2 text-sm">
              <li><a routerLink="/campsites" class="text-sage-green hover:text-cream-beige transition-colors">Campsites</a></li>
              <li><a routerLink="/marketplace" class="text-sage-green hover:text-cream-beige transition-colors">Marketplace</a></li>
              <li><a routerLink="/events" class="text-sage-green hover:text-cream-beige transition-colors">Events</a></li>
              <li><a routerLink="/community" class="text-sage-green hover:text-cream-beige transition-colors">Community</a></li>
            </ul>
          </div>

          <!-- Support -->
          <div>
            <h3 class="text-lg font-bold mb-4">Support</h3>
            <ul class="space-y-2 text-sm">
              <li><a href="#" class="text-sage-green hover:text-cream-beige transition-colors">Help Center</a></li>
              <li><a href="#" class="text-sage-green hover:text-cream-beige transition-colors">Contact Us</a></li>
              <li><a href="#" class="text-sage-green hover:text-cream-beige transition-colors">Privacy Policy</a></li>
              <li><a href="#" class="text-sage-green hover:text-cream-beige transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <!-- Connect -->
          <div>
            <h3 class="text-lg font-bold mb-4">Connect</h3>
            <div class="flex gap-4 text-2xl">
              <a href="#" class="text-sage-green hover:text-cream-beige transition-colors">📘</a>
              <a href="#" class="text-sage-green hover:text-cream-beige transition-colors">🐦</a>
              <a href="#" class="text-sage-green hover:text-cream-beige transition-colors">📷</a>
            </div>
          </div>
        </div>

        <div class="border-t border-olive-green/30 mt-8 pt-8 text-center text-sage-green text-sm">
          <p>&copy; 2026 CampConnect. All rights reserved. Your camping adventure starts here! 🏕️</p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
