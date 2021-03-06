import { Component, OnInit, NgZone, OnDestroy } from '@angular/core';
import * as firebase from 'nativescript-plugin-firebase';
import { Store, select } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppState } from '../../store';
import * as gamePlayActions from '../../game-play/store/actions';
import { RouterExtensions } from 'nativescript-angular/router';
import * as Platform from 'platform';
import {
  android, AndroidActivityBackPressedEventData, AndroidApplication
} from "application";
import { NavigationService } from 'shared-library/core/services/mobile/navigation.service'
import { coreState } from 'shared-library/core/store';
import { Utils } from 'shared-library/core/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})

export class AppComponent implements OnInit, OnDestroy {

  sub3: Subscription;
  sub4: Subscription;
  constructor(private store: Store<AppState>,
    private navigationService: NavigationService,
    private ngZone: NgZone,
    private routerExtension: RouterExtensions,
    private utils: Utils) {
    this.sub3 = this.store.select(coreState).pipe(select(s => s.newGameId), filter(g => g !== '')).subscribe(gameObj => {
      this.routerExtension.navigate(['/game-play', gameObj['gameId']]);
      this.store.dispatch(new gamePlayActions.ResetCurrentQuestion());
    });

    this.sub4 = this.store.select(coreState).pipe(select(s => s.userProfileSaveStatus)).subscribe(status => {
      if (status === 'MAKE FRIEND SUCCESS') {
        this.routerExtension.navigate(['my/invite-friends']);
      }
    });

    this.handleBackPress();
  }
  ngOnInit() {
    firebase.init({}).then(
      () => {
        console.log('firebase.init done');
      },
      error => {
        console.log(`firebase.init error: ${error}`);
      }
    );
  }

  ngOnDestroy() {
    this.utils.unsubscribe([this.sub3, this.sub4]);
  }


  handleBackPress() {
    if (!Platform.isAndroid) {
      return;
    }
    // every time app resume component is recreated
    // we want to ensure there is only one event listener in app
    android.off(AndroidApplication.activityBackPressedEvent);
    android.on(AndroidApplication.activityBackPressedEvent, (data: AndroidActivityBackPressedEventData) => {
      console.log(`can go back value${this.navigationService.canGoBack()}`);
      data.cancel = this.navigationService.canGoBack();
      this.ngZone.run(() => this.navigationService.back());
    }, this);
  }
}
