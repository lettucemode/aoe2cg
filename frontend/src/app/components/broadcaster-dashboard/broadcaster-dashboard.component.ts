import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { BackendService } from '../../services/backend.service';
import { TwitchService } from '../../services/twitch.service';
import { Winner } from '../../models/winner';

@Component({
  selector: 'app-broadcaster-dashboard',
  templateUrl: './broadcaster-dashboard.component.html',
  styleUrls: ['./broadcaster-dashboard.component.css'],
})
export class BroadcasterDashboardComponent implements OnInit {
  updateSettingsButtonText = 'Start Game';
  lobbyId = '';
  lobbyPassword = '';
  subMult = 4;
  numToRoll = 1;
  entryCount = 0;
  winnerConfirmations: Winner[] = [];
  loading = true;
  updateWaiting = false;
  rollWaiting = false;
  endWaiting = false;

  constructor(private backend: BackendService, private twitch: TwitchService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.backend.checkStatus().subscribe((resp) => {
      if (resp.gameStatus === 'Active') {
        this.lobbyId = resp.lobbyId;
        this.lobbyPassword = resp.lobbyPassword;
        this.subMult = resp.subMult;
        this.entryCount = resp.entryCount;
        this.updateSettingsButtonText = 'Update Settings';
        this.winnerConfirmations = resp.winners;
      }
      this.loading = false;
      this.cdr.detectChanges();
    });
    this.twitch.listen('broadcast', (target: string, contentType: string, message: string) => {
      if (message === 'someoneRegistered') {
        this.entryCount += 1;
      } else if (message.startsWith('confirmed ')) {
        const confirmedOpaqueId = message.substring(10);
        this.winnerConfirmations.find((w) => w.opaqueUserId === confirmedOpaqueId).confirmed = true;
      }
      this.cdr.detectChanges();
    });
  }

  onUpdateSettings(): void {
    this.updateWaiting = true;
    this.cdr.detectChanges();
    this.backend.updateGameSettings(this.lobbyId, this.lobbyPassword, this.subMult).subscribe((resp) => {
      this.updateSettingsButtonText = 'Update Settings';
      this.updateWaiting = false;
      this.cdr.detectChanges();
    });
  }

  onRoll(): void {
    this.rollWaiting = true;
    this.cdr.detectChanges();
    this.backend.roll(this.numToRoll).subscribe((resp) => {
      if (resp.success) {
        this.winnerConfirmations = this.winnerConfirmations.concat(resp.winners);
      }
      this.rollWaiting = false;
      this.cdr.detectChanges();
    });
  }

  onEndGame(): void {
    this.endWaiting = true;
    this.cdr.detectChanges();
    this.backend.endGame().subscribe((resp) => {
      this.updateSettingsButtonText = 'Start Game';
      this.lobbyId = '';
      this.lobbyPassword = '';
      this.subMult = 4;
      this.entryCount = 0;
      this.winnerConfirmations = [];
      this.endWaiting = false;
      this.cdr.detectChanges();
    });
  }
}
