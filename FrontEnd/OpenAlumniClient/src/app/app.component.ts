import {Component, HostListener, OnInit, ViewChild} from '@angular/core';
import {ConfigService} from "./config.service";
import {ApiService} from "./api.service";
import {Location} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {environment} from "../environments/environment";
import {MatSidenav} from "@angular/material/sidenav";
import {ChatAdapter} from "ng-chat";
import { MyAdapter } from './MyAdapter';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {
  title = 'OpenAlumniClient';
  message: string="";
  appVersion: any;
  @ViewChild('drawer', {static: false}) drawer: MatSidenav;
  public adapter: ChatAdapter = new MyAdapter();
  innerWidth: number=400;
  sidemenu_mode: string="over";

  constructor(public config: ConfigService,
              public api:ApiService,
              public _location:Location,
              public routes:ActivatedRoute,
              public router:Router){
    this.appVersion=environment.appVersion;

    config.init(() => {
      this.config.init_user();
    });
  }


    closeMenu() {
     if (this.innerWidth < 800)
      this.drawer.close();
    }

    logout() {
      this.api.logout();
      this.config.raz_user();
      window.location.reload();
    }


    @HostListener('window:resize', ['$event'])
    onResize($event: any) {
      this.innerWidth = $event.currentTarget.innerWidth;
      if (this.innerWidth >= 800 && this.drawer){
        this.sidemenu_mode="side";
        this.drawer.open();
      }
      else{
        this.closeMenu();
        this.sidemenu_mode="over";
      }

  }

  ngOnInit(): void {
    setTimeout(()=>{
      this.onResize({currentTarget:{innerWidth:window.innerWidth}});
    },1000);
  }



}

