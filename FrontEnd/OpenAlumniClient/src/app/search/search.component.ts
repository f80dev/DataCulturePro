import {AfterContentInit, AfterViewChecked, AfterViewInit, Component, OnInit} from '@angular/core';
import {ApiService} from "../api.service";
import {$$, normaliser, showError, showMessage, translateQuery} from "../tools";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ActivatedRoute, Router} from "@angular/router";
import {ConfigService} from "../config.service";
import {Location} from "@angular/common"
import {PromptComponent} from "../prompt/prompt.component";
import {MatDialog} from "@angular/material/dialog";
import {MatSelect} from "@angular/material/select";
import {MatCheckboxChange} from "@angular/material/checkbox";

@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.sass']
})
export class SearchComponent implements OnInit {
  profils:any[]=[];
  query:any={value:""};
  order:any;
  message: string="";
  limit=50;
  perm: string="";
  dtLastSearch: number=0;
  //@ViewChild('order', {static: false}) order: MatSelect;
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

    if(localStorage.getItem("ordering"))this.order=localStorage.getItem("ordering");
    if(localStorage.getItem("filter_with_pro"))this.filter_with_pro=(localStorage.getItem("filter_with_pro")=="true");

    setTimeout(()=>{this.refresh();},500);
    setTimeout(()=>{
      if(!this.config.isLogin() && !localStorage.getItem('propal_login')){
        localStorage.setItem("propal_login","Done");
        this.dialog.open(PromptComponent,{data: {
            title: 'Se connecter',
            question: 'Vous souhaitez en savoir plus sur les profils. Connectez-vous !',
            onlyConfirm: true,
            lbl_ok: 'Oui',
            lbl_cancel: 'Non'
          }}).afterClosed().subscribe((result_code) => {
          if (result_code == 'yes') {
            this.router.navigate(["login"]);
          }
        });
      }

      if(this.config.isLogin() && !localStorage.getItem('propal_profil')){
        localStorage.setItem("propal_profil","Done");
        this.dialog.open(PromptComponent,{data: {
            title: 'Selectionner un profil',
            question: 'Précisez votre profil pour accèder à d\'autres options de Data Culture',
            onlyConfirm: true,
            lbl_ok: 'Oui',
            lbl_cancel: 'Non'
          }}).afterClosed().subscribe((result_code) => {
          if (result_code == 'yes') {
            this.router.navigate(["profils"]);
          }
        });
      }
    },5000);




  }



  refresh(q=null) {
    if(q)this.query.value=q;

    if(this.api.token)this.perm="mail";else this.perm="";
    if(this.query.value.length>3 || this.query.value.length==0){
      let param="/";
      let prefixe="";

      if(this.searchInTitle)prefixe="works__title:"

      this.message="Chargement des profils";

      param=translateQuery(prefixe+this.query.value);

      if(this.advanced_search.length>0){
        param="";
        for(let i of this.advanced_search){
          if(i.value && i.value.length>0)
            param=param + i.field + "__wildcard="+i.value+"&";
        }
        param=param.substr(0,param.length-1);
      }

      //Ajout du tri
      if(this.order)localStorage.setItem("ordering",this.order);
      if(this.order)param=param+"&ordering="+this.order;
      param=param+"&limit="+this.limit+"&profil__school=FEMIS";
      $$("Appel de la recherche avec param="+param);
      this.api._get("profilsdoc",param).subscribe((r:any) =>{
        this.message="";
        this.profils=[];
        for(let item of r.results){
          item.filter_tag=normaliser("nom:"+item.lastname+" pre:"+item.firstname+" dep:"+item.department+" promo:"+item.degree_year+" cp:"+item.cp);

          for(let _work of item.works){
            item.filter_tag=normaliser(item.filter_tag+"titre:"+_work.title+" ");
          }

          if(item.cursus=="S")
            item.backgroundColor="#171732";
          else
            item.backgroundColor="#341414";

          if(item.school=="FEMIS" && (this.filter_with_pro || item.cursus=="S")){
            this.profils.push(item);
          } else {

          }



        }
        if(this.profils.length==0){
          if(this.query.value.length==0 && this.advanced_search.length==0){
            $$("La base des profils est vide, on propose l'importation")
            this.router.navigate(["import"]);
          }

          if(!this.filter_with_pro){
            this.filter_with_pro=true;
            this.refresh();
          }

        } else {
          this.config.query_cache=this.profils;
        }
      },(err)=>{
        showError(this,err);
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
    {field:"Anciennes Promo",value:"promo"},
    {field:"Nouvelles Promos",value:"-promo"},
    {field:"Mise a jour",value:"-update"},
    {field:"Non mise a jour",value:"update"},
    {field:"Création",value:"-id"}
  ]

  advanced_search=[];

  onQuery($event: KeyboardEvent) {
    clearTimeout(this.handle);
    this.handle=setTimeout(()=>{
      this.refresh();
    },1000);
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
        {label:"Prénom",width:"100px",value:"",field:"firstname",title:"Paul, Pa*, Fr?d?ri*"},
        {label:"Nom",width:"100px",value:"",field:"lastname",title:"Un nom ou le début du nom et *"},
        {label:"Formation",width:"100px",value:"",field:"formation",title:"Scénario, Réalisation, Atelier*"},
        {label:"Promo",width:"50px",value:"",field:"promo",title:"2001,20*,19??"}
      ]
    }
    else this.advanced_search=[];
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
}


