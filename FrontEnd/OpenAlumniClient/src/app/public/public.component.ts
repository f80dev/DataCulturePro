import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {$$, group_works, showMessage} from "../tools";
import {NgNavigatorShareService} from "ng-navigator-share";
import {ClipboardService} from "ngx-clipboard";
import {ConfigService} from "../config.service";

import {Location} from "@angular/common";

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

  constructor(public router:Router,
              public config:ConfigService,
              public ngNavigatorShareService:NgNavigatorShareService,
              public _clipboardService:ClipboardService,
              public _location:Location,
              public route:ActivatedRoute,
              public api:ApiService) {
  }


  create_awards_timeline(profil_id){
    return new Promise((resolve, reject) => {
      this.api._get("extraawards","profil="+profil_id).subscribe((awards:any)=> {
        this.message="";
        let awards_timeline=[];
        if(awards && awards.count>0){
          for(let a of awards.results){
            awards_timeline.push({
              year:a.year,
              title:a.description + " - " + a.festival.title,
              subtitle:a.pow.title,
              icon: this.config.icons["Award"],
              sources:a.source,
              type:"award",
              label:a.description + " - " + a.festival.title
            })
          }
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

        resolve(awards_timeline);
      },(err:any)=>{reject(err);});
    });
  }


  create_works_timeline(p:any){
    p.expe={};
    let rc=[];
    let old_year=null;
    for(let _w of p.works){
      _w.icon=this.config.icons["Movie"];
      for(let k of Object.keys(this.config.icons)){
        if((_w.job).toLowerCase().indexOf(k.toLowerCase())>-1)_w.icon=this.config.icons[k];
      }

      _w.type="work";
      _w.title=_w.job;
      _w.subtitle=_w.pow.title;
      _w.label=_w.job+"<br>pour <a class='primary-color' href='./pows?query=\""+_w.pow.title+"\"'>"+_w.pow.title+"</a>"
      if(_w.pow.year!=old_year){
        _w.year=_w.pow.year;
        old_year=_w.year;
      }
      if(_w.public)rc.push(_w);

      p.expe[_w.job]=p.expe.hasOwnProperty(_w.job) ? p.expe[_w.job]+1 : 1;

    }
    return rc;
  }


  group_items(rc){
    rc=group_works(rc);
    if(rc.length==0)return rc;
    // rc[0].show_year=true;
    // for(let i=1;i<this.items.length;i++){
    //   rc[i].show_year=(rc[i].year!=rc[i-1].year);
    // }
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

    this.create_awards_timeline(p.id).then((lst_awards:any[])=>{
      this.awards_timeline=lst_awards;
      let rc=this.create_works_timeline(p);
      this.works_timeline=this.group_items(rc);

      let lst=Object.values(this.profil.expe).sort((a,b) => (a<b ? 1 : -1));
      if(lst.length>3)lst=lst.slice(0,3)

      for(let k of Object.keys(this.profil.expe)){
        if(lst.indexOf(this.profil.expe[k])>-1)
          this.expe=this.expe+k+" ";
      }
    })



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


  }

  field_style={
    year:{margin:0,padding:0,'font-size':'3em',color: 'grey','margin-top':'30px','margin-bottom':'15px'},
    label:{margin:0,padding:0,'font-size':'1.5em',color: 'white','margin-bottom':'15px'}
  }

  field_class={
    year: "label mat-body-2"
  }



  //test http://localhost:4200/public/?id=3076

  ngOnInit(): void {
    let id=this.route.snapshot.queryParamMap.get("id");
    if(id){
      this.api._get("profilsdoc/","profil="+id).subscribe((p:any)=>{
        this.profil=p.results[0];
        this.works=this.profil.works;
        this.url=this._location.path();
        this.title = p.firstname + " " + p.lastname;
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


  refresh() {
    this.load_items(this.profil)
  }
}
