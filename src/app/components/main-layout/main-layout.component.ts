import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavigationComponent } from '../navigation/navigation.component';
import { FooterComponent } from '../footer/footer.component';
import { NotificationComponent } from '../notification/notification.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [NavigationComponent, FooterComponent, NotificationComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {}
