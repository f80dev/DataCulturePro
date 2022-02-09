//Image selector version 0.1 - modifié le 9/2

import {Component, Inject, OnInit} from '@angular/core';
import {PromptComponent} from "../prompt/prompt.component";
import {rotate, selectFile, showMessage} from "../tools";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ApiService} from "../api.service";
import {ImageCroppedEvent} from "ngx-image-cropper";
import {ConfigService} from "../config.service";
import {Observable, Subject} from "rxjs";

@Component({
  selector: 'app-image-selector',
  templateUrl: './image-selector.component.html',
  styleUrls: ['./image-selector.component.sass']
})
export class ImageSelectorComponent implements OnInit {

  icons=[];
  showIcons=false;
  pictures=[];
  imagesearchengine_token="";
  ratio=1;
  original:any={};
  types=[{label:"Sticker",value:"sticker"},{label:"Animés",value:"gif"},{label:"Photos",value:"pictures"}];
  selected_type=this.types[0].value;

  imageBase64:string=null;
  croppedImage: any = null;
  originalFile: string;
  inputSearch: string="";
  query: string="";

  trigger: Subject<void> = new Subject<void>();
  image:any;


  constructor(
    public dialog2:MatDialog,
    public snackBar:MatSnackBar,
    public config:ConfigService,
    public api:ApiService,
    public dialogRef: MatDialogRef<ImageSelectorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    if(data.width!=null && data.width==data.height)data.square=true;
    data.title=data.title || "Sélectionner une image";
    if(data.square==null)data.square=true;
    data.maxsize=data.maxsize || 500;
    this.ratio=data.ratio || 1;
    data.width=data.width || data.maxsize;
    if(data.square)data.height=data.width;
    if(data.width>data.maxsize)data.width=data.maxsize;
    if(data.height>data.maxsize)data.height=data.maxsize;
    if(data.direct=="photo")this.onSelectFile({});
    if(data.direct=="files")this.onSelectFile({});

    if(data.result){
      if(data.result.startsWith("http")){
      // this.api.convert(data.result).subscribe((r:any)=>{
      //   this.imageBase64="data:image/jpg;base64,"+r.result;
      // });
      }
      if(data.result.startsWith("data:"))this.imageBase64=data.result;
    }

  }




  onSelectFile(event:any) {
    selectFile(event,this.data.maxsize,this.data.quality,false,(res,original)=>{
      this.imageBase64=res;
      this.original=original;
      this.originalFile=event.target.files[0];
      if(original.indexOf("image/gif")>-1 || original.indexOf("image/png")>-1 || original.indexOf("image/webp")>-1) {
        this.dialogRef.close({img:original,original:original,file:this.originalFile});
      }
    });
  }


  onNoClick(): void {
    this.dialogRef.close();
  }

  rotatePhoto() {
    rotate(this.imageBase64,90,this.data.quality,(res)=>{
      this.imageBase64=res;
    });
  }

  selIcon(icon: any) {
    this.showIcons=false;
    this.data.result=icon.photo;
  }


  addUrl() {
    this.inputSearch="coller l'adresse de votre image";
  }

  imageCropped(event: ImageCroppedEvent) {
    this.croppedImage = event.base64;
    this.data.result=event.base64;
  }


  imageLoaded() {
    // show cropper
  }
  cropperReady() {
    // cropper ready
  }
  loadImageFailed() {
    // show message
  }

  selPicture(tile: any) {
  }

  ngOnInit(): void {
  }

  selImage(picture: any) {
    this.data.result=picture.src;
    this.dialogRef.close({img:picture.src,original:picture.src,file:""});
  }

  handle;
  showWebcam: boolean=false;

  search($event: any) {
    if($event.keyCode==13){
        if(this.query.length==0){
          this.pictures=[];
        } else {
          this.api._get("image_search","q="+encodeURIComponent(this.query)+"&type="+this.selected_type).subscribe((r:any)=>{
          this.pictures=r;
        });
        }
    } else {
      clearTimeout(this.handle);
      this.handle=setTimeout(()=>{this.search({keyCode:13})},700);
    }
  }


  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }


  handleImage(event: any) {
    this.imageBase64=event.imageAsDataUrl;
    this.original=event.imageAsDataUrl;
    this.originalFile=this.original;
    this.showWebcam=false;
  }


  takePhoto() {
    this.trigger.next();
  }
}
