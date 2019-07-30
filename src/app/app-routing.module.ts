import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ExpensesComponent} from './modules/expenses/expenses.component';
import {FinanceComponent} from './modules/finance/finance.component';
import {Role} from './models/role.enum';
import {AuthGuard} from './auth/auth.guard';
import { AuthComponent } from './auth/auth.component';

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
  {
    path: '**',
    redirectTo: '/expenses'
  },
  {
    path: 'process_expenses',
    component: FinanceComponent,
    canActivate: [AuthGuard],
    data: {roles: [Role.Creditor, Role.Manager ]}
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
