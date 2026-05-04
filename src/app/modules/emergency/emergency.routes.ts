import { Routes } from '@angular/router';
import { AlerteListComponent } from './components/alerte-list/alerte-list.component';
import { AlerteCreateComponent } from './components/alerte-create/alerte-create.component';
import { AlerteDetailComponent } from './components/alerte-detail/alerte-detail.component';
import { AlerteDashboardComponent } from './components/alerte-dashboard/alerte-dashboard.component';
import { AlerteStatsComponent } from './components/alerte-stats/alerte-stats.component';
import { AlerteAdvancedComponent } from './components/alerte-advanced/alerte-advanced.component';
import { ProtocoleListComponent } from './components/protocole-list/protocole-list.component';
import { ProtocoleCreateComponent } from './components/protocole-create/protocole-create.component';
import { ProtocoleEditComponent } from './components/protocole-edit/protocole-edit.component';
import { ProtocoleDetailComponent } from './components/protocole-detail/protocole-detail.component';
import { InterventionListComponent } from './components/intervention-list/intervention-list.component';
import { InterventionCreateComponent } from './components/intervention-create/intervention-create.component';

import { AdminGuard, CamperGuard } from '../../guards/role.guard';

export const EMERGENCY_ROUTES: Routes = [
    { path: '', redirectTo: 'list', pathMatch: 'full' },
    { path: 'list', component: AlerteListComponent }, // Campers and Admins can view this
    { path: 'dashboard', component: AlerteDashboardComponent, canActivate: [AdminGuard] },
    { path: 'stats', component: AlerteStatsComponent, canActivate: [AdminGuard] },
    { path: 'advanced', component: AlerteAdvancedComponent, canActivate: [AdminGuard] },
    { path: 'create', component: AlerteCreateComponent, canActivate: [CamperGuard] },
    { path: 'detail/:id', component: AlerteDetailComponent }, // Detail can have internal checks

    // Protocols
    { path: 'protocols', component: ProtocoleListComponent }, // Both can see the list
    { path: 'protocols/create', component: ProtocoleCreateComponent, canActivate: [AdminGuard] },
    { path: 'protocols/edit/:id', component: ProtocoleEditComponent, canActivate: [AdminGuard] },
    { path: 'protocols/:id', component: ProtocoleDetailComponent }, // Both can view details

    // Interventions
    { path: 'interventions/:alertId', component: InterventionListComponent, canActivate: [AdminGuard] },
    { path: 'interventions/create/:alertId', component: InterventionCreateComponent, canActivate: [AdminGuard] }
];
