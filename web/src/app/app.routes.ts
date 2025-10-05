import { Routes } from '@angular/router';
import {Create} from './page/account/create/create';
import {Login} from './page/login/login';

export const routes: Routes = [
  {path: '', component: Login},
  {path: 'account/create', component: Create},
];
