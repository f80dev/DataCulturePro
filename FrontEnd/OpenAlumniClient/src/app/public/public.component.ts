import {AfterViewInit, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {$$, group_works, showMessage} from "../tools";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";
import {ConfigService} from "../config.service";

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.sass']
})
export class PublicComponent implements OnInit,AfterViewInit {

  profil:any;
  works: any[]=[];
  message: string;
  items: any[]=[];
  data_timeline: any[]=[];

  constructor(public router:Router,
              public config:ConfigService,
              public ngNavigatorShareService:NgNavigatorShareService,
              public _clipboardService:ClipboardService,
              public route:ActivatedRoute,
              public api:ApiService) {
  }




  load_items(p){
   let expe={};
    this.api._get("awards","profil="+p.id).subscribe((awards:any)=> {
      this.message="";

      let rc=[];
      for(let w of p.works){
        for(var i=0;i<1000;i++){
          w=w.replace("'","\"")
        }
        try {
          let _w=JSON.parse(w);
          rc.push(_w);
          expe[_w.job]=expe.hasOwnProperty(_w.job) ? expe[_w.job]+1 : 1;
        } catch (e) {
          $$("Probleme de conversion "+w);
        }
      }
      this.profil.expe="";

      let lst=Object.values(expe).sort((a,b) => (a<b ? 1 : -1));
      if(lst.length>3)lst=lst.slice(0,3)

      for(let k of Object.keys(expe)){
        if(lst.indexOf(expe[k])>-1)
          this.profil.expe=this.profil.expe+k+", ";
      }

      if(awards && awards.count>0){
        for(let a of awards.results){
          rc.push({
            year:a.year,
            title:a.description,
            pow:null
          })
        }
      }


      this.items=group_works(rc);
      this.items[0].show_year=true;
      for(let i=1;i<this.items.length;i++){
        this.items[i].show_year=(this.items[i].year!=this.items[i-1].year);
      }

      this.data_timeline=[];
      for(let item of this.items){
        let obj:any={year:""+item.year+"<br>"}
        if(item.pow){
          obj.icon="<img src='https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/film-frames_1f39e-fe0f.png' width='30'>";
          obj.label=item.pow.title+"<br><small>"+item.job+"</small>"
        } else {
          obj.icon="<img src='https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/trophy_1f3c6.png' width='30'>";
          obj.label=item.title;
        }
        if(!item.show_year)obj["year"]="<br><br>";
        this.data_timeline.push(obj);

      }
    });
  }

  col_style={
    year:'font-size:2em;text-align:right;padding-right:20px;',
    icon:'margin: 0px',
    label:'text-align:left;'
  }



  //test http://localhost:4200/public/?id=3076
  ngOnInit(): void {
    let id=this.route.snapshot.queryParamMap.get("id");

    if(id){
      this.message="Chargement des expériences";
      this.api._get("extraprofils/"+id+"/").subscribe((p:any)=>{
        this.profil=p;
        setTimeout(()=>{
          this.load_items(this.profil);
        },100);
      })
    } else {
      this.router.navigate(["search"]);
    }
  }

  share() {
    showMessage(this,"Lien du profil disponible dans le presse-papier");
    this.ngNavigatorShareService.share({
      title: this.profil.firstname+" "+this.profil.lastname,
      text: "Profil de l'annuaire de la FEMIS",
      url: this.profil.public_url
    })
      .then( (response) => {console.log(response);},()=>{
        this._clipboardService.copyFromContent(this.profil.public_url);
      })
      .catch( (error) => {
        this._clipboardService.copyFromContent(this.profil.public_url);
      });
  }

  open_price(a: any,movie_title) {
    let url="https://www.google.com/search?q="+a.title+" "+movie_title;
    open(url.replace(" ","+"),"search");
  }

  ngAfterViewInit(): void {
  }
}
