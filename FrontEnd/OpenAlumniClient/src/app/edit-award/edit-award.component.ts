import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {ApiService} from "../api.service";


export interface DialogData {
  title: string;
  result: string;
  profil:any;
  pows:any;
  festivals:any;
}

@Component({
  selector: 'app-edit-award',
  templateUrl: './edit-award.component.html',
  styleUrls: ['./edit-award.component.sass']
})
export class EditAwardComponent implements OnInit {
  sel_pow: any;
  sel_festival: any;
  year: number;
  title:string;

  constructor(
    public api:ApiService,
    public dialog: MatDialogRef<EditAwardComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
  }

  ngOnInit(): void {
    this.sel_festival=this.data.festivals[0];
    this.sel_pow=this.data.pows[0];
  }


  cancel() {
    this.dialog.close();
  }

  valide() {
    this.dialog.close({
      pow:this.sel_pow,
      festival:this.sel_festival,
      title:this.title,
      year:this.year
    });
  }
}
