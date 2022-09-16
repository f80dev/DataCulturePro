import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";
import {ConfigService} from "../config.service";
import {showMessage} from "../tools";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Location} from "@angular/common"


@Component({
  selector: 'app-issues',
  templateUrl: './issues.component.html',
  styleUrls: ['./issues.component.sass']
})
export class IssuesComponent implements OnInit {
  title="";
  description="";
  localisation="";

  constructor(
    public api:ApiService,
    public _location:Location,
    public toast:MatSnackBar,
    public config:ConfigService,
  ) { }

  ngOnInit(): void {

  }

  send() {
    let body="De 'user"+this.config.user.user.id+"'\nLocalisation: "+this.localisation+"\nDescription:"+this.description;
    this.api._post("add_issue","",{title:this.title,body:body}).subscribe((r)=>{
      showMessage(this,"Anomalie enregistrée. Celle ci sera traité dés que possible");
    });
    this.quit();
  }

  quit() {
    this._location.back();
  }
}
