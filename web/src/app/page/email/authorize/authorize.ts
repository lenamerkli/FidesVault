import { Component } from '@angular/core';
import {AccountDto} from "../../../service/account";
import {AccountService} from "../../../service/account";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {AuthToken} from "../../../type/auth_token";
import {HttpClient} from "@angular/common/http";
import {MatButton} from "@angular/material/button";
import {MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardTitle} from '@angular/material/card';

interface ResponseDto {
  success: string;
}

@Component({
  selector: 'app-authorize',
  imports: [RouterLink, MatButton, MatCardActions, MatCardContent, MatCardTitle, MatCard, MatCardHeader],
  templateUrl: './authorize.html',
  styleUrl: './authorize.scss'
})
export class Authorize {
  account: AccountDto | null = null;
  token: AuthToken | null = null;
  invalid = false;

  constructor(
    private readonly accountService: AccountService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly httpClient: HttpClient,
  ) {
    this.accountService.getAccountInfo().subscribe((value: AccountDto | null) => {
      this.account = value;
    });
    this.activatedRoute.params.subscribe(value => {
      try {
        const tokenString = value['token'];
        console.log(tokenString);
        this.token = new AuthToken(tokenString);
        const url = new URL(this.token.getUrl());
        const redirect = new URL(this.token.getRedirect());
        if (url.hostname !== redirect.hostname) {
          this.invalid = true;
        }
      } catch (e) {
        console.log(e);
        this.invalid = true;
      }
    });
  }

  authorize() {
    if (this.account !== null && this.token !== null && !this.invalid) {
      this.httpClient.post<ResponseDto>('/api/v1/email/authorize', JSON.stringify({
        url: this.token.getUrl(),
        token: this.token.getSecret(),
      }), {headers: {'Content-Type': 'application/json'}}).subscribe({
        next: response => {
          window.location.href = this.token!.getRedirect();
        },
        error: error => {
          console.log(error);
        }
      });
    } else {
      this.invalid = true;
    }
  }

  cancel() {
    this.router.navigate(['/']).then();
  }
}
