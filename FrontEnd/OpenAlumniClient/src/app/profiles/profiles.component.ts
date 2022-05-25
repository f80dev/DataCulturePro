import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";
import {ConfigService} from "../config.service";
import {checkLogin, detailPerm, showError, showMessage} from "../tools";
import {Router} from "@angular/router";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Location} from "@angular/common";
import {DialogData, PromptComponent} from "../prompt/prompt.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.sass']
})
export class ProfilesComponent implements OnInit {
  perms:any;
  profil:string;
  profils: any[]=[];

  constructor(public api:ApiService,
              public toast:MatSnackBar,
              public dialog:MatDialog,
              public _location:Location,
              public config:ConfigService,
              public router:Router) { }

  ngOnInit(): void {
    checkLogin(this,()=>{
      this.profils=Object.values(this.config.profils);
    });
  }



  sel_profil(p) {
    if(false && !this.config.isProd()){
      this.config.user.perm = p.perm;
      this.config.user.profil_name = p.id;
       this._location.back();
    } else {
      if(p.subscription=="secure") {
        this.dialog.open(PromptComponent, {
          backdropClass:"removeBackground",
          data: {
            title: 'Ce profil nécessite un code d\'accès',
            question: "Code d'accès ?",
            onlyConfirm: false,
            lbl_ok: 'Valider',
            lbl_cancel: 'Annuler'
          }
        }).afterClosed().subscribe((result_code) => {
          if (this.config.isProd() || result_code == this.config.config.profil_code) {
            this.config.user.perm = p.perm;
            this.config.user.profil_name = p.id;
            this.api.setuser(this.config.user).subscribe(() => {
              showMessage(this, "Profil modifié");
              this._location.back();
            }, (err) => {
              showError(this, err);
            });
          }
        });
      }else{
        this.api.ask_perm(this.config.user,p.id).subscribe(()=>{
          showMessage(this,"Votre demande d'accès au profil a été transmise.");
          this.router.navigate(["search"]);
        })
      }
    }
  }



  show_perm(profilid) {
    return detailPerm(this.config.profils[profilid].perm,this.config.perms,"html");
  }
}
