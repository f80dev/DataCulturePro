import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {Router} from "@angular/router";
import {Location} from "@angular/common";
import {ApiService} from "../api.service";
import {extract_id, showMessage} from "../tools";
import {ConfigService} from "../config.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {environment} from "../../environments/environment";
import {PromptComponent} from "../prompt/prompt.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-loginbar',
  templateUrl: './loginbar.component.html',
  styleUrls: ['./loginbar.component.sass']
})
export class LoginbarComponent implements OnInit,OnChanges {

  @Input("user") user:any;
  @Output('logout') onlogout: EventEmitter<any>=new EventEmitter();
  isLocal=false;

  constructor(public router:Router,
              public dialog:MatDialog,
              public toast:MatSnackBar,
              public _location:Location,
              public config:ConfigService,
              public api:ApiService) { }

  ngOnInit(): void {
    this.isLocal=!environment.production;
  }

  logout() {
    this.onlogout.emit();
  }



  ngOnChanges(changes: SimpleChanges): void {

  }

  help() {

  }


}

