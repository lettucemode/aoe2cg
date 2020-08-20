import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonConfig } from '../../models/button-config';

@Component({
  selector: 'app-cool-button',
  templateUrl: './cool-button.component.html',
  styleUrls: ['./cool-button.component.css'],
})
export class CoolButtonComponent {
  @Input() config: ButtonConfig;
  @Input() waiting: boolean;
  @Output() clicked: EventEmitter<any> = new EventEmitter();

  doClick(): void {
    this.clicked.emit();
  }
}
