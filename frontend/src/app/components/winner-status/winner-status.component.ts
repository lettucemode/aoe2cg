import { Component, OnInit, Input } from '@angular/core';
import { faUserCheck } from '@fortawesome/free-solid-svg-icons';
import { Winner } from '../../models/winner';

@Component({
  selector: 'app-winner-status',
  templateUrl: './winner-status.component.html',
  styleUrls: ['./winner-status.component.css'],
})
export class WinnerStatusComponent implements OnInit {
  @Input() winner: Winner;
  faUserCheck = faUserCheck;

  constructor() {}

  ngOnInit(): void {}

  getClass(): object {
    return {
      btn: true,
      'btn-sm': true,
      'btn-success': this.winner.confirmed,
      'btn-secondary': !this.winner.confirmed,
    };
  }
}
