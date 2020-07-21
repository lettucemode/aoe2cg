import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { ViewerPanelComponent } from './components/viewer-panel/viewer-panel.component';
import { BroadcasterConfigComponent } from './components/broadcaster-config/broadcaster-config.component';
import { BroadcasterDashboardComponent } from './components/broadcaster-dashboard/broadcaster-dashboard.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { WinnerStatusComponent } from './components/winner-status/winner-status.component';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { CoolButtonComponent } from './components/cool-button/cool-button.component';
import { ViewerDisplayComponent } from './components/viewer-display/viewer-display.component';
import { VideoComponentComponent } from './components/video-component/video-component.component';

@NgModule({
  declarations: [
    AppComponent,
    ViewerPanelComponent,
    BroadcasterConfigComponent,
    BroadcasterDashboardComponent,
    WinnerStatusComponent,
    SpinnerComponent,
    CoolButtonComponent,
    ViewerDisplayComponent,
    VideoComponentComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    NgbModule,
    FontAwesomeModule,
    RouterModule.forRoot(
      [
        { path: '', redirectTo: 'panel', pathMatch: 'full' },
        { path: 'panel', component: ViewerPanelComponent },
        { path: 'dashboard', component: BroadcasterDashboardComponent },
        { path: 'config', component: BroadcasterConfigComponent },
        { path: 'video-component', component: VideoComponentComponent },
      ],
      { useHash: true }
    ),
  ],
  providers: [{ provide: Window, useValue: window }],
  bootstrap: [AppComponent],
})
export class AppModule {}
