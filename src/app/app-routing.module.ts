import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ExpensesComponent } from './modules/expenses/expenses.component';
import { Role } from './models/role.enum';
import {AuthGuard} from './auth/auth.guard';

const routes: Routes = [
  {
    path: 'expenses',
    component: ExpensesComponent,
    canActivate: [AuthGuard],
    data: { roles: [Role.Reader]}

  },
  {
    path: 'process_expenses',
    component: ExpensesComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
