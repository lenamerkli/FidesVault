import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../../utils/api_url';
import {Router, RouterLink} from '@angular/router';
import {AccountService} from '../../service/account';
import {pbkdf2HmacUrlSafe} from '../../utils/hash';
import {Fernet} from 'fernet-ts';
import { isPlatformBrowser } from '@angular/common';

interface ResponseDto{
  success: string;
  cipher: string;
  salt: string;
}

interface CipherResponseDto{
  cipher: string;
  salt: string;
}

interface CheckResponseDto{
  email: string;
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
export class Login implements OnInit {
  loginForm!: FormGroup;
  isLoggedIn = false;

  constructor(private formBuilder: FormBuilder, private http: HttpClient, private accountService: AccountService, private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {
    this.initializeForm(false);
  }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      console.log('Start checking email')
      this.http.post<CheckResponseDto>(API_BASE_URL + '/api/v1/account/check', '').subscribe({
        next: (response) => {
          console.log('Checked email')
          if (response.email) {
            this.isLoggedIn = true;
            this.initializeForm(true);
          }
        },
        error: (error) => {
          console.error('Check failed', error);
        }
      });
    }
  }

  private initializeForm(isUnlock: boolean): void {
    if (isUnlock) {
      this.loginForm = this.formBuilder.group({
        password: ['', [Validators.required]]
      });
    } else {
      this.loginForm = this.formBuilder.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]],
        totpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
      });
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const formData = this.loginForm.value;
      if (this.isLoggedIn) {
        // Unlock logic
        this.http.get<CipherResponseDto>(API_BASE_URL + '/api/v1/account/cipher').subscribe({
          next: async (response) => {
            const key = await pbkdf2HmacUrlSafe('o7C@' + formData.password + 'Lö§s', response.salt, 152734, 256);
            const f = await Fernet.getInstance(key);
            const data = await f.decrypt(response.cipher);
            this.accountService.setAccountInfo(JSON.parse(data));
            this.router.navigate(['/home']);
          },
          error: (error) => {
            console.error('Unlock failed', error);
            // Handle error, e.g., show message
          }
        });
      } else {
        // Login logic
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
            this.router.navigate(['/home']);
          },
          error: (error) => {
            console.error('Login failed', error);
            // Handle error, e.g., show message
          }
        });
      }
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
