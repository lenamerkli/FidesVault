import { Routes } from '@angular/router';
import {Create} from './page/account/create/create';
import {Login} from './page/login/login';
import {Home} from './page/home/home';
import {Authorize} from './page/email/authorize/authorize';

export const routes: Routes = [
  {path: '', component: Login},
  {path: 'home', component: Home},
  {path: 'account/create', component: Create},
  {path: 'email/authorize/:token', component: Authorize},
];
