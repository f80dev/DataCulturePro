//Ajouter FileDragNDropDirective dans les déclarations du module ps

import {Directive, HostBinding, HostListener, Output,EventEmitter} from '@angular/core';

@Directive({
  selector: '[appFileDragNDrop]'
})

export class FileDragNDropDirective {
  @Output() filesChangeEmiter : EventEmitter<File[]> = new EventEmitter();
  @HostBinding('style.border') private borderStyle = '1px dashed';
  @HostBinding('style.border-color') private borderColor = '#696D7D';
  @HostBinding('style.border-radius') private borderRadius = '2px';

  constructor() { }

  @HostListener('dragover', ['$event']) public onDragOver(evt:any){
    evt.preventDefault();
    evt.stopPropagation();

    this.borderColor = 'cadetblue';
    this.borderStyle = '1px solid';
  }

  @HostListener('dragleave', ['$event']) public onDragLeave(evt:any){
    evt.preventDefault();
    evt.stopPropagation();

    this.borderColor = '#696D7D';
    this.borderStyle = '1px dashed';
  }

  @HostListener('drop', ['$event']) public onDrop(evt:any){
    evt.preventDefault();
    evt.stopPropagation();

    this.borderColor = '#696D7D';
    this.borderStyle = '1px dashed';
    let files = evt.dataTransfer.files;
    let valid_files : Array<File> = files;
    this.filesChangeEmiter.emit(valid_files);
  }
}