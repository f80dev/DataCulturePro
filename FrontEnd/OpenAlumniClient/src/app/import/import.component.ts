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

  constructor(public api:ApiService,public router:Router) { }

  ngOnInit(): void {
  }

   import(fileInputEvent: any) {
      var reader = new FileReader();
      this.message="Chargement du fichier";
      reader.onload = ()=>{
        this.message="Transfert du fichier";
        this.api._post("importer/","",reader.result,200).subscribe((r:any)=>{
          this.message="";
          showMessage(this,r);
          this.router.navigate(["search"])
        },(err)=>{
          showError(this,err);
        })
      };
      reader.readAsDataURL(fileInputEvent.target.files[0]);
  }

}
