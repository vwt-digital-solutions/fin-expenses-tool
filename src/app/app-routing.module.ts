import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExpensesComponent } from './components/expenses/expenses.component';
import { ManagerComponent } from './components/manager/manager.component';
import { FinanceComponent } from './components/finance/finance.component';
import { ControllerComponent } from './components/controller/controller.component';
import { LandingComponent } from './components/landing/landing.component';
import { Role } from './models/role.enum';
import { AuthGuard } from './auth/auth.guard';
import { AuthComponent } from './auth/auth.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { CostTypesResolver } from './services/cost-types.resolver';

const routes: Routes = [
  {
    path: 'expenses',
    canActivate: [AuthGuard],
    resolve: { costTypes: CostTypesResolver },
    children: [
      {
        path: 'employee',
        component: ExpensesComponent,
        resolve: { costTypes: CostTypesResolver },
      },
      {
        path: 'process',
        component: FinanceComponent,
        data: { roles: [Role.Creditor] },
        resolve: { costTypes: CostTypesResolver },
      },
      {
        path: 'manage',
        component: ManagerComponent,
        data: { roles: [Role.Manager, Role.LeaseCoordinator] },
        resolve: { costTypes: CostTypesResolver },
      },
      {
        path: 'controller',
        component: ControllerComponent,
        data: { roles: [Role.Controller] },
        resolve: { costTypes: CostTypesResolver },
      }
    ]
  },
  {
    path: 'home',
    component: LandingComponent,
    canActivate: [AuthGuard],
    resolve: { costTypes: CostTypesResolver },
  },
  {
    path: 'auth/:authBody',
    component: AuthComponent,
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [
    CostTypesResolver
  ]
})
export class AppRoutingModule { }
