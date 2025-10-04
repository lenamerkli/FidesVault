import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import {MatCheckbox} from '@angular/material/checkbox';
import { zxcvbn, zxcvbnOptions } from '@zxcvbn-ts/core';
import * as zxcvbnCommonPackage from '@zxcvbn-ts/language-common';

export interface AccountFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  repeatPassword: string;
  dateOfBirth: Date;
  title: string;
  gender: string;
  country: string;
  legalNameDifferent: boolean;
  legalFirstName?: string;
  legalLastName?: string;
  legalGender?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-create',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCheckbox,
  ],
  templateUrl: './create.html',
  styleUrl: './create.scss'
})
export class Create implements OnInit {
  accountForm!: FormGroup;

  // Password strength properties
  ratingMessage: string = '';
  passwordStrength: 'very-weak' | 'weak' | 'acceptable' | 'strong' | '' = '';

  // Constants for form options
  readonly titleOptions: SelectOption[] = [
    { value: 'mr', label: 'Mr' },
    { value: 'mrs', label: 'Mrs' },
    { value: 'miss', label: 'Miss' },
    { value: 'ms', label: 'Ms' },
    { value: 'dr', label: 'Dr' },
    { value: 'prof', label: 'Prof' },
    { value: 'mx', label: 'Mx' }
  ];

  readonly genderOptions: SelectOption[] = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'non-binary', label: 'Non-binary' },
  ];

  readonly countryOptions: SelectOption[] = [
    { value: 'AF', label: 'Afghanistan' },
    { value: 'AO', label: 'Angola' },
    { value: 'AR', label: 'Argentina' },
    { value: 'AT', label: 'Austria' },
    { value: 'AU', label: 'Australia' },
    { value: 'BD', label: 'Bangladesh' },
    { value: 'BE', label: 'Belgium' },
    { value: 'BF', label: 'Burkina Faso' },
    { value: 'BG', label: 'Bulgaria' },
    { value: 'BI', label: 'Burundi' },
    { value: 'BO', label: 'Bolivia' },
    { value: 'BR', label: 'Brazil' },
    { value: 'BT', label: 'Bhutan' },
    { value: 'BW', label: 'Botswana' },
    { value: 'BY', label: 'Belarus' },
    { value: 'CA', label: 'Canada' },
    { value: 'CD', label: 'Democratic Republic of Congo' },
    { value: 'CF', label: 'Central African Republic' },
    { value: 'CG', label: 'Congo' },
    { value: 'CH', label: 'Switzerland' },
    { value: 'CI', label: 'Ivory Coast' },
    { value: 'CL', label: 'Chile' },
    { value: 'CM', label: 'Cameroon' },
    { value: 'CN', label: 'China (Mainland)' },
    { value: 'CO', label: 'Colombia' },
    { value: 'CV', label: 'Cape Verde' },
    { value: 'CY', label: 'Cyprus' },
    { value: 'CZ', label: 'Czech Republic' },
    { value: 'DE', label: 'Germany' },
    { value: 'DJ', label: 'Djibouti' },
    { value: 'DK', label: 'Denmark' },
    { value: 'DZ', label: 'Algeria' },
    { value: 'EC', label: 'Ecuador' },
    { value: 'EE', label: 'Estonia' },
    { value: 'EG', label: 'Egypt' },
    { value: 'EH', label: 'Sahrawi Arab Democratic Republic / Western Sahara' },
    { value: 'ER', label: 'Eritrea' },
    { value: 'ES', label: 'Spain' },
    { value: 'ET', label: 'Ethiopia' },
    { value: 'FI', label: 'Finland' },
    { value: 'FR', label: 'France' },
    { value: 'GA', label: 'Gabon' },
    { value: 'GH', label: 'Ghana' },
    { value: 'GM', label: 'Gambia' },
    { value: 'GN', label: 'Guinea' },
    { value: 'GR', label: 'Greece' },
    { value: 'GW', label: 'Guinea-Bissau' },
    { value: 'GY', label: 'Guyana' },
    { value: 'HK', label: 'Hong Kong' },
    { value: 'HR', label: 'Croatia' },
    { value: 'HU', label: 'Hungary' },
    { value: 'ID', label: 'Indonesia' },
    { value: 'IE', label: 'Ireland' },
    { value: 'IL', label: 'Israel' },
    { value: 'IN', label: 'India' },
    { value: 'IQ', label: 'Iraq' },
    { value: 'IR', label: 'Iran' },
    { value: 'IT', label: 'Italy' },
    { value: 'JO', label: 'Jordan' },
    { value: 'JP', label: 'Japan' },
    { value: 'KE', label: 'Kenya' },
    { value: 'KG', label: 'Kyrgyzstan' },
    { value: 'KM', label: 'Comoros' },
    { value: 'KR', label: 'South Korea' },
    { value: 'KZ', label: 'Kazakhstan' },
    { value: 'LB', label: 'Lebanon' },
    { value: 'LK', label: 'Sri Lanka' },
    { value: 'LR', label: 'Liberia' },
    { value: 'LS', label: 'Lesotho' },
    { value: 'LT', label: 'Lithuania' },
    { value: 'LU', label: 'Luxembourg' },
    { value: 'LV', label: 'Latvia' },
    { value: 'LY', label: 'Libya' },
    { value: 'MA', label: 'Morocco' },
    { value: 'MG', label: 'Madagascar' },
    { value: 'ML', label: 'Mali' },
    { value: 'MN', label: 'Mongolia' },
    { value: 'MO', label: 'Macau' },
    { value: 'MR', label: 'Mauritania' },
    { value: 'MT', label: 'Malta' },
    { value: 'MU', label: 'Mauritius' },
    { value: 'MV', label: 'Maldives' },
    { value: 'MW', label: 'Malawi' },
    { value: 'MX', label: 'Mexico' },
    { value: 'MY', label: 'Malaysia' },
    { value: 'MZ', label: 'Mozambique' },
    { value: 'NA', label: 'Namibia' },
    { value: 'NE', label: 'Niger' },
    { value: 'NG', label: 'Nigeria' },
    { value: 'NL', label: 'Netherlands' },
    { value: 'NO', label: 'Norway' },
    { value: 'NP', label: 'Nepal' },
    { value: 'PE', label: 'Peru' },
    { value: 'PH', label: 'Philippines' },
    { value: 'PK', label: 'Pakistan' },
    { value: 'PL', label: 'Poland' },
    { value: 'PS', label: 'Palestine'},
    { value: 'PT', label: 'Portugal' },
    { value: 'PY', label: 'Paraguay' },
    { value: 'RO', label: 'Romania' },
    { value: 'RU', label: 'Russia' },
    { value: 'RW', label: 'Rwanda' },
    { value: 'SC', label: 'Seychelles' },
    { value: 'SD', label: 'Sudan' },
    { value: 'SE', label: 'Sweden' },
    { value: 'SG', label: 'Singapore' },
    { value: 'SI', label: 'Slovenia' },
    { value: 'SK', label: 'Slovakia' },
    { value: 'SL', label: 'Sierra Leone' },
    { value: 'SN', label: 'Senegal' },
    { value: 'SO', label: 'Somalia' },
    { value: 'SR', label: 'Suriname' },
    { value: 'SS', label: 'South Sudan' },
    { value: 'ST', label: 'São Tomé and Príncipe' },
    { value: 'SY', label: 'Syria' },
    { value: 'SZ', label: 'Eswatini' },
    { value: 'TD', label: 'Chad' },
    { value: 'TH', label: 'Thailand' },
    { value: 'TJ', label: 'Tajikistan' },
    { value: 'TM', label: 'Turkmenistan' },
    { value: 'TN', label: 'Tunisia' },
    { value: 'TR', label: 'Turkey' },
    { value: 'TW', label: 'Republic of China / Taiwan' },
    { value: 'TZ', label: 'Tanzania' },
    { value: 'UA', label: 'Ukraine' },
    { value: 'UG', label: 'Uganda' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'US', label: 'United States' },
    { value: 'UY', label: 'Uruguay' },
    { value: 'UZ', label: 'Uzbekistan' },
    { value: 'VA', label: 'Holy Sea'},
    { value: 'VE', label: 'Venezuela' },
    { value: 'VN', label: 'Vietnam' },
    { value: 'XK', label: 'Kosovo'},
    { value: 'ZA', label: 'South Africa' },
    { value: 'ZW', label: 'Zimbabwe' }
  ].sort((a, b) => a.label.localeCompare(b.label));

  constructor(private formBuilder: FormBuilder) {
    // Configure zxcvbn with common language support
    zxcvbnOptions.setOptions({
      dictionary: {
        ...zxcvbnCommonPackage.dictionary,
      },
      graphs: zxcvbnCommonPackage.adjacencyGraphs,
    });
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.accountForm = this.formBuilder.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, this.passwordStrengthValidator]],
      repeatPassword: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      title: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      country: ['', [Validators.required]],
      legalNameDifferent: [false],
      legalFirstName: [''],
      legalLastName: [''],
      legalGender: ['']
    }, { validators: this.passwordMatchValidator });

    // Set up autofill logic for legal name fields
    this.setupLegalNameAutofill();

    // Set up password confirmation validation
    this.setupPasswordConfirmation();

    // Set up password strength checking
    this.setupPasswordStrengthChecking();
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const repeatPassword = form.get('repeatPassword');

    if (password && repeatPassword && password.value !== repeatPassword.value) {
      return { passwordMismatch: true };
    }

    return null;
  }

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value;

    if (!password) {
      return null;
    }

    // Use zxcvbn to check password strength without user inputs for validation
    // The updateRating method will use user inputs for the visual indicator
    const result = zxcvbn(password);

    // Only allow passwords that are at least "acceptable" (guessesLog10 >= 14)
    if (result.guessesLog10 < 14) {
      return { passwordTooWeak: true };
    }

    return null;
  }

  private setupPasswordConfirmation(): void {
    const passwordControl = this.accountForm.get('password');
    const repeatPasswordControl = this.accountForm.get('repeatPassword');

    if (passwordControl && repeatPasswordControl) {
      // Watch for changes to password and validate repeat password
      passwordControl.valueChanges.subscribe(() => {
        if (repeatPasswordControl.value) {
          repeatPasswordControl.updateValueAndValidity();
        }
      });

      // Watch for changes to repeat password and validate match
      repeatPasswordControl.valueChanges.subscribe(() => {
        if (passwordControl.value) {
          repeatPasswordControl.updateValueAndValidity();
        }
      });
    }
  }

  private setupPasswordStrengthChecking(): void {
    const passwordControl = this.accountForm.get('password');

    if (passwordControl) {
      passwordControl.valueChanges.subscribe(value => {
        this.updateRating();
      });
    }
  }

  private updateRating(): void {
    const password = this.accountForm.get('password')?.value;

    if (!password) {
      this.ratingMessage = '';
      this.passwordStrength = '';
      return;
    }

    // Get user inputs for zxcvbn (excluding password field)
    const userInputs = this.getUserInputs();

    // Use zxcvbn to analyze password strength
    const result = zxcvbn(password, userInputs);

    // Update rating based on guessesLog10
    if (result.guessesLog10 < 8) {
      this.ratingMessage = 'Very weak';
      this.passwordStrength = 'very-weak';
    } else if (result.guessesLog10 < 16) {
      this.ratingMessage = 'Weak';
      this.passwordStrength = 'weak';
    } else if (result.guessesLog10 < 24) {
      this.ratingMessage = 'Acceptable';
      this.passwordStrength = 'acceptable';
    } else {
      this.ratingMessage = 'Strong';
      this.passwordStrength = 'strong';
    }
  }

  private getUserInputs(): string[] {
    const inputs: string[] = [];

    if (!this.accountForm) {
      return inputs;
    }

    const formValues = this.accountForm.value;

    // Add all form fields except password and repeatPassword
    Object.keys(formValues).forEach(key => {
      if (key !== 'password' && key !== 'repeatPassword' && formValues[key]) {
        inputs.push(formValues[key].toString());
      }
    });

    return inputs;
  }

  private setupLegalNameAutofill(): void {
    // Watch for changes to the legal name checkbox
    this.accountForm.get('legalNameDifferent')?.valueChanges.subscribe(checked => {
      if (checked) {
        // When checkbox is checked, autofill legal name fields with current values
        const firstName = this.accountForm.get('firstName')?.value;
        const lastName = this.accountForm.get('lastName')?.value;
        const gender = this.accountForm.get('gender')?.value;

        this.accountForm.patchValue({
          legalFirstName: firstName,
          legalLastName: lastName,
          legalGender: gender
        });

        // Add required validation to legal name fields
        this.addLegalNameValidation();
      } else {
        // Remove required validation when checkbox is unchecked
        this.removeLegalNameValidation();
      }
    });
  }

  private addLegalNameValidation(): void {
    const legalFirstNameControl = this.accountForm.get('legalFirstName');
    const legalLastNameControl = this.accountForm.get('legalLastName');
    const legalGenderControl = this.accountForm.get('legalGender');

    if (legalFirstNameControl) {
      legalFirstNameControl.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(50)]);
      legalFirstNameControl.updateValueAndValidity();
    }

    if (legalLastNameControl) {
      legalLastNameControl.setValidators([Validators.required, Validators.minLength(2), Validators.maxLength(50)]);
      legalLastNameControl.updateValueAndValidity();
    }

    if (legalGenderControl) {
      legalGenderControl.setValidators([Validators.required]);
      legalGenderControl.updateValueAndValidity();
    }
  }

  private removeLegalNameValidation(): void {
    const legalFirstNameControl = this.accountForm.get('legalFirstName');
    const legalLastNameControl = this.accountForm.get('legalLastName');
    const legalGenderControl = this.accountForm.get('legalGender');

    if (legalFirstNameControl) {
      legalFirstNameControl.clearValidators();
      legalFirstNameControl.updateValueAndValidity();
    }

    if (legalLastNameControl) {
      legalLastNameControl.clearValidators();
      legalLastNameControl.updateValueAndValidity();
    }

    if (legalGenderControl) {
      legalGenderControl.clearValidators();
      legalGenderControl.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.accountForm.valid) {
      const formData: AccountFormData = this.accountForm.value;
      console.log('Form submitted with data:', formData);

      // Here you would typically send the data to your backend service
      // For now, we'll just log it and show a success message
      this.handleFormSubmission(formData);
    } else {
      this.markFormGroupTouched();
    }
  }

  private handleFormSubmission(formData: AccountFormData): void {
    // TODO: Implement actual API call to submit form data
    console.log('Submitting account creation data:', formData);

    // For demonstration purposes, we'll show an alert
    // In a real application, you would navigate to a success page or show a success message
    alert('Account creation form submitted successfully!\n\n' +
          `Email: ${formData.email}\n` +
          `Title: ${this.getTitleLabel(formData.title)}\n` +
          `First Name: ${formData.firstName}\n` +
          `Last Name: ${formData.lastName}\n` +
          `Date of Birth: ${formData.dateOfBirth.toISOString().split('T')[0]}\n` +
          `Gender: ${this.getGenderLabel(formData.gender)}\n` +
          `Country: ${this.getCountryName(formData.country)}`);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.accountForm.controls).forEach(key => {
      const control = this.accountForm.get(key);
      control?.markAsTouched();
    });
  }

  private getCountryName(countryCode: string): string {
    const countryOption = this.countryOptions.find(option => option.value === countryCode);
    return countryOption ? countryOption.label : countryCode;
  }

  private getGenderLabel(genderValue: string): string {
    const genderOption = this.genderOptions.find(option => option.value === genderValue);
    return genderOption ? genderOption.label : genderValue;
  }

  private getTitleLabel(titleValue: string): string {
    const titleOption = this.titleOptions.find(option => option.value === titleValue);
    return titleOption ? titleOption.label : titleValue;
  }

  // Getter methods for template access
  get firstName() { return this.accountForm.get('firstName'); }
  get lastName() { return this.accountForm.get('lastName'); }
  get email() { return this.accountForm.get('email'); }
  get password() { return this.accountForm.get('password'); }
  get repeatPassword() { return this.accountForm.get('repeatPassword'); }
  get dateOfBirth() { return this.accountForm.get('dateOfBirth'); }
  get title() { return this.accountForm.get('title'); }
  get gender() { return this.accountForm.get('gender'); }
  get country() { return this.accountForm.get('country'); }
  get legalNameDifferent() { return this.accountForm.get('legalNameDifferent') as FormControl; }
  get legalFirstName() { return this.accountForm.get('legalFirstName'); }
  get legalLastName() { return this.accountForm.get('legalLastName'); }
  get legalGender() { return this.accountForm.get('legalGender'); }
}
