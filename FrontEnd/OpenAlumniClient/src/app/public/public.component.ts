import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {$$, getParams, group_works, showMessage} from "../tools";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";
import {ConfigService} from "../config.service";

import {Location} from "@angular/common";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-public',
  templateUrl: './public.component.html',
  styleUrls: ['./public.component.sass']
})
export class PublicComponent implements OnInit {

  profil:any;
  works: any[]=[];
  message: string;
  items: any[]=[];
  works_timeline:any[]=[];
  awards_timeline:any[]=[];
  expe="";

  url: any;
  title: any;
  pows: any={};

  constructor(public router:Router,
              public config:ConfigService,
              public ngNavigatorShareService:NgNavigatorShareService,
              public _clipboardService:ClipboardService,
              public _location:Location,
              public toast:MatSnackBar,
              public routes:ActivatedRoute,
              public api:ApiService) {
  }


  create_awards_timeline(profil){
    this.message="";
    let awards_timeline=[];

    let old_year="";
    let awards=profil.award.sort( (a,b) => a.year>b.year ? -1 : 1);
    for(let a of awards){
      awards_timeline.push({
        year:old_year==a.year ? "" : ""+a.year,
        title:a.festival.title+" : "+a.description,
        subtitle:this.pows[a.pow].title,
        icon: this.config.icons["Award"],
        sources:a.source,
        type:"award",
        label:"<div class='mat-subheading-1'>"+a.description + " - " + a.festival.title + " pour <span class='primary-color'>"+ this.pows[a.pow].title+"</span></div>"
      })
      old_year=a.year;
    }

    $$("Ajout du diplome");
    if(this.config.hasPerm("admin")){
      awards_timeline.push({
        year:this.profil.degree_year,
        title:"FEMIS - département "+this.profil.department,
        subtitle:"",
        icon: this.config.icons["School"],
        type:"degree"
      })
    }

    return awards_timeline;
  }


  create_works_timeline(p:any,works:any[]){
    p.expe={};
    let rc=[];

    for(let _w of works){
      _w.job=_w.jobs.join(" / ")
      _w.icon=this.config.icons["Movie"];
      for(let k of Object.keys(this.config.icons)){
        if((_w.job).toLowerCase().indexOf(k.toLowerCase())>-1)_w.icon=this.config.icons[k];
      }
      _w.type="work";
      _w.subtitle=_w.title;
      _w.label="<div class='mat-subheading-2'>"+_w.job+" pour <a class='primary-color' href='./pows?query=\""+_w.title+"\"'>"+_w.title+"</a></div>"

      // if(_w.public)

      rc.push(_w);

      p.expe[_w.job]=p.expe.hasOwnProperty(_w.job) ? p.expe[_w.job]+1 : 1;

    }
    return rc;
  }




  convert_to_html(items){
    let rc=[];
    let last_year_to_show=0;
    for(let item of items){
      let obj:any={
        year:item.year+"<br>",

      }

      // if(obj.year.length>0){
      //   if(last_year_to_show!=item.year)rc.push({year:"<br><br>",icon:"",label:""});
      //   last_year_to_show=item.year;
      // }
      // if(item.year==last_year_to_show)obj.year="";

      rc.push(obj);
    }
    return rc;
  }


  load_items(p){
    this.message="Chargement des expériences";

    let works=group_works(p.works);
    let lastYear="";
    for(let i=0;i<works.length;i++){
      if(works[i].year==lastYear)works[i].year="";
      if(works[i].year!="")lastYear=works[i].year;
    }
    this.works_timeline=this.create_works_timeline(p,works);

    let lst=Object.values(this.profil.expe).sort((a,b) => (a<b ? 1 : -1));
    if(lst.length>3)lst=lst.slice(0,3)

    for(let k of Object.keys(this.profil.expe)){
      if(lst.indexOf(this.profil.expe[k])>-1)
        this.expe=this.expe+k+" ";
    }



    // let last_year_to_show="";
    // for(let item of this.items){
    //   if(item.pow){
    //     item.title=item.job;
    //     item.subtitle=item.pow.title;
    //   }


    //icon: "<img src='"+item.icon+"' width='30'>",



    // if(this.works_timeline.length>0){
    //   // if(!this.data_timeline[this.data_timeline.length-1].show_year && item.show_year){
    //   //   this.data_timeline.push({year:"<br><br>",icon:"",label:""});
    //   // }
    // }
    //

    this.awards_timeline=this.create_awards_timeline(p);

  }

  field_style={
    year:{margin:0,padding:0,'font-size':'2.5em','font-weight':'lighter',color: 'grey','margin-top':'50px','margin-bottom':'25px'},
    label:{margin:0,padding:0,'line-height':'120%',color: 'white','margin-bottom':'15px'}
  }

  field_class={
    year: "label mat-body-2"
  }

  cancel(){
    showMessage(this,"Impossible de trouver le profil recherché");
    this.router.navigate(["search"]);
  }


  //test http://localhost:4200/public/?id=3076
  ngOnInit(): void {
    this.message="Chargement du profil";
    getParams(this.routes).then((params:any)=>{
      let id=params["id"]
      if(id){
        this.api._get("extraprofils/"+id+"/").subscribe((p:any)=>{
          this.profil=p;
          this.works=this.profil.works;
          for(let w of this.works){
            this.pows[w.pow.id]=w.pow;
          }
          this.url=this._location.path();
          this.title = p.firstname + " " + p.lastname;

          this.load_items(this.profil);
        },(err)=>{
          this.cancel();
        })
      } else {
        this.cancel();
      }
    })

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


  refresh() {
    this.load_items(this.profil)
  }
}
