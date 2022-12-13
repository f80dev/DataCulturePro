import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {$$, showError, showMessage} from "../tools";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Router} from "@angular/router";
import {ConfigService} from "../config.service";
import {ApiService} from "../api.service";
import {tProfil} from "../types";

@Component({
  selector: 'app-profil',
  templateUrl: './profil.component.html',
  styleUrls: ['./profil.component.sass']
})
export class ProfilComponent implements OnChanges {

  @Input("profil") profil:tProfil;
  @Input("level") level:number=1;
  @Input("height") height="auto";
  @Input("pows") pows:number=1;
  @Input("showAction") showAction:boolean=true;
  @Input("writeAccess") writeAccess:boolean=false;
  @Input("backgroundColor") backgroundColor:string="x404040";
  @Input("width") width="320px";
  @Output('delete') ondelete: EventEmitter<any>=new EventEmitter();
  @Output('askfriend') onaskfriend: EventEmitter<any>=new EventEmitter();
  @Output('onclick') onclick: EventEmitter<any>=new EventEmitter();

  isOpen=false;
  reverseClass="flip-card-inner";

  constructor(public toast:MatSnackBar,
              public router:Router,
              public config:ConfigService,
              public api:ApiService) { }



  open_public_profil(evt,profil:any){
    this.router.navigate(["public"],{queryParams:{id:profil.id,name:profil.firstname+" "+profil.lastname}})
    // debugger
    // evt.stopPropagation();
    // this.api._get("profils/"+profil.id+"/","").subscribe((profil:any)=>{
    //   open(profil.public_url,"page_public");
    // })
  }



  openWebSite(url: string) {
    open(url,"_blank");
  }

  openWork(profil: any) {
    this.router.navigate(['works'],{queryParams:{id:profil.id,name:profil.firstname+" "+profil.lastname}});
  }

  editProfil(profil:any) {
    this.router.navigate(['edit'],{queryParams:{id:profil.id}})
  }

  ngOnChanges(changes: SimpleChanges): void {

  }

  write(profil:any) {
    this.router.navigate(["write"],{queryParams:{id:profil.id}})
  }

  deleteProfil(profil: any) {
    this.ondelete.emit();
  }

  askFriend(profil: any) {
    this.onaskfriend.emit(profil);
  }

  openLink(profil: any) {
    this.isOpen=true;
    if(profil.hasOwnProperty("value")){
      if(profil.value.toLowerCase()!="source")
      open(profil.value);
    }
    else {
      open(profil.links[0].url);
    }
  }

  ask_tutor(profil: any) {
    profil.acceptSponsor=false;
    $$("Mise a jour du profil demandeur");
    this.api._patch("profils/"+this.config.user.profil+"/","",{sponsorBy:profil.id}).subscribe((r:any)=>{
      $$("Mise à jour du profil du tuteur");
      this.api._patch("profils/"+profil.id+"/","",{acceptSponsor:false}).subscribe(()=>{
        showMessage(this,"Vous êtes tutorés par "+profil.name);
      },(err)=>{showError(this,err);});
    },(err)=>{showError(this,err);})
  }



  writeNFT(profil: any) {
    profil.message="Enregistrement dans la blockchain";
    this.api._get("write_nft","id="+profil.id).subscribe((r:any)=>{
      showMessage(this,"NFT créé");
      profil.blockchain=r.nft_id;
      profil.message="";
    },(err)=>{
      showError(this,err);
      profil.message="";
    })
  }

  select_card($event: MouseEvent) {
    if(this.reverseClass=="flip-card-inner"){
      this.reverseClass="flip-card-inner-rotate";
    } else {
      this.reverseClass="flip-card-inner";
    }

  }

  openQuery(evt,q:string) {
    evt.stopPropagation();
    this.onclick.emit(q);
  }

  open_CRM(profil: any) {
    showMessage(this,"Fonctionnalitée en cours de développement")
    //TODO a terminer
    if(profil.crm)open(profil.crm,"CRM");
  }
}

