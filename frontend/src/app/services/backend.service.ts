import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, combineLatest } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { TwitchService } from './twitch.service';
import { environment } from '../../environments/environment';
import {
  GenericResponse,
  CheckStatusResponse,
  RollResponse,
  ForbiddenKnowledgeResponse,
} from '../models/backend-responses';
import { TwitchAuth, TwitchConfig } from '../models/twitch';

type twitchStateToObservable<T> = (auth: TwitchAuth, config: TwitchConfig) => Observable<T>;

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  constructor(private http: HttpClient, private twitch: TwitchService) {}

  private httpWithTwitchState<T>(f: twitchStateToObservable<T>): Observable<T> {
    return combineLatest([this.twitch.onAuthorized(), this.twitch.onConfig()]).pipe(
      first(), // only do the http request one time
      switchMap(([auth, config]) => f(auth, config))
    );
  }

  private url(config: TwitchConfig): string {
    return environment.production ? config.functionsBaseUrl : location.protocol + '//localhost:7071/api/';
  }

  private headers(auth: TwitchAuth, config: TwitchConfig): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
      Authorization: 'Bearer ' + auth.token,
      'Content-Type': 'application/json',
      'x-functions-key': config.functionsAuthKey,
    });
  }

  private getExtVersion(): string {
    const regex = /(\d+\.\d+\.\d+)/;
    const matches = location.href.match(regex);
    return matches ? matches[0] : '1.1.0';
  }

  checkStatus(): Observable<CheckStatusResponse> {
    return this.httpWithTwitchState((auth, config) =>
      this.http.get<CheckStatusResponse>(this.url(config) + 'checkstatus', {
        headers: this.headers(auth, config),
      })
    );
  }

  updateGameSettings(lobbyId: string, lobbyPassword: string, subMult: number): Observable<GenericResponse> {
    const body = {
      lobbyId,
      lobbyPassword,
      subMult,
      extVersion: this.getExtVersion(),
    };
    return this.httpWithTwitchState((auth, config) =>
      this.http.post<GenericResponse>(this.url(config) + 'updategamesettings', body, {
        headers: this.headers(auth, config),
      })
    );
  }

  register(): Observable<GenericResponse> {
    const body = {
      isSubscriber: this.twitch.viewerSubscribed(),
      realUserId: this.twitch.viewerRealId(),
    };
    return this.httpWithTwitchState((auth, config) =>
      this.http.post<GenericResponse>(this.url(config) + 'register', body, {
        headers: this.headers(auth, config),
      })
    );
  }

  roll(numToRoll: number): Observable<RollResponse> {
    const body = {
      numToRoll,
      extVersion: this.getExtVersion(),
    };
    return this.httpWithTwitchState((auth, config) =>
      this.http.post<RollResponse>(this.url(config) + 'roll', body, { headers: this.headers(auth, config) })
    );
  }

  obtainTheForbiddenKnowledge(): Observable<ForbiddenKnowledgeResponse> {
    return this.httpWithTwitchState((auth, config) =>
      this.http.get<ForbiddenKnowledgeResponse>(this.url(config) + 'forbiddenknowledge', {
        headers: this.headers(auth, config),
      })
    );
  }

  endGame(): Observable<GenericResponse> {
    const body = {
      extVersion: this.getExtVersion(),
    };
    return this.httpWithTwitchState((auth, config) =>
      this.http.post<GenericResponse>(this.url(config) + 'endgame', body, {
        headers: this.headers(auth, config),
      })
    );
  }
}
