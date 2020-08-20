import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TwitchAuth, TwitchConfig, TwitchContext, TwitchHelper, PubSubCallback } from '../models/twitch';

@Injectable({
  providedIn: 'root',
})
export class TwitchService {
  private authSubject: BehaviorSubject<TwitchAuth> = new BehaviorSubject<TwitchAuth>(null);
  private configSubject: BehaviorSubject<TwitchConfig> = new BehaviorSubject<TwitchConfig>(null);
  private contextSubject: BehaviorSubject<TwitchContext> = new BehaviorSubject<TwitchContext>(null);
  private helper: TwitchHelper;

  constructor(private window: Window) {
    this.helper = this.window.Twitch.ext;
    this.helper.onAuthorized((auth: TwitchAuth) => {
      this.authSubject.next(auth);
    });
    this.helper.configuration.onChanged(() => {
      this.configSubject.next(JSON.parse(this.helper.configuration.global.content));
    });
    this.helper.onContext((context: TwitchContext) => {
      this.contextSubject.next(context);
    });
  }

  onAuthorized(): Observable<TwitchAuth> {
    return this.authSubject.asObservable().pipe(filter((auth) => !!auth));
  }

  onConfig(): Observable<TwitchConfig> {
    return this.configSubject.asObservable().pipe(filter((config) => !!config));
  }

  onContext(): Observable<TwitchContext> {
    return this.contextSubject.asObservable().pipe(filter((context) => !!context));
  }

  viewerIsLinked(): boolean {
    return this.helper.viewer.isLinked;
  }

  doIdentityShare(): void {
    if (this.helper.viewer.isLinked) return;
    this.helper.actions.requestIdShare();
  }

  viewerSubscribed(): boolean {
    return !!this.helper.viewer.subscriptionStatus;
  }

  viewerRealId(): string {
    return this.helper.viewer.id;
  }

  listen(target: string, f: PubSubCallback): void {
    this.helper.listen(target, f);
  }
}
