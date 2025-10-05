import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService{
  private accountInfo: BehaviorSubject<AccountDto | null> = new BehaviorSubject<AccountDto | null>(null);

  getAccountInfo(): Observable<AccountDto | null> {
    return this.accountInfo.asObservable();
  }

  setAccountInfo(accountInfo: AccountDto | null): void {
    this.accountInfo.next(accountInfo);
  }
}

export interface AccountDto{
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  title: string;
  gender: string;
  country: string;
  legalNameDifferent: boolean;
  legalFirstName: string;
  legalLastName: string;
  legalGender: string;
}
