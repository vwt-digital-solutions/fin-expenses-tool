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

const routes: Routes = [
  {
    path: 'expenses',
    component: ExpensesComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'home',
    component: LandingComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'auth/:authBody',
    component: AuthComponent,
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  {
    path: 'expenses/process',
    component: FinanceComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Creditor] }
  },
  {
    path: 'expenses/manage',
    component: ManagerComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Manager] }
  },
  {
    path: 'expenses/controller',
    component: ControllerComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Controller] }
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
