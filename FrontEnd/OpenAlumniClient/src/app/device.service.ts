import {HostListener, Injectable} from '@angular/core';
import {Platform} from "@angular/cdk/platform";

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  modele:any
  width: number=window.innerWidth;
  large=true;

  constructor(platform:Platform) {
    this.modele="desktop";
    if(platform.IOS)this.modele="ios";
    if(platform.ANDROID)this.modele="android";
}


  resize(w:number) {
    this.width=w;
    this.large=w>500;
  }
}
