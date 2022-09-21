import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../api.service";
import {group_works, showMessage} from "../tools";
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
  data_timeline: any[]=[];
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


  load_items(p){
    let expe={};
    this.api._get("extraawards","profil="+p.id).subscribe((awards:any)=> {
      this.message="";

      let rc=[];

      if(awards && awards.count>0){
        for(let a of awards.results){
          rc.push({
            year:a.year,
            title:a.description + " - " + a.festival.title,
            subtitle:a.pow.title,
            icon: this.config.icons["Award"],
            sources:a.source,
            type:"award"
          })
        }
      }

      for(let _w of p.works){
        // w=w.replace("True","1").replace("False","0")
        // for(var i=0;i<1000;i++){
        //   w=w.replace("'","\"")
        // }
        // try {
          // let _w=JSON.parse(w);
          _w.icon=this.config.icons["Movie"];

          for(let k of Object.keys(this.config.icons)){
            if((_w.job).toLowerCase().indexOf(k.toLowerCase())>-1)_w.icon=this.config.icons[k];
          }

          _w.type="work";
          if(_w.public)rc.push(_w);
          expe[_w.job]=expe.hasOwnProperty(_w.job) ? expe[_w.job]+1 : 1;
        // } catch (e) {
        //   $$("Probleme de conversion "+w);
        // }
      }
      this.profil.expe="";

      let lst=Object.values(expe).sort((a,b) => (a<b ? 1 : -1));
      if(lst.length>3)lst=lst.slice(0,3)

      for(let k of Object.keys(expe)){
        if(lst.indexOf(expe[k])>-1)
          this.profil.expe=this.profil.expe+k+", ";
      }

      if(this.config.hasPerm("admin")){
        rc.push({
          year:this.profil.degree_year,
          title:"FEMIS - département "+this.profil.department,
          subtitle:"",
          icon: this.config.icons["School"],
          type:"degree"
        })
      }

      this.items=group_works(rc);
      this.items[0].show_year=true;
      for(let i=1;i<this.items.length;i++){
        this.items[i].show_year=(this.items[i].year!=this.items[i-1].year);
      }

      this.data_timeline=[];

      let last_year_to_show="";
      for(let item of this.items){
        if(item.pow){
          item.title=item.job;
          item.subtitle=item.pow.title;
        }

        let obj:any={
          year:item.year+"<br>",
          icon: "<img src='"+item.icon+"' width='30'>",
          label:item.title+"<br><small style='color:white;'> pour <a href='./pows?query=\""+item.subtitle+"\"'>"+item.subtitle+"</a></small>"
        }



        if(this.data_timeline.length>0){
          if(item.year==last_year_to_show)obj.year="";

          // if(!this.data_timeline[this.data_timeline.length-1].show_year && item.show_year){
          //   this.data_timeline.push({year:"<br><br>",icon:"",label:""});
          // }
        }


        if(obj.year.length>0){
          if(last_year_to_show!=item.year)this.data_timeline.push({year:"<br><br>",icon:"",label:""});
          last_year_to_show=item.year;
        }
        this.data_timeline.push(obj);



      }
    });
  }

  col_style={
    year:'margin:0px;padding:0px;font-size:2em;text-align:right;padding-right:20px;',
    icon:'margin:0px;padding:0px;border-left: 2px solid white;padding-left:10px;',
    label:'margin:0px;padding:0px;font-size:medium;text-align:left;padding-left:5px;padding-bottom:10px;width:80%;line-height:100%;'
  }



  //test http://localhost:4200/public/?id=3076
  ngOnInit(): void {
    let id=this.route.snapshot.queryParamMap.get("id");
    if(id){
      this.message="Chargement des expériences";
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



}
