import {AfterContentInit, AfterViewChecked, AfterViewInit, Component, OnInit} from '@angular/core';
import {ApiService} from "../api.service";
import {$$, abrege, normaliser, now, showError, showMessage, translateQuery} from "../tools";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ActivatedRoute, Router} from "@angular/router";
import {ConfigService} from "../config.service";
import {Location} from "@angular/common"
import {PromptComponent} from "../prompt/prompt.component";
import {MatDialog} from "@angular/material/dialog";
import {MatCheckboxChange} from "@angular/material/checkbox";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.sass']
})
export class SearchComponent implements OnInit {
  profils:any[]=[];
  query:any={value:""};

  message: string="";
  limit=250;
  perm: string="";
  dtLastSearch: number=0;
  filter_with_pro: boolean=true;

  constructor(public api:ApiService,
              public dialog:MatDialog,
              public toast:MatSnackBar,
              public _location:Location,
              public routes:ActivatedRoute,
              public router: Router,
              public config:ConfigService) {}


  ngOnInit(): void {
    if(this.query.value=="")
      this.query.value=this.routes.snapshot.queryParamMap.get("filter") || this.routes.snapshot.queryParamMap.get("query") || "";

    //if(localStorage.hasItem("ordering"))this.order=localStorage.getItem("ordering");
    if(localStorage.getItem("filter_with_pro"))this.filter_with_pro=(localStorage.getItem("filter_with_pro")=="true");

    setTimeout(()=>{
      this.refresh();
      if(this.config.isLogin()){
        if(this.config.hasPerm("admin_sort")){
          this.fields.push({field:"Profil mis a jour",value:"-update"});
          this.fields.push({field:"Nouveau profil",value:"-id"});
        }
      }
    },1000);
  }



  refresh(q=null) {
    if(q)this.query.value=q;

    if(this.api.token)this.perm="mail";else this.perm="";
    if(this.query.value.length>3 || this.query.value.length==0){
      let param="/";
      let prefixe="";

      if(this.searchInTitle)prefixe="works__title:"

      this.message="Chargement des profils";

      let search_engine="search";
      if(this.query.value && this.query.value.length==4 && Number(this.query.value).toString()==this.query.value)search_engine="promo";
      if(this.query.value.indexOf("*")>-1)search_engine="search_simple_query_string"
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
      if(this.order!="lastname" && this.order!="order_score"){
        param=param+"&ordering="+this.order;
      }else{
        this.limit=500;
      }
      param=param+"&limit="+this.limit+"&profil__school=FEMIS";
      $$("Appel de la recherche avec param="+param);
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

          if(item.cursus=="S")item.backgroundColor="#171732";
          if(item.cursus=="P")item.backgroundColor="#341414";
          if(item.degree_year>=new Date().getFullYear())item.backgroundColor="#072c00";

          if(item.school=="FEMIS" && (this.filter_with_pro || item.cursus=="S")){

            if(item.department && item.department.length>60){
              item.department=abrege(item.department,this.config.abreviations);
            }

            if(item.department)this.profils.push(item);
          } else {

          }
        }
        if(this.profils.length==0){
          if(this.query.value.length==0 && this.advanced_search.length==0){
            $$("La base des profils est vide, on propose l'importation")
            this.router.navigate(["import"]);
          }

          if(search_engine=="search")this.refresh(this.query.value+"*");

          if(!this.filter_with_pro){
            this.filter_with_pro=true;
            this.refresh();
          }

        } else {
          if(this.order=="lastname")this.profils.sort((x:any,y:any)=>{if(x.lastname[0]>y.lastname[0])return 1; else return -1;})
          if(this.order=="order_score")this.profils.sort((x:any,y:any)=>{if(x.order_score<y.order_score)return 1; else return -1;})
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
    {field:"Pertinance",value:"order_score"},
    {field:"Nouvelles Promos",value:"-promo"},
    {field:"Alphabétique",value:"lastname"},
    {field:"Anciennes promos",value:"promo"}
  ]

  order=this.fields[0].value;

  advanced_search=[];

  onQuery($event: KeyboardEvent) {
    clearTimeout(this.handle);
    this.handle=setTimeout(()=>{
      this._location.replaceState("search?query="+this.query.value);
      this.refresh();
    },2000);
  }

  clearQuery() {
    this.query.value='';
    this.refresh();
  }

  deleteProfil(profil: any) {
    this.dialog.open(PromptComponent,{data: {
        title: 'Confirmation',
        question: 'Supprimer ce profil ?',
        onlyConfirm: true,
        canEmoji: false,
        lbl_ok: 'Oui',
        lbl_cancel: 'Non'
      }}).afterClosed().subscribe((result_code) => {
      if (result_code != 'no') {
        this.api._delete("profils/"+profil.id).subscribe(()=>{
          showMessage(this,"Profil supprimé");
          this.refresh();
        })
      }
    });
  }

  askfriend(profil: any) {
    this.api._get("askfriend","from="+this.config.user.id+"&to="+profil.id).subscribe(()=>{
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
        {id:"txtFirstname",label:"Prénom",width:"100px",value:"",field:"firstname",title:"Paul, Pa*, Fr?d?ri*"},
        {id:"txtLastname",label:"Nom",width:"100px",value:"",field:"lastname",title:"Un nom ou le début du nom et *"},
        {id:"txtFormation",label:"Formation",width:"100px",value:"",field:"formation",title:"Scénario, Réalisation, Atelier*"},
        {id:"txtPromo",label:"Promo",width:"50px",value:"",field:"promo",title:"2001,20*,19??"}
      ]
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
}


