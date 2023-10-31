import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SearchComponent } from './search/search.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { environment } from '../environments/environment';
import { ImportComponent } from './import/import.component';
import {ApiService} from './api.service';
import {HttpClientModule} from '@angular/common/http';
import {GOOGLE_CLIENT_ID} from './constantes';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatSliderModule} from '@angular/material/slider';
import { AdminComponent } from './admin/admin.component';
import {MatInputModule} from '@angular/material/input';
import {MatIconModule} from '@angular/material/icon';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AboutComponent } from './about/about.component';
import { FaqsComponent } from './faqs/faqs.component';
import { HourglassComponent } from './hourglass/hourglass.component';
import { TutoComponent } from './tuto/tuto.component';
import { ImageSelectorComponent } from './image-selector/image-selector.component';
import { TransPipe } from './trans.pipe';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { SafePipe } from './safe.pipe';
import { ProfilComponent } from './profil/profil.component';
import { PublicComponent } from './public/public.component';
import { FilterPipe } from './filter.pipe';
import { LoginComponent } from './login/login.component';
import { PromptComponent } from './prompt/prompt.component';
import { WorkComponent } from './work/work.component';
import {MAT_DIALOG_DATA, MatDialogModule} from '@angular/material/dialog';
import {
    GoogleLoginProvider,
    GoogleSigninButtonModule,
    SocialAuthServiceConfig,
    SocialLoginModule
} from "@abacritt/angularx-social-login"
import { LoginbarComponent } from './loginbar/loginbar.component';
import { ProfilesComponent } from './profiles/profiles.component';
import { EditComponent } from './edit/edit.component';
import { PowComponent } from './pow/pow.component';
import {MatTableModule} from '@angular/material/table';
import { AddpowComponent } from './addpow/addpow.component';
import {MatSelectModule} from '@angular/material/select';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatNativeDateModule} from '@angular/material/core';
import { WorksComponent } from './works/works.component';
import { SplashComponent } from './splash/splash.component';
import { WriteComponent } from './write/write.component';
import {TextFieldModule} from '@angular/cdk/text-field';
import { StatsComponent } from './stats/stats.component';
import {MatGridListModule} from '@angular/material/grid-list';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatListModule} from '@angular/material/list';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatExpansionModule} from '@angular/material/expansion';
import { PowsComponent } from './pows/pows.component';
import {OverlayModule} from '@angular/cdk/overlay';
import {MatRadioModule} from '@angular/material/radio';
import { DevComponent } from './dev/dev.component';
import { HtmlEditorComponent } from './html-editor/html-editor.component';
import { BlogComponent } from './blog/blog.component';
import {MatChipsModule} from '@angular/material/chips';
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { PlayerComponent } from './player/player.component';
import { VisgraphComponent } from './visgraph/visgraph.component';
import { NftsComponent } from './nfts/nfts.component';
import {MatTabsModule} from '@angular/material/tabs';
import { GoogleChartsModule } from 'angular-google-charts';
import {ShareButtonsModule} from 'ngx-sharebuttons/buttons';
import {ShareIconsModule} from 'ngx-sharebuttons/icons';
import { ProfilsScannerComponent } from './profils-scanner/profils-scanner.component';
import {FaqLinkComponent} from './faq-link/faq-link.component';
import { IssuesComponent } from './issues/issues.component';
import { SettingsComponent } from './settings/settings.component';
import { RgpdComponent } from './rgpd/rgpd.component';

//import { MglTimelineModule } from 'angular-mgl-timeline';
import { EditAwardComponent } from './edit-award/edit-award.component';
import { TimelineComponent } from './timeline/timeline.component';
import {WebcamModule} from "ngx-webcam";
import { ScoringComponent } from './scoring/scoring.component';
import {NgxJsonViewerModule} from "ngx-json-viewer";
import {MatSlideToggleModule} from "@angular/material/slide-toggle";
import { ScreencutterPipe } from './screencutter.pipe';
import { MenuComponent } from './menu/menu.component';
import { InputComponent } from './input/input.component';
import { FestivalsComponent } from './festivals/festivals.component';
import { UploadFileComponent } from './upload-file/upload-file.component';
import { FileDragNDropDirective } from './file-drag-ndrop.directive';
import {QuillEditorComponent, QuillModule} from "ngx-quill";

@NgModule({
  declarations: [
    AppComponent,
    SearchComponent,
    ImportComponent,
    AdminComponent,
    AboutComponent,
    FaqsComponent,
    HourglassComponent,
    TutoComponent,
    ImageSelectorComponent,
    TransPipe,
    SafePipe,
    ProfilComponent,
    PublicComponent,
    FilterPipe,
    LoginComponent,
    PromptComponent,
    WorkComponent,
    FaqLinkComponent,
    LoginbarComponent,
    ProfilesComponent,
    EditComponent,
    PowComponent,
    AddpowComponent,
    WorksComponent,
    SplashComponent,
    WriteComponent,
    StatsComponent,
    PowsComponent,
    DevComponent,
    HtmlEditorComponent,
    BlogComponent,
    PlayerComponent,
    VisgraphComponent,
    NftsComponent,
    ProfilsScannerComponent,
    IssuesComponent,
    SettingsComponent,
    RgpdComponent,
    EditAwardComponent,
    TimelineComponent,
    ScoringComponent,
    ScreencutterPipe,
    MenuComponent,
    InputComponent,
    FestivalsComponent,
    UploadFileComponent,
    FileDragNDropDirective
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        MatTabsModule,
        HttpClientModule,
        //MglTimelineModule,
        ScrollingModule,
        QuillModule.forRoot({
            modules: {
                syntax: false,
            },
            theme: 'snow',
            format: 'html',
            readOnly: false,
            placeholder: 'votre article ici'
        }),
        BrowserAnimationsModule,
        ReactiveFormsModule,
        MatNativeDateModule,
        ServiceWorkerModule.register('ngsw-worker.js', {enabled: environment.production}),
        MatCardModule,
        WebcamModule,
        MatTableModule,
        MatSnackBarModule,
        TextFieldModule,
        MatSliderModule,
        SocialLoginModule,
        MatFormFieldModule,
        MatInputModule,
        // NgChatModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,

        FormsModule,
        MatProgressSpinnerModule,
        MatSelectModule,
        MatDatepickerModule,
        MatGridListModule,
        MatSidenavModule,
        MatToolbarModule,
        MatListModule,
        MatCheckboxModule,
        MatExpansionModule,
        OverlayModule,
        MatRadioModule,
        MatChipsModule,
        MatAutocompleteModule,
        MatSliderModule,
        GoogleChartsModule,
        ShareButtonsModule,
        ShareIconsModule,
        NgxJsonViewerModule,
        MatSlideToggleModule,
        GoogleSigninButtonModule,
        QuillEditorComponent
    ],
  providers: [
    ApiService,
    TransPipe,
    {
      provide: 'SocialAuthServiceConfig',
      useValue: {
        autoLogin: false,
        providers: [
          {
              id: GoogleLoginProvider.PROVIDER_ID,
              provider: new GoogleLoginProvider(GOOGLE_CLIENT_ID),
          }
          // {
          //   id: FacebookLoginProvider.PROVIDER_ID,
          //       provider: new FacebookLoginProvider('1064548794002409'),
          // },
        ],
      } as SocialAuthServiceConfig,
    },
    {provide: MAT_DIALOG_DATA, useValue: {hasBackdrop: false}}
  ],
  bootstrap: [AppComponent]
})

export class AppModule {

}
