import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";


export interface DialogData {
  title: string;
  result: string;
  question:string;
  placeholder:string;
  onlyConfirm:boolean;
  min:number,
  n_rows:number,
  max:number,
  emojis:boolean;
  lbl_ok:string,
  type:string,
  lbl_cancel:string,
  lbl_sup:string,
  options:any[],
  subtitle:string
}


@Component({
  selector: 'app-prompt',
  templateUrl: './prompt.component.html',
  styleUrls: ['./prompt.component.sass']
})

export class PromptComponent implements OnInit {

  showEmoji=false;
  _type="text";
  _min: number;
  _max: number;


  constructor(
    public dialogRef_prompt: MatDialogRef<PromptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData)
  {
    if(data.hasOwnProperty("type"))this._type=data.type;
    if(data.onlyConfirm)data.result="yes";
    if(data.min){
      this._min=data.min;
      this._type="number";
    }
    if(data.max){
      this._max=data.max;
      this._type="number";
    }
    if(!data.result)data.result="";
    if(!data.n_rows)data.n_rows=4;
  }

  onNoClick(): void {
    this.dialogRef_prompt.close(null);
  }

  selectEmoji(event){
    this.data.result=this.data.result+event.emoji.native;
    this.showEmoji=false;
  }


  onEnter(evt:any) {
    if(evt.keyCode==13)
      this.dialogRef_prompt.close(this.data.result);
  }

  select_option(value: any) {
    this.dialogRef_prompt.close(value);
  }

  ngOnInit(): void {
  }
}
