import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-reversebloc',
  templateUrl: './reversebloc.component.html',
  styleUrls: ['./reversebloc.component.scss']
})
export class ReverseblocComponent implements OnInit {

  @Input() image="";
  @Input() data:any={};
  @Input() width="300px";
  @Input() minwidth="350px";
  @Input() style:any={};
  @Input() maxwidth="450px";
  @Input() height="300px";
  @Input() margin="10px";
  @Input() reverse=false;

  @Output() onreverse: EventEmitter<any>=new EventEmitter();
  @Input() fontsize="";
  @Input() color="white";
  @Input() title="";
  @Input() icon="";
  @Input() border_color="transparent";



  constructor() { }

  ngOnInit(): void {
  }


  on_reverse(side=true){
    this.onreverse.emit({data:this.data,side:true});
  }


}
