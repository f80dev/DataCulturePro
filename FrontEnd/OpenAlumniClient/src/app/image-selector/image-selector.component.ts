import {Component, Inject, OnInit} from '@angular/core';
import {PromptComponent} from "../prompt/prompt.component";
import {rotate, selectFile} from "../tools";
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {ApiService} from "../api.service";
import {ImageCroppedEvent} from "ngx-image-cropper";

@Component({
  selector: 'app-image-selector',
  templateUrl: './image-selector.component.html',
  styleUrls: ['./image-selector.component.sass']
})
export class ImageSelectorComponent implements OnInit {

  icons=[];
  showIcons=false;
  showEmoji=false;
  pictures=[];
  imagesearchengine_token="";
  ratio=1;

  imageBase64:string=null;
  croppedImage: any = null;

  constructor(
    public dialog:MatDialog,
    public snackBar:MatSnackBar,
    public api:ApiService,
    public dialogRef: MatDialogRef<ImageSelectorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    if(data.emoji==null)data.emoji=false;
    if(data.width!=null && data.width==data.height)data.square=true;
    data.title=data.title || "Sélectionner une image";
    if(data.square==null)data.square=true;
    data.maxsize=data.maxsize || 500;
    this.ratio=data.ratio || 1;
    data.width=data.width || data.maxsize;
    if(data.square)data.height=data.width;
    if(data.width>data.maxsize)data.width=data.maxsize;
    if(data.height>data.maxsize)data.height=data.maxsize;

    if(data.result.startsWith("http")){
      // this.api.convert(data.result).subscribe((r:any)=>{
      //   this.imageBase64="data:image/jpg;base64,"+r.result;
      // });
    }
    if(data.result.startsWith("data:"))this.imageBase64=data.result;

  }

  addIcons(){
    var root="https://shifumix.com/avatars/";
    if(this.icons.length==0){
      for(var i=1;i<300;i++)
        this.icons.push({photo:root+"file_emojis"+i+".png"});
    }
    this.showIcons=true;
  }

  selectEmoji(event){
    this.data.result=event.emoji.native;
    this.imageBase64=null;
    this.showEmoji=false;
  }

  onSelectFile(event:any) {
    selectFile(event,this.data.maxsize,this.data.quality,false,(res)=>{
      this.imageBase64=res;
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

  addEmoji() {
    this.dialog.open(PromptComponent,{width: '250px',data: {title: "Utiliser un emoji", question: ""}
    }).afterClosed().subscribe((result) => {
      if(result){
        this.data.result=result;
        this.imageBase64=null;
      }
    });
  }

  ngOnInit() {
  }

  addUrl() {
    this.dialog.open(PromptComponent, {
      width: '250px', data: {title: "Un mot clé ou directement une adresse internet de votre image", question: ""}
    }).afterClosed().subscribe((result) => {
      if (result) {
        if(result.startsWith("http")){
          this.data.result=result;
        } else {
          // this.api.gettokenforimagesearchengine().subscribe((token:any)=>{
          //   this.api.searchImage(result,10,token.access_token).subscribe((r:any)=>{
          //     if(r==null || r.length==0)
          //       this.snackBar.open("Désolé nous n'avons pas trouvé d'images pour le mot "+result,"",{duration:2000});
          //     else{
          //       if(r.length>10)r=r.slice(0,9);
          //       this.pictures=r;
          //       this.imageBase64=null;
          //     }
          //
          //   });
          // });
        }

      }
    });
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
    // this.api.convert(tile).subscribe((res:any)=>{
    //   this.imageBase64="data:image/jpg;base64,"+res.result;
    // });
  }

}
