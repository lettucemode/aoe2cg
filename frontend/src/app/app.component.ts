import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { TwitchService } from './services/twitch.service';
import { TwitchContext } from './models/twitch';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  context: TwitchContext;

  constructor(private twitch: TwitchService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.twitch.onContext().subscribe((context) => {
      this.context = context;
      this.cdr.detectChanges();
    });
  }
}
