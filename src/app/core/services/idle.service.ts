import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, fromEvent, merge, interval, Subscription } from 'rxjs';
import { debounceTime, tap } from 'rxjs/operators';
import { AuthService} from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class IdleService {
  private idle$ = new Subject<boolean>();
  private timer?: Subscription;
  private timeoutMilliseconds = 30 * 60 * 1000;
  private idleSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  startWatching(): void {
    const events$ = merge(
      fromEvent(document, 'click'),
      fromEvent(document, 'mousemove'),
      fromEvent(document, 'keydown'),
      fromEvent(document, 'scroll'),
      fromEvent(document, 'touchstart')
    );

    this.idleSubscription = events$
      .pipe(
        debounceTime(1000),
        tap(() => this.resetTimer())
      )
      .subscribe();

    this.resetTimer();
  }

  private resetTimer(): void {
    if (this.timer) {
      this.timer.unsubscribe();
    }

    this.timer = interval(this.timeoutMilliseconds)
      .subscribe(() => {
        this.logout();
      });
  }

  private logout(): void {
    console.log('User inactive for 30 minutes - logging out');
    this.stopWatching();
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  stopWatching(): void {
    if (this.idleSubscription) {
      this.idleSubscription.unsubscribe();
    }
    if (this.timer) {
      this.timer.unsubscribe();
    }
  }
}
