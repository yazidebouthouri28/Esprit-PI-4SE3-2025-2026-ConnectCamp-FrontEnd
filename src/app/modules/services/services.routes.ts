import { Routes } from '@angular/router';
import { ParticipantGuard } from '../../guards/participant.guard';
import { ServiceListComponent } from './components/service-list/service-list.component';
import { ServiceCreateComponent } from './components/service-create/service-create.component';
import { ServiceEditComponent } from './components/service-edit/service-edit.component';
import { PackListComponent } from './components/pack-list/pack-list.component';
import { PackCreateComponent } from './components/pack-create/pack-create.component';
import { PackEditComponent } from './components/pack-edit/pack-edit.component';
import { PromotionListComponent } from './components/promotion-list/promotion-list.component';
import { PromotionCreateComponent } from './components/promotion-create/promotion-create.component';
import { PromotionEditComponent } from './components/promotion-edit/promotion-edit.component';
import { CandidatureListComponent } from './components/candidature-list/candidature-list.component';
import { CandidatureManageComponent } from './components/candidature-manage/candidature-manage.component';
import { PackStatsComponent } from './components/pack-stats/pack-stats.component';
import { PackAdvancedComponent } from './components/pack-advanced/pack-advanced.component';

import { ServiceHomeComponent } from './components/service-home/service-home.component';

export const SERVICES_ROUTES: Routes = [
    { path: '', redirectTo: 'home', pathMatch: 'full' },
    { path: 'home', component: ServiceHomeComponent },
    { path: 'list', component: ServiceListComponent },
    { path: 'create', component: ServiceCreateComponent },
    { path: 'edit/:id', component: ServiceEditComponent },
    { path: 'packs', component: PackListComponent },
    { path: 'packs/advanced', component: PackAdvancedComponent },
    { path: 'packs/create', component: PackCreateComponent },
    { path: 'packs/edit/:id', component: PackEditComponent },
    { path: 'promotions', component: PromotionListComponent },
    { path: 'promotions/create', component: PromotionCreateComponent },
    { path: 'promotions/edit/:id', component: PromotionEditComponent },
    { path: 'candidatures', component: CandidatureListComponent, canActivate: [ParticipantGuard] },
    { path: 'candidatures/manage', component: CandidatureManageComponent }
];
