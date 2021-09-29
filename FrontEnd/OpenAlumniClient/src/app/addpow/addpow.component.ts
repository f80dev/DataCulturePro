import { Component, OnInit } from '@angular/core';
import {$$, showError, showMessage} from "../tools";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ConfigService} from "../config.service";
import {ApiService} from "../api.service";
import {Location} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {ImageSelectorComponent} from "../image-selector/image-selector.component";
import {MatDialog} from "@angular/material/dialog";

const reg_url = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';

@Component({
  selector: 'app-addpow',
  templateUrl: './addpow.component.html',
  styleUrls: ['./addpow.component.sass']
})
export class AddpowComponent implements OnInit {

  pows: any[]=[];
  showDetail=false;
  pow: any;
  link:any={url:"",text:""};
  message: string="";

  constructor(public _location:Location,
              public dialog:MatDialog,
              public routes:ActivatedRoute,
              public router:Router,
              public api:ApiService,
              public config:ConfigService,
              public toast:MatSnackBar) { }

  ngOnInit(): void {
    this.initPow();
  }


  initPow(){
    this.pow={title:"",links:[],description:"",visual:""};
    this.pow.owner=this.routes.snapshot.queryParamMap.get("owner");
  }


  quit(bSave=true) {
    if(bSave){
      let id_work=this.routes.snapshot.queryParamMap.get("id");
      if(this.pow.hasOwnProperty('id')){
        if(this.routes.snapshot.queryParamMap.get("redirect")=="addwork") {
          $$("Le titre est déjà dans la base on retourne à l'ajout d'expérience");
          this.router.navigate(["edit"], {
            queryParams:
              {
                id: id_work,
                add: this.pow.id,
                title: this.pow.title
              }
          });
        }
      } else {
        $$("Le titre n'est pas dans la base, on l'enregistre")
        //this.pow.links=JSON.stringify(this.pow.links);
        this.api.addpow(this.pow).subscribe((r:any)=>{
          showMessage(this,"Enregistré");
          if(this.routes.snapshot.queryParamMap.get("redirect")=="addwork"){
            this.router.navigate(["edit"],{queryParams:
                {
                  id:id_work,
                  add:r.id,
                  title:r.title
                },
              replaceUrl:true
            });
          } else {
            this.initPow();
            this.showDetail=false;
          }
        });
      }
    } else {
      this._location.back();
    }

  }

  changeTitle(evt: any) {
    if(evt.length>2){
      this.api._get("pows","search="+evt).subscribe((r:any)=>{
        this.pows=r.results;
      })
    } else {
      this.pows=[];
    }

  }

  add_title() {
    this.showDetail=true;
  }

  select_title(pow:any) {
    this.pow=pow;
    this.quit(true);
  }

  remove(_url: any) {
    this.pow.links.splice(this.pow.links.indexOf(_url),1);
  }

  add_link() {
    if(!this.link.url.startsWith("http"))this.link.url="https://"+this.link.url;
    this.pow.links.push(this.link);
    this.link={url:"",text:""};
  }


  change_visual() {
  this.dialog.open(ImageSelectorComponent, {position:
        {left: '5vw', top: '5vh'},
      maxWidth: 400, maxHeight: 700, width: '50vw', height: '90vh', data:
                {
                  result: this.pow.visual,
                  checkCode: true,
                  width: 200,
                  height: 200,
                  emoji: false,
                  internet: false,
                  ratio: 1,
                  quality:0.7
                }
            }).afterClosed().subscribe((result) => {
      if (result) {
        this.pow.visual= result;
      }
    });
  }


   _import(fileInputEvent: any) {
      var reader = new FileReader();
      let filename=fileInputEvent.target.files[0].name;
      let format=filename.split(".")[1];
      this.message="Chargement du fichier";
      reader.onload = ()=>{
        this.message="Importation du fichier de films";
        this.api._post("movie_importer/","",reader.result,200).subscribe((r:any)=>{
          this.message="";
          showMessage(this,r);
          this.router.navigate(["pows"])
        },(err)=>{
          showError(this,err);
        })
      };
      reader.readAsDataURL(fileInputEvent.target.files[0]);
  }

  analyse() {
    this.message="Analyse global en cours";
    this.api._get("batch").subscribe(()=>{
      this.message="";
    })
  }
}
