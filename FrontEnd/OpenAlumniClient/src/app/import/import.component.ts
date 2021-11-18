import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";
import {showError, showMessage} from "../tools";
import {Router} from "@angular/router";

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.sass']
})
export class ImportComponent implements OnInit {
  message: string="";
  dict="";

  constructor(public api:ApiService,public router:Router) { }

  ngOnInit(): void {
    this.init_dict();
    if(localStorage.getItem("dict"))
      this.dict=localStorage.getItem("dict");
  }

   import(fileInputEvent: any) {
      var reader = new FileReader();
      localStorage.setItem("dict",this.dict);
      this.message="Chargement du fichier";
      reader.onload = ()=>{
        this.message="Transfert du fichier";
        this.api._post("importer/","",{
              filename:fileInputEvent.target.files[0].name,
              size:fileInputEvent.target.files[0].size,
              type:fileInputEvent.target.files[0].type,
              file:reader.result,
              dictionnary:this.dict
            },200).subscribe((r:any)=>{
          this.message="";
          showMessage(this,r);
          this.router.navigate(["search"])
        },(err)=>{
          showError(this,err);
        })
      };
      reader.readAsDataURL(fileInputEvent.target.files[0]);
  }

  init_dict() {
    this.dict="{'cursus':'S','promo':2022}"
  }
}
