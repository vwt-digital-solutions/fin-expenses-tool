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
    canActivate: [AuthGuard],
    children: [
      {
        path: 'employee',
        component: ExpensesComponent,
      },
      {
        path: 'process',
        component: FinanceComponent,
        data: { roles: [Role.Creditor] }
      },
      {
        path: 'manage',
        component: ManagerComponent,
        data: { roles: [Role.Manager] }
      },
      {
        path: 'controller',
        component: ControllerComponent,
        data: { roles: [Role.Controller] }
      }
    ]
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
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
