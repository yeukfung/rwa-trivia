import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { RouterExtensions } from 'nativescript-angular/router';
import * as Toast from 'nativescript-toast';
import { take, map, filter } from 'rxjs/operators';
import { CoreState, coreState, UIStateActions } from '../../store';
import { Store } from '@ngrx/store';
import { FirebaseAuthService } from './../../auth/firebase-auth.service';
import { Login } from './login';
import { Page } from 'tns-core-modules/ui/page';
import {LoadingIndicator} from "nativescript-loading-indicator";


@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent extends Login implements OnInit {

  title: string;
  loader = new LoadingIndicator();
  constructor(public fb: FormBuilder,
    public store: Store<CoreState>,
    private routerExtension: RouterExtensions,
    private uiStateActions: UIStateActions,
    private cdRef: ChangeDetectorRef,
    private page: Page,
    private firebaseAuthService: FirebaseAuthService) {
    super(fb, store);
    this.page.actionBarHidden = true;
  }

  ngOnInit() {
    this.title = 'Login';
    this.loginForm.get('mode').valueChanges.subscribe((mode: number) => {
      switch (mode) {
        case 1:
          // Sign up
          this.title = 'Get a bit wiser - Sign up';
          this.cdRef.detectChanges();
          break;
        // no break - fall thru
        case 0:
          // Login or Sign up
          this.title = 'Login';
          this.cdRef.detectChanges();
          break;
        default:
          // Forgot Password
          this.title = 'Forgot Password';
          this.cdRef.detectChanges();

      }
      this.loginForm.get('password').updateValueAndValidity();
    });


  }

  onSubmit() {
    this.loader.show();
    if (!this.loginForm.valid) {
      return;
    }

    switch (this.mode) {
      case 0:
        // Login
        this.firebaseAuthService.signInWithEmailAndPassword(
          this.loginForm.value.email,
          this.loginForm.value.password
        ).then((user: any) => {
          // Success
          this.redirectTo();
        }, (error: Error) => {
          // Error
          Toast.makeText(error.message).show();
        }).catch((error: Error) => {
          Toast.makeText(error.message).show();
        });
        break;
      case 1:
        // Sign up
        this.firebaseAuthService.createUserWithEmailAndPassword(
          this.loginForm.value.email,
          this.loginForm.value.password
        ).then((user: any) => {
          // Success
          if (user && !user.emailVerified) {
            this.firebaseAuthService.sendEmailVerification(user).then(
              (response) => {
                this.redirectTo();
              },
              (error) => {
                Toast.makeText(error.message).show();
              }
            );
          }
        }, (error: Error) => {
          Toast.makeText(error.message).show();
        }).catch((error: Error) => {
          Toast.makeText(error.message).show();
        });
        break;
      case 2:
        // Forgot Password
        this.firebaseAuthService.sendPasswordResetEmail(this.loginForm.value.email)
          .then((a: any) => {
            this.notificationMsg = `email sent to ${this.loginForm.value.email}`;
            Toast.makeText(this.notificationMsg).show();
            this.errorStatus = false;
            this.notificationLogs.push(this.loginForm.get('email').value);
            this.store.dispatch(this.uiStateActions.saveResetPasswordNotificationLogs([this.loginForm.get('email').value]));
          }, (error: Error) => {
            // Error
            Toast.makeText(error.message).show();
          }).catch((error: Error) => {
            Toast.makeText(error.message).show();
          });
    }

  }

  googleLogin() {
    this.firebaseAuthService.googleLogin().then(
      (result) => {
        this.redirectTo();
      },
      (errorMessage) => {
        Toast.makeText(errorMessage).show();
      }
    );
  }

  fbLogin() {
    this.firebaseAuthService.facebookLogin().then(
      (result) => {
        this.redirectTo();
      },
      (errorMessage) => {
        Toast.makeText(errorMessage).show();
      }
    );
  }

  redirectTo() {
    this.store.select(coreState).pipe(
      map(s => s.user),
      filter(u => (u != null && u.userId !== '')),
      take(1)).subscribe(() => {
        this.loader.hide();
        this.store.select(coreState).pipe(
          map(s => s.loginRedirectUrl), take(1)).subscribe(url => {
            const redirectUrl = url ? url : '/dashboard';
            Toast.makeText('You have been successfully logged in').show();
            this.routerExtension.navigate([redirectUrl], { clearHistory: true });
          });
      }
      );
  }

}

