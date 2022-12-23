import { Pipe, PipeTransform } from '@angular/core';
import {DeviceService} from "./device.service";

@Pipe({
  name: 'screencutter'
})
export class ScreencutterPipe implements PipeTransform {
  private screenwidth: number=500;

  constructor(public device:DeviceService) {
  }

  transform(long_version: string,short_version:string=""): string {
    this.screenwidth=this.device.width;
    if(this.screenwidth<600){
      if(short_version.length==0)short_version=long_version.split(" ")[0];
      return short_version;
    }
    return long_version;
  }

}
