import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";
import {ConfigService} from "../config.service";
import {checkLogin, showError, showMessage} from "../tools";
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
  showPerm: boolean=false;
  perms:any;
  profil:string;

  constructor(public api:ApiService,
              public toast:MatSnackBar,
              public dialog:MatDialog,
              public _location:Location,
              public config:ConfigService,
              public router:Router) { }

  ngOnInit(): void {
    if(checkLogin(this)){
      this.api.getyaml("","perms").subscribe((r:any)=>{
        this.perms=r.perms;
        this.profil=r.id;
      })
    }
  }

  private readPerm(perm:string,sep:string=","):string {
    for(let p of this.perms){
      let rc="";
      if(p.tag==perm)rc=p.description;
      if(rc.length==0 && p.tag==perm.replace("r_",""))rc=p.description;
      if(rc.length==0 && p.tag==perm.replace("w_",""))rc=p.description+" en modification";
      if(rc.length>0)return rc+sep;
    }
    return "";
  }


  detailPerm(perm:string,format="txt"): string {
    if(!perm)return "";
    let rc="";
    if(format=="html")rc="<ul>";
    for(let it of perm.split(" ")){
      if(format=="txt")
        rc=rc+this.readPerm(it,"")+" / ";
      else
        rc=rc+"<li>"+this.readPerm(it)+"</li>";
    }
    if(format=="html")rc=rc+"</ul>";
    return rc;
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
}
