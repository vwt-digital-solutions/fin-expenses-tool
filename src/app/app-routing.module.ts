import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ExpensesComponent} from './modules/expenses/expenses.component';
import {ManagerComponent} from './modules/manager/manager.component';
import {FinanceComponent} from './modules/finance/finance.component';
import {ControllerComponent} from './modules/controller/controller.component';
import {Role} from './models/role.enum';
import {AuthGuard} from './auth/auth.guard';
import {AuthComponent} from './auth/auth.component';

const routes: Routes = [
  {
    path: 'expenses',
    component: ExpensesComponent,
    canActivate: [AuthGuard],
  },
  {
      path: 'auth/:authBody',
      component: AuthComponent,
  },
  { path: '', redirectTo: 'expenses', pathMatch: 'full' },
  {
    path: 'expenses/process',
    component: FinanceComponent,
    canActivate: [AuthGuard],
    data: {roles: [Role.Creditor]}
  },
  {
    path: 'expenses/manage',
    component: ManagerComponent,
    canActivate: [AuthGuard],
    data: {roles: [Role.Manager]}
  },
  {
    path: 'expenses/controller',
    component: ControllerComponent,
    canActivate: [AuthGuard],
    data: {roles: [Role.Manager]}
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
