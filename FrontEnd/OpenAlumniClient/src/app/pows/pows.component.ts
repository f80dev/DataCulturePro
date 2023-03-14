import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../api.service";
import {ActivatedRoute, ParamMap, Router} from "@angular/router";
import {$$, getParams, normaliser, remove_ponctuation, showError, showMessage, translateQuery, uniq} from "../tools";
import {ConfigService} from "../config.service";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";
import {environment} from "../../environments/environment";
import {MatAccordion} from "@angular/material/expansion";
import {Observable} from "rxjs";
import {Location} from "@angular/common";
import {MatSnackBar} from "@angular/material/snack-bar";


@Component({
  selector: 'app-pows',
  templateUrl: './pows.component.html',
  styleUrls: ['./pows.component.sass']
})
export class PowsComponent implements OnInit {
  pows: any[]=[];
  query: any={value:""};
  limit=100;
  @ViewChild('powAccordion') powAccordion: MatAccordion;
  filter_id: number=0;
  filter$: Observable<string>;
  advanced=false;

  constructor(public api:ApiService,
              public ngNavigatorShareService:NgNavigatorShareService,
              public _clipboardService:ClipboardService,
              public router:Router,
              public toast:MatSnackBar,
              public _location:Location,
              public routes:ActivatedRoute,
              public config:ConfigService) {
    this.config.user_update.subscribe((new_user)=>{this.refresh();})
  }

  ngOnInit(): void {
    getParams(this.routes).then((params:any)=>{
      this.query.value=params.hasOwnProperty("filter") ? remove_ponctuation(params.filter) : remove_ponctuation(params.query);
      this.filter_id=params.hasOwnProperty("id") ? Number(this.routes.snapshot.queryParamMap.get("id")) : 0;
    })
  }

  open_search(work: any) {
    let name=work.name
    if(name.indexOf(" ")>-1)name=name.substr(name.lastIndexOf(' ')).trim();
    this.router.navigate(["search"],{queryParams:{filter:name}});
  }


  clearQuery() {
    this.query.value='';
    this.refresh(this.limit);
  }


  message: string ="";
  all: any=true;

  handle:any;
  onQuery($event: KeyboardEvent) {
    clearTimeout(this.handle);
    this.handle=setTimeout(()=>{
      this.refresh(this.limit);
    },1000);
  }


  refresh(limit=100) {
    if(this.query.value && this.query.value.length>3)this._location.replaceState("pows/?query="+this.query.value);
    let param=translateQuery(this.query.value,false);
    param=param+"&limit="+limit;
    this.message="Recherche des films";
    this.api._get("powsdoc",param).subscribe((r:any)=>{
      this.message="";
      this.pows=[];
      for(let i of r.results){
        if(i.hasOwnProperty("links"))i.links=uniq(i.links);
        if(!this.filter_id || this.filter_id==i.id){
          let origin=i.links.length>0 ? i.links[0].text.split(":")[1] : "*";
          if(origin){
            origin=origin.replace("-","");
            if(origin=="*" || this.config.hasPerm("r_"+origin.toLowerCase()))
              this.pows.push(i);
          } else {
            $$(i.links[0].url+" est en anomalie");
          }
        }
      }
      if(r.results.length==1){
        setTimeout(()=>{
          this.pows[0].expanded=true;
        },1000);
      }
    },(err)=>{
      showError(this,err);
    });
  }


  add_experience(pow: any) {
    this.router.navigate(["edit"],{queryParams:{id:this.config.user.profil,add:pow.id,title:pow.title}})
  }

  share(pow: any) {
    let public_url=environment.domain_appli+"/pows?filter="+pow.title;
    showMessage(this,"Lien du profil disponible dans le presse-papier");
    this.ngNavigatorShareService.share({
      title: pow.title,
      text: "Retrouver les films de la femis",
      url: public_url
    })
      .then( (response) => {console.log(response);},()=>{
        this._clipboardService.copyFromContent(public_url);
      })
      .catch( (error) => {
        this._clipboardService.copyFromContent(public_url);
      });

  }

  get_pow(pow: any) {
    this.api._get("extrapows/"+pow.id,"").subscribe((r:any)=>{
      let rc=[];
      if(r){
        pow.title=r.title;
        pow.visual=r.visual;
        pow.award=Object.values(r.award).sort((a:any,b:any) => (a.year<b.year ? 1 : -1));
        for(let item of r.works){
          if(item.public){
            rc.push({
              job:item.job,
              name:item.profil.firstname+" "+item.profil.lastname.toUpperCase()
            })
          }
        }
        pow.expanded=true;
        pow.works=rc;
      }
    });
  }

  deletePow(pow: any) {
    this.api._delete("/pows/"+pow.id).subscribe(()=>{
      showMessage(this,"film supprimé");
      this.refresh(this.limit);
    })
  }

  show_all() {
    if(this.limit==50)
      this.limit=500;
    else
      this.limit=100;

    this.refresh(this.limit);
  }

  openGoogle(pow: any) {
    let url=pow.title.replace(" ","+")+" "+pow.year;
    open("https://www.google.com/search?q="+url,"_blank");
  }

  analyse(pow: any) {
    this.api._get("analyse_pow","id="+pow.id+"&search_by=title").subscribe((r:any)=>{
      showMessage(this,"Analyse terminée");
    });
  }
}
