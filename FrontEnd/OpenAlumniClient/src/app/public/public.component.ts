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
export class PublicComponent implements OnInit {

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
          debugger
          _w.icon="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/film-frames_1f39e-fe0f.png";
          for(let k of this.config.icons.keys()){
            if(_w.job.indexOf(k)>-1)_w.icon=this.config.icons[k];
          }

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
            pow:null,
            icon: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/trophy_1f3c6.png"
          })
        }
      }

      rc.push({
        year:this.profil.degree_year,
        title:"FEMIS - département "+this.profil.department,
        icon: "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/apple/285/graduation-cap_1f393.png"
      })

      this.items=group_works(rc);
      this.items[0].show_year=true;
      for(let i=1;i<this.items.length;i++){
        this.items[i].show_year=(this.items[i].year!=this.items[i-1].year);
      }

      this.data_timeline=[];
      for(let item of this.items){
        let obj:any={
          year:item.year+"<br>",
          icon: "<img src='"+item.icon+"' width='30'>"
        }
        if(item.pow){
          obj.label=item.pow.title+"<br><small>"+item.job+"</small>"
        } else {
          obj.label=item.title;
        }

        if(!item.show_year)obj["year"]="<br><br>";
        if(this.data_timeline.length>0){
          if(!this.data_timeline[this.data_timeline.length-1].show_year && item.show_year){
            this.data_timeline.push({year:"<br><br>",icon:"",label:""});
          }
        }

        this.data_timeline.push(obj);
      }
    });
  }

  col_style={
    year:'font-size:2em;text-align:right;padding-right:20px;',
    icon:'margin: 0px',
    label:'font-size:small;text-align:left;padding-left:5px;padding-bottom:10px;width:80%;line-height:90%;'
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

}
