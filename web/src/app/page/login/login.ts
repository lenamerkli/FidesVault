import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../utils/api_url';
import {RouterLink} from '@angular/router';
import {AccountService} from '../../service/account';
import {pbkdf2HmacUrlSafe} from '../../utils/hash';
import {Fernet} from 'fernet-ts';

interface ResponseDto{
  success: string;
  cipher: string;
  salt: string;
}

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  loginForm!: FormGroup;

  constructor(private formBuilder: FormBuilder, private http: HttpClient, private accountService: AccountService) {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      totpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      this.http.post<ResponseDto>(API_BASE_URL + '/api/v1/account/login', {
        email: formData.email,
        password: formData.password,
        code: formData.totpCode
      }).subscribe({
        next: async (response) => {
          const key = await pbkdf2HmacUrlSafe('o7C@' + formData.password + 'Lö§s', response.salt, 152734, 256);
          const f = await Fernet.getInstance(key);
          const data = await f.decrypt(response.cipher);
          this.accountService.setAccountInfo(JSON.parse(data));
        },
        error: (error) => {
          console.error('Login failed', error);
          // Handle error, e.g., show message
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  get totpCode() { return this.loginForm.get('totpCode'); }
}
