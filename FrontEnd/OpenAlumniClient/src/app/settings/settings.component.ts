import { Component, OnInit } from '@angular/core';
import {PromptComponent} from "../prompt/prompt.component";
import {checkConfig, checkLogin, detailPerm, showMessage} from "../tools";
import {MatDialog} from "@angular/material/dialog";
import {ApiService} from "../api.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ConfigService} from "../config.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.sass']
})
export class SettingsComponent implements OnInit {
  show_perm="";

  constructor(
    public dialog:MatDialog,
    public api:ApiService,
    public router:Router,
    public toast:MatSnackBar,
    public config:ConfigService
  ) { }

  ngOnInit(): void {
    checkLogin(this);
    this.show_perm=detailPerm(this.config.user.perm,this.config.perms,"html");
  }

  open_perms(){
    this.router.navigate(['profils']);
  }

  raz() {
    this.dialog.open(PromptComponent,{data: {
        title: 'Confirmation',
        question: 'Supprimer votre compte ?',
        onlyConfirm: true,
        canEmoji: false,
        lbl_ok: 'Oui',
        lbl_cancel: 'Non'
      }}).afterClosed().subscribe((result_code) => {
      if (result_code == 'yes') {
        this.api._delete("users/"+this.config.user.user.id+"/","").subscribe(()=>{
              showMessage(this,"Votre compte est effacé");
              window.location.reload();
            })
      }
    });

  }


}
