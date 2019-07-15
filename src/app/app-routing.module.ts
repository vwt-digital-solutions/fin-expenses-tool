import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {ExpensesComponent} from './modules/expenses/expenses.component';
import {Role} from './models/role.enum';
import {AuthGuard} from './auth/auth.guard';

const routes: Routes = [
  {
    path: 'expenses',
    component: ExpensesComponent,
    canActivate: [AuthGuard],

  },
  {
    path: '',
    component: ExpensesComponent, // TODO: A landing page when the interfaces have to be different
    canActivate: [AuthGuard],
  },
  {
    path: 'process_expenses',
    component: ExpensesComponent,
    canActivate: [AuthGuard],
    data: {roles: [Role.Creditor, Role.Manager ]}
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
