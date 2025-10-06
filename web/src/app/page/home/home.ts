import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { API_BASE_URL } from '../../utils/api_url';
import { AccountService, AccountDto } from '../../service/account';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit, OnDestroy {
  accountInfo: AccountDto | null = null;
  sendForm!: FormGroup;
  private subscription: Subscription = new Subscription();

  constructor(private accountService: AccountService, private formBuilder: FormBuilder, private http: HttpClient, private router: Router) {
    this.sendForm = this.formBuilder.group({
      data: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.subscription.add(
      this.accountService.getAccountInfo().subscribe(info => {
        this.accountInfo = info;
        if (!info) {
          this.router.navigate(['/']).then();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  onSend(): void {
    if (this.sendForm.valid) {
      const formData = this.sendForm.value;
      this.http.post(API_BASE_URL + '/api/v1/send', { data: formData.data }).subscribe({
        next: (response) => {
          console.log('Data sent', response);
          this.sendForm.reset();
        },
        error: (error) => {
          console.error('Send failed', error);
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.sendForm.controls).forEach(key => {
      const control = this.sendForm.get(key);
      control?.markAsTouched();
    });
  }
}
