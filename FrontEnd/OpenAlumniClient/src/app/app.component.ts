import {AfterViewInit, Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {ConfigService} from "./config.service";
import {ApiService} from "./api.service";
import {Location} from "@angular/common";
import {ActivatedRoute, NavigationEnd, Router} from "@angular/router";
import {environment} from "../environments/environment";
import {MatDrawerMode, MatSidenav} from "@angular/material/sidenav";
// import {ChatAdapter} from "ng-chat";
// import { MyAdapter } from './MyAdapter';
import {$$, getParams} from "./tools";
import {MatDialog} from "@angular/material/dialog";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {DeviceService} from "./device.service";

declare const gtag: Function;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit,AfterViewInit {
  title = 'OpenAlumniClient';
  message: string="";
  appVersion: any;
  @ViewChild('drawer', {static: false}) drawer: MatSidenav;

  //public adapter: ChatAdapter = new MyAdapter();


  innerWidth: number=400;
  sidemenu_mode: MatDrawerMode="side";
  simple_screen=false;

  constructor(public config: ConfigService,
              public api:ApiService,
              public dialog:MatDialog,
              public _location:Location,
              public device:DeviceService,
              public responsive: BreakpointObserver,
              public routes:ActivatedRoute,
              public router:Router){
    this.appVersion=environment.appVersion;

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        gtag('config', 'G-4H77LPR3FC', { 'page_path': event.urlAfterRedirects });
      }
    })

    this.responsive.observe([Breakpoints.Small,Breakpoints.XSmall,Breakpoints.HandsetPortrait]).subscribe((result)=>{
      this.simple_screen=result.matches;
    })
  }




  closeMenu() {
    if(window.innerWidth<this.innerWidth){
      this.drawer.close();
      this.sidemenu_mode="side";
    }
  }

  logout() {
    $$("Déconnexion");
    this.api.logout();
    this.config.raz_user();
    this.router.navigate(["search"])
  }


  @HostListener('window:resize', ['$event'])
  onResize($event: any) {
    this.innerWidth = $event.currentTarget.innerWidth;
    this.device.resize(this.innerWidth);
    if (this.innerWidth >= 800 && this.drawer){
      this.sidemenu_mode="side";
      this.drawer.open();
    }
    else{
      this.closeMenu();

    }

  }

  async ngOnInit() {
    await this.config.init()
    await this.config.init_user(localStorage.getItem("email"));

    setTimeout(()=>{
      this.onResize({currentTarget:{innerWidth:window.innerWidth}});
    },1000);
  }

  async ngAfterViewInit() {
      let params:any=await getParams(this.routes);
      if(params.login || params.password){
        this.router.navigate(["login"],{queryParams:{
            login:params.login,password:params.password
          }});
      }

        // if(!this.routes.snapshot.queryParamMap.has("no_auto_login")){
        //   setTimeout(()=>{
        //     if(!this.config.isLogin() && !this._location.isCurrentPathEqualTo("./login") && localStorage.getItem("propal_login")!="Done"){
        //       $$("Proposition d'authentification");
        //       localStorage.setItem("propal_login","Done");
        //       this.dialog.open(PromptComponent,{data: {
        //           title: 'Se connecter',
        //           question: 'Vous souhaitez en savoir plus sur les profils. Connectez-vous !',
        //           onlyConfirm: true,
        //           lbl_ok: 'Oui',
        //           lbl_cancel: 'Non'
        //         }}).afterClosed().subscribe((result_code) => {
        //         if (result_code == 'yes') {
        //           this.router.navigate(["login"]);
        //         }
        //       });
        //     }
        //   },60000);
        // }

  }

}

