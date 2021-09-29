import { Component, OnInit } from '@angular/core';
import {ConfigService} from "../config.service";
import {ApiService} from "../api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ContentChange} from "ngx-quill";
import {checkLogin, showError, showMessage} from "../tools";
import {Location} from "@angular/common";
import {MatSnackBar} from "@angular/material/snack-bar";


@Component({
  selector: 'app-write',
  templateUrl: './write.component.html',
  styleUrls: ['./write.component.sass']
})
export class WriteComponent implements OnInit {
  profil: any;
  text: any;
  buttons: any[]=[];
  social_networks: any[]=[];
  social_network: any;
  send_copy: any;

  constructor(public config:ConfigService,
              public _location:Location,
              public toast:MatSnackBar,
              public router:Router,
              public api:ApiService,
              public routes:ActivatedRoute) {

  }

  ngOnInit(): void {
    checkLogin(this);

    if(this.config.user.profil){
      this.api._get("profils/"+this.config.user.profil+"/").subscribe((p:any)=>{
      for(let sn of ["facebook","youtube","tiktok","vimeo","instagram","telegram","twitter","linkedin"]){
        if(p[sn] && p[sn]!='')
          this.social_networks.push({value:p[sn],label:sn});
      }
      // if(this.social_networks.length>0)this.social_network=this.social_networks[0];
      });
    }

    let id=this.routes.snapshot.queryParamMap.get("id");
    this.api._get("profils/"+id+"/").subscribe((p:any)=>{
      this.profil=p;
      this.api.getyaml("","social").subscribe((r:any)=>{
        if(this.config.user.user){
          let profil_name=this.config.user.profil_name;
          for(let service of r.services){
            let url=this.profil[service.name];
            if(url && url.length>0 && service.profils.indexOf(profil_name)>-1)
               this.buttons.push({
                 "caption":service.name.toUpperCase(),
                 "url":url
               })
           }
        }
      });

    })

  }


  send() {
    let fullname=this.config.user.user.first_name+" "+this.config.user.user.last_name;
    this.api.send(this.profil.id,this.config.user.user.id,this.text,this.social_network,this.send_copy,fullname).subscribe(r=>{
      showMessage(this,"Message envoyé a "+this.profil.firstname+" "+this.profil.lastname);
      this._location.back();
    },(err)=>{
      showError(this,err);
    })
  }

  open_social(url: any) {
    open(url);
  }
}
