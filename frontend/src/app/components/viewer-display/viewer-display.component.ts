import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { TwitchService } from '../../services/twitch.service';
import { BackendService } from '../../services/backend.service';
import { environment } from '../../../environments/environment';

enum PanelState {
  Loading,
  NotLoggedIn,
  GameNotStarted,
  IdentityShare,
  ClickToRegister,
  WaitingForWin,
  ConfirmNotAfk,
  ForbiddenKnowledge,
}

@Component({
  selector: 'app-viewer-display',
  templateUrl: './viewer-display.component.html',
  styleUrls: ['./viewer-display.component.css'],
})
export class ViewerDisplayComponent implements OnInit {
  environment = environment;
  PanelState = PanelState;
  @Input() isVideoComponent: boolean;

  panelState: PanelState = PanelState.Loading;
  lobbyId: string;
  lobbyPassword: string;
  registerWaiting = false;
  confirmNotAfkWaiting = false;

  constructor(private twitch: TwitchService, private backend: BackendService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.twitch.onAuthorized().subscribe((auth) => {
      // opaque IDs starting with A are logged-out users
      if (auth.userId.startsWith('A')) {
        this.panelState = PanelState.NotLoggedIn;
        this.cdr.detectChanges();
      } else {
        // register with pubsub to get live update messages
        this.twitch.listen('whisper-' + auth.userId, this.listenForWins);
        this.twitch.listen('broadcast', this.listenForGameStateChange);

        // check initial status
        this.checkStatus();
      }
    });
  }

  private listenForWins(targ: string, cType: string, message: string): void {
    if (message === 'Winner') {
      this.checkStatus();
    }
  }

  private listenForGameStateChange(targ: string, cType: string, message: string): void {
    if (message === 'Active') {
      this.panelState = this.twitch.viewerIsLinked() ? PanelState.ClickToRegister : PanelState.IdentityShare;
    } else if (message === 'Ended') {
      this.panelState = PanelState.GameNotStarted;
    }
    this.cdr.detectChanges();
  }

  private checkStatus(): void {
    this.backend.checkStatus().subscribe((resp) => {
      if (resp.gameStatus === 'Active') {
        if (!resp.registered) {
          this.panelState = this.twitch.viewerIsLinked() ? PanelState.ClickToRegister : PanelState.IdentityShare;
        } else if (resp.winner) {
          if (resp.confirmed) {
            this.lobbyId = resp.lobbyId;
            this.lobbyPassword = resp.lobbyPassword;
            this.panelState = PanelState.ForbiddenKnowledge;
          } else {
            this.panelState = PanelState.ConfirmNotAfk;
          }
        } else {
          this.panelState = PanelState.WaitingForWin;
        }
      } else if (resp.gameStatus === 'Ended') {
        this.panelState = PanelState.GameNotStarted;
      }
      this.cdr.detectChanges();
    });
  }

  onIdentityShare(): void {
    this.twitch.doIdentityShare();
  }

  onRegister(): void {
    this.registerWaiting = true;
    this.cdr.detectChanges();
    this.backend.register().subscribe((resp) => {
      this.panelState = PanelState.WaitingForWin;
      this.registerWaiting = false;
      this.cdr.detectChanges();
    });
  }

  onConfirmNotAfk(): void {
    this.confirmNotAfkWaiting = true;
    this.cdr.detectChanges();
    this.backend.obtainTheForbiddenKnowledge().subscribe((resp) => {
      this.lobbyId = resp.lobbyId;
      this.lobbyPassword = resp.lobbyPassword;
      this.panelState = PanelState.ForbiddenKnowledge;
      this.confirmNotAfkWaiting = false;
      this.cdr.detectChanges();
    });
  }

  onCheat(): void {
    this.panelState = PanelState.ConfirmNotAfk;
    this.cdr.detectChanges();
  }
}
