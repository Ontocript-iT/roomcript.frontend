import { Component, OnInit } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgxTurnstileModule } from 'ngx-turnstile';

import { AuthService } from '../../../core/services/auth.service';
import { IdleService } from '../../../core/services/idle.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    NgOptimizedImage,
    NgxTurnstileModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;
  errorMessage = '';
  isLoading = false;
  siteKey = '3x00000000000000000000FF';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private idleService: IdleService
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      usernameOrEmail: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      turnstileToken: ['', Validators.required]
    });
  }

  onTurnstileResolved(token: string | null): void {
    if (token) {
      this.loginForm.patchValue({ turnstileToken: token });
      this.loginForm.get('turnstileToken')?.updateValueAndValidity();
    } else {
      this.loginForm.patchValue({ turnstileToken: null });
    }
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.idleService.startWatching();
          const roles = this.authService.getUserRoles();

          if (roles.includes('ADMIN')) {
            this.router.navigate(['/stayView']);
            console.log("correct navigation");
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error?.message || 'Invalid username or password';
          this.loginForm.get('turnstileToken')?.reset();
        }
      });
    }
  }
}
