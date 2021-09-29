import { Pipe, PipeTransform } from '@angular/core';
import {DomSanitizer, SafeHtml, SafeResourceUrl, SafeScript, SafeStyle, SafeUrl} from "@angular/platform-browser";

@Pipe({
  name: 'trans'
})
export class TransPipe implements PipeTransform {

  constructor(protected sanitizer: DomSanitizer) {}

  transform(value: any, _type: string="html"): SafeHtml | SafeStyle | SafeScript | SafeUrl | SafeResourceUrl {
    switch (_type) {
      case 'html': return this.sanitizer.bypassSecurityTrustHtml(value);
      case 'style': return this.sanitizer.bypassSecurityTrustStyle(value);
      case 'script': return this.sanitizer.bypassSecurityTrustScript(value);
      case 'url': return this.sanitizer.bypassSecurityTrustUrl(value);
      case 'resourceUrl': return this.sanitizer.bypassSecurityTrustResourceUrl(value);
      default: throw new Error(`Invalid safe type specified: ${_type}`);
    }
  }
}
