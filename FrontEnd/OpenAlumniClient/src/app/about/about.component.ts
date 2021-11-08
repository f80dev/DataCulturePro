import { Component, OnInit } from '@angular/core';
import {ConfigService} from "../config.service";
import {environment} from "../../environments/environment";
import {Router} from "@angular/router";

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.sass']
})
export class AboutComponent implements OnInit {
  appVersion: any;



  constructor(public config:ConfigService,public router:Router) {
    this.config.init();
    this.appVersion=environment.appVersion;
  }

  ngOnInit(): void {
  }

  openFrame(forum: any) {

  }

  openMail(url: string) {
    open(url);
  }
}
