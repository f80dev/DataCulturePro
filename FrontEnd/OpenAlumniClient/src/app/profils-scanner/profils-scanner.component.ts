import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";
import {Location} from "@angular/common";
import {MatDialog} from "@angular/material/dialog";
import {ActivatedRoute, Router} from "@angular/router";
import {ConfigService} from "../config.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {showError} from "../tools";

@Component({
  selector: 'app-profils-scanner',
  templateUrl: './profils-scanner.component.html',
  styleUrls: ['./profils-scanner.component.sass']
})
export class ProfilsScannerComponent implements OnInit {
  nb_profils=200;
  message="";
  code="";
  nb_contrib=5;

  constructor(
    public _location:Location,
    public routes:ActivatedRoute,
              public router:Router,
              public api:ApiService,
              public config:ConfigService,
              public toast:MatSnackBar
  ) { }

  ngOnInit(): void {
  }

  analyse() {
    this.message="Analyse global en cours";
    this.api._get("batch","limit="+this.nb_profils+"&contrib="+this.nb_contrib,3600).subscribe((r:any)=>{
      this.code="<ul>"+r.articles.join("")+"</ul>";
      this.message="";
    },(err)=>{showError(this,err)})
  }

  quit() {
    this._location.back();
  }

  edit() {
    this.router.navigate(["html-editor"])
  }
}
