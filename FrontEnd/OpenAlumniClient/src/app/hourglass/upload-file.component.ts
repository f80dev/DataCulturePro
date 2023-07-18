import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {MatSnackBar} from "@angular/material/snack-bar";
import {showMessage} from "../../tools";
import {MAX_FILE_SIZE} from "../../definitions";

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})
export class UploadFileComponent implements OnInit, OnChanges {

  message: string = "";
  filename: string = "";
  @Input("filter") filter: any = {};
  @Input("title") title: string = "";
  @Input("icon") icon: string = "";
  @Input("send_file") send_file: boolean = false;
  @Input() width: string = "fit-content";
  @Input() height: string = "fit-content";
  @Input() zone: boolean = false;
  @Input("encode") encode = true;
  @Input() format = "binary";
  @Input() visual="";
  @Input() can_drop: boolean = true;
  @Input("maxsize") maxsize: number = MAX_FILE_SIZE;
  @Input("show_cancel") show_cancel: boolean = false;
  @Output("uploaded") onupload: EventEmitter<any> = new EventEmitter();
  @Output("canceled") oncancel: EventEmitter<any> = new EventEmitter();
  @Input("extensions") extensions: string = "*"; //format: accept=".doc,.docx"  ou "accept="audio/*"
  style_border: any = {padding:0,margin:0,height:'37px',display:'inline-block',position:"relative",border: 'none', background: 'none'}
  @Input() src="";


  constructor(
      public toast: MatSnackBar,
  ) {

  }

  refresh(){
    if(this.icon.length>0 && this.zone==false){
      this.width="min-content";
      this.style_border["display"]="inline"
    }
    if(this.zone){
      this.style_border={position:"relative",border:"dashed red",height:this.height}
      if(this.visual && this.visual.length>0){
        this.style_border["backgroundImage"]="url('"+this.visual+"')";
        this.style_border["backgroundSize"]="cover";
      }else{
        this.style_border["border"]="none";
        delete this.style_border["backgroundImage"];
        delete this.style_border["backgroundSize"];
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.refresh()
  }

  ngOnInit(): void {
  }

  cancel(){
    this.oncancel.emit();
  }

  import(fileInputEvent: any) {
    let files=fileInputEvent.hasOwnProperty("isTrusted") ? fileInputEvent.target.files : fileInputEvent;
    for(let file of files){
      file.reader = new FileReader();
      if (file.size < this.maxsize) {
        this.filename = file.name;
        file.reader.onload = () => {
          let content = file.reader.result;
          if(content.startsWith("data:image") && this.zone){
            this.visual=content;
            this.refresh();
          }
          this.message = "";
          if(!this.encode)content=atob(content);
          if(this.format=="text"){
            this.onupload.emit({
              filename:file.name,
              file:content,
              type:"plain/txt"
            })
          }else{
            this.onupload.emit({
              filename:file.name,
              file:content,
              type:content.split("data:")[1].split(";")[0]
            })
          }

        }

        if(this.send_file){
          this.onupload.emit({filename:file.name,file:file})
        } else {
          this.message = "Chargement du fichier";
          if(this.format=="binary")
            file.reader.readAsDataURL(file);
          else
            file.reader.readAsText(file,"utf-8")
        }

      } else {
        showMessage(this, "La taille limite des fichier est de " + Math.round((this.maxsize / 1024)/1024) + " Mo",10000);
        this.message = "";
        this.oncancel.emit();
      }
    }
  }
}
