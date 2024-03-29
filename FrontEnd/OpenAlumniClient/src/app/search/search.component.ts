import {AfterViewInit, Component, OnInit, ViewEncapsulation} from '@angular/core';
import {ApiService} from "../api.service";
import {$$, abrege, getParams, normaliser, open_report, showError, showMessage, translateQuery} from "../tools";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ActivatedRoute, Router} from "@angular/router";
import {ConfigService} from "../config.service";
import {Location} from "@angular/common"
import {_prompt, PromptComponent} from "../prompt/prompt.component";
import {MatDialog} from "@angular/material/dialog";
import {MatCheckboxChange} from "@angular/material/checkbox";
import {tProfil} from "../types";
import {animate,  state, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.sass'],
  animations:[
    trigger(
      "moveUp", [
        state("middle",style({height:"150px"})),
        state("up",style({height:"10px"})),
        transition("up <=> middle",animate("400ms ease-in"))
      ]
      ),

  ]
})
export class SearchComponent implements OnInit {
  profils:tProfil[]=[];
  query:any={value:""};

  message: string="";
  limit=250;
  perm: string="";
  show_first_screen=true;
  filter_with_pro:boolean=true;

  constructor(public api:ApiService,
              public dialog:MatDialog,
              public toast:MatSnackBar,
              public _location:Location,
              public routes:ActivatedRoute,
              public router: Router,
              public config:ConfigService) {
    this.config.user_update.subscribe(()=>{this.refresh()});
  }


  ngOnInit(): void {
    this.filter_with_pro=(localStorage.getItem("pro_filter") || "true")=="true";
    getParams(this.routes).then((params:any)=>{
      this.query.value=params.filter || params.query || "";
      if(localStorage.getItem("filter_with_pro"))this.filter_with_pro=(localStorage.getItem("filter_with_pro")=="true");
      this.refresh();
      this.update_placeholder();
    })
  }

  update_placeholder(){
    if(this.query.value==""){
      let props=["julia","duc*","ozon","2016","réalisation","scénario 2012","atelier réécriture"]
      this.placeholder="Exemple: "+props[Math.trunc(Math.random()*props.length)]
      setTimeout(()=>{this.update_placeholder()},1000);
    }
  }


  refresh(q=null,limit=600) {
    if(q)this.query.value=q;

    if(this.config.isLogin() && this.fields.length==0){
      if(this.config.hasPerm("admin_sort")){
        this.fields.push({field:"Profil mis a jour",value:"-update"});
        this.fields.push({field:"Nouveau profil",value:"-id"});
      }
    }

    if(this.api.token)this.perm="mail";else this.perm="";
    if(this.query.value.length>=3 || this.advanced_search.length>0){
      let param="/";
      let prefixe="";

      if(this.searchInTitle)prefixe="works__title:"

      //Voir https://django-elasticsearch-dsl-drf.readthedocs.io/en/0.16.3/search_backends.html?highlight=simple_query_string_options#generated-query-3
      let search_engine="search_simple_query_string";
      //if(this.query.value && this.query.value.length==4 && Number(this.query.value).toString()==this.query.value)search_engine="promo";
      //if(this.query.value.indexOf("*")>-1)search_engine="search_simple_query_string"
      param=translateQuery(prefixe+this.query.value,false,search_engine);

      if(this.advanced_search.length>0){
        param="";
        for(let i of this.advanced_search){
          if(i.value && i.value.length>0)
            param=param + i.field + "__wildcard="+i.value+"&";
        }
        param=param.replace("promo__wildcard","promo"); //Car le champs promo est numérique et n'autorise donc pas le wildcard
        param=param.substr(0,param.length-1);
      }

      //Ajout du tri
      if(this.order)localStorage.setItem("ordering",this.order);
      // if(this.order!="-lastname" && this.order!="order_score"){
      //   param=param+"&ordering="+this.order;
      // }else{
      //   this.limit=limit;
      // }
      param=param+"&limit="+limit+"&profil__school=FEMIS";
      $$("Appel de la recherche avec param="+param);
      this.show_first_screen=false
      this.api._get("profilsdoc",param).subscribe((r:any) =>{
        this.message="";
        this.profils=[];
        for(let item of r.results){
          item.department=item.department || "";
          item.filter_tag=normaliser("nom:"+item.lastname+" pre:"+item.firstname+" dep:"+item.department+" promo:"+item.degree_year+" cp:"+item.cp);
          item.order_score=item.degree_year < new Date().getFullYear() ? item.degree_year : item.degree_year-2000;
          if(item.order_score==null)
            item.order_score=0;

          if(item.hasOwnProperty("works")){
            for(let _work of item.works){
              item.filter_tag=normaliser(item.filter_tag+"titre:"+_work.title+" ");
            }
          }

          if(item.department_pro!=""){
            item.backgroundColor="#5471D2"
          }else{
            item.backgroundColor="#81C784";
          }

          if(item.degree_year>=new Date().getFullYear())item.backgroundColor="#f1e627";

          if(item.school=="FEMIS" && (this.filter_with_pro || item.department) && (this.config.show_student || item.backgroundColor!="#f1e627")){

            if(item.department && item.department.length>60){
              item.department=abrege(item.department,this.config.abreviations);
            }

            this.profils.push(item);
          } else {

          }
        }
        if(this.profils.length==0){
          // if(this.query.value.length==0 && this.advanced_search.length==0){
          //   $$("La base des profils est vide, on propose l'importation")
          //   this.router.navigate(["import"]);
          // }

          if(search_engine=="search_simple_query_string" && !this.query.value.endsWith("*") && this.profils.length==0){
            clearTimeout(this.handle)
            this.handle=setTimeout(()=>{
              if(this.profils.length==0){
                this.refresh(this.query.value+"*");
              }
            },2000)
          }

          if(this.query.value.indexOf("*")>-1 && this.profils.length==0){
            showMessage(this,"Aucun profil ne correspond à cette recherche")
          }

          // if(!this.filter_with_pro){
          //   this.filter_with_pro=true;
          //   this.refresh();
          // }

        } else {
          this.toCenter=false;
          if(this.order=="lastname")this.profils.sort((x:any,y:any)=>{if(x.lastname[0]>y.lastname[0])return 1; else return -1;})
          if(this.order=="order_score")this.profils.sort((x:any,y:any)=>{if(x.order_score<y.order_score)return 1; else return -1;})
          if(this.order=="-degree_year")this.profils.sort((x:any,y:any)=>{if(Number(x.degree_year)<Number(y.degree_year))return 1; else return -1;})
          if(this.order=="degree_year")this.profils.sort((x:any,y:any)=>{if(Number(x.degree_year)>Number(y.degree_year))return 1; else return -1;})
          this.config.query_cache=this.profils;
        }
      },(err)=>{
        showError(this,"Probléme d'exécution de la requête de recherche");
      });
    }
  }

  openStats() {
    this.router.navigate(["stats"]);
    //open(environment.domain_server+"/graphql","stats");
  }

  handle=null;
  searchInTitle: boolean = false;
  fields=[
    {field:"Pertinence",value:"order_score"},
    {field:"Nouvelles Promos",value:"-degree_year"},
    {field:"Alphabétique",value:"-lastname"},
    {field:"Anciennes promos",value:"degree_year"}
  ]

  order=this.fields[0].value;

  advanced_search=[];
    placeholder="";
  toCenter: boolean=true;

  onQuery($event: KeyboardEvent) {
    clearTimeout(this.handle);
    if(this.query.value.length>2 || $event.keyCode==13){
      this.handle=setTimeout(()=>{
        this._location.replaceState("search?query="+this.query.value);
        this.refresh();
      },500)
    }
    if(this.query.value=="")this.clearQuery()
  }

  clearQuery() {
    this.query.value='';
    this.profils=[];
    this.refresh();
  }

  async deleteProfil(profil: any) {
    let rep=await _prompt(this,'Confirmation',"",'Supprimer ce profil ?')
    if (rep == 'yes') {
      this.api._delete("profils/"+profil.id).subscribe(()=>{
        showMessage(this,"Profil supprimé");
        this.refresh();
      })
    }
  }

  askfriend(profil: any) {
    this.api._get("askfriend","from="+this.config.user.user.id+"&to="+profil.id).subscribe(()=>{
      showMessage(this,"Votre demande est envoyée");
    })
  }

  help() {
    this.router.navigate(["faqs"],{queryParams:{open:'query'}});
  }

  openQuery(q) {
    this.router.navigate(
      ['search'],
      {queryParams:{filter:q},skipLocationChange:false}
    ).then(()=>{
      window.location.reload();
    });
  }

  switch_motor() {
    if(this.advanced_search.length==0){
      this.advanced_search=[
        {id:"txtFirstname",type:"text",label:"Prénom",width:"150px",value:"",field:"firstname",title:"Paul, Pa*, Fr?d?ri*"},
        {id:"txtLastname",type:"text",label:"Nom",width:"150px",value:"",field:"lastname",title:"Un nom ou le début du nom et *"},
        {id:"txtPromo",type:"text",label:"Promotion",width:"150px",value:"",field:"promo",title:"2001,20*,19??"}
      ]

      //TODO: formation à réinclure
      //{id:"lstFormation",type:"list",label:"Formation",width:"150px",value:"",field:"formation",options:[],title:"Scénario, Réalisation, Atelier*"},
      //this.advanced_search[2].options=["Scénario","Réalisation","Décor"];
    }
    else {
      for(let zone of this.advanced_search) zone.value="";
      this.advanced_search=[];
      this.refresh();
    }
  }

  with_pro($event: MatCheckboxChange) {
    this.filter_with_pro=$event.checked;
    localStorage.setItem("filter_with_pro",String(this.filter_with_pro));
    this.refresh();
  }

  inc_limit() {
    this.limit=this.limit+500;
    this.refresh();
  }

  change_order() {
    let rc=null;
    for(let i=0;i<this.fields.length;i++){
      if(this.order==this.fields[i].value){
        if(i==this.fields.length-1){
          rc=this.fields[i+1];
        } else{
          rc=this.fields[0];
        }
      }
    }
    this.order=rc.value;
    showMessage(this,"Tri par "+rc.field);
    this.refresh();
  }

  update_pro_filter() {
    localStorage.setItem("pro_filter",this.filter_with_pro ? "true" : "false");
    this.refresh();
  }

  open_chart() {
    open_report("student_by_depyear",this.api)
    open_report("prostudent_by_depyear",this.api)
  }
}


