import { Toaster } from 'src/app/services/toaster.service';
import { HttpClient } from '@angular/common/http';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { first } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { environment } from 'src/environments/environment';
import { RecaptchaComponent } from 'ng-recaptcha';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  @ViewChild('regCaptcha') regCaptcha: RecaptchaComponent;
  @ViewChild('forgotCaptcha') forgotCaptcha: RecaptchaComponent;
  loginForm: FormGroup;
  regForm: FormGroup;
  forgotForm: FormGroup;
  panel: string = 'login';
  message = {
    type: '',
    text: ''
  }
  CAPTCHA_SITE_KEY: string = environment.CAPTCHA_SITE_KEY;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { action: string },
    private httpClient: HttpClient,
    fb: FormBuilder,
    private authService: AuthService,
    private toaster: Toaster,
    private dialogRef: MatDialogRef<LoginComponent>) {

    this.loginForm = fb.group({
      email: ['', [Validators.required, Validators.email]],
      psd: ['', Validators.required]
    });
    this.regForm = fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email]],
      psd: ['', Validators.required],
      captchaCode: ['']
    });
    this.forgotForm = fb.group({
      email: ['', [Validators.required, Validators.email]],
      captchaCode: ['']
    });

    this.panel = data.action ?? 'login';

  }

  ngOnInit(): void {
  }

  login() {
    if (!this.loginForm.valid) return;
    this.setMesssage('info', 'Logging in...');
    this.loginForm.disable();
    var { email, psd } = this.loginForm.value;
    this.authService.login(email, psd)
      .pipe(first())
      .subscribe(data => {
        this.toaster.success('Login successful.');
        this.dialogRef.close();
      },
        error => {
          console.error('login error', error)
          this.setMesssage('error', error, true);
          this.loginForm.enable();
        })
  }

  register() {
    if (!this.regForm.valid) return;
    this.setMesssage('info', 'Registering...');
    var { name, email, psd, captchaCode } = this.regForm.value;
    if (!captchaCode) {
      this.setMesssage('error', 'Please solve the captcha.');
      return;
    }
    this.regForm.disable();
    this.authService.register(name, email, psd, captchaCode)
      .pipe(first())
      .subscribe(data => {
        this.setMesssage(data.status, data.desc);
        this.regForm.enable();
        this.regCaptcha.reset()
      },
        error => {
          console.error('registration error', error)
          this.setMesssage('error', error, true);
          this.regForm.enable();
          this.regCaptcha.reset();
        });
  }

  forgotPsd() {
    if (!this.forgotForm.valid) return;
    this.setMesssage('info', 'Requesting password reset link ...');
    var { email, captchaCode } = this.forgotForm.value;
    if (!captchaCode) {
      this.setMesssage('error', 'Please solve the captcha.');
      return;
    }
    this.forgotForm.disable();
    this.authService.forgotPds(email, captchaCode)
      .pipe(first())
      .subscribe(data => {
        this.setMesssage(data.status, data.desc);
        this.forgotForm.enable();
        this.forgotCaptcha.reset()
      },
        error => {
          console.error('forgot psd error', error)
          this.setMesssage('error', error, true);
          this.forgotForm.enable();
          this.forgotCaptcha.reset();
        });
  }

  setMesssage(type, text, autoClear?: boolean) {
    this.message = { type, text };
    if (autoClear) {
      setTimeout(() => {
        this.setMesssage('', '');
      }, 5000);
    }
  }
}
