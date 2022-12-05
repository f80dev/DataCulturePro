import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.sass']
})
export class TimelineComponent implements OnChanges {
  columns: any[];
  @Input("data") rows:any[]=[];
  @Input() field_style:any={};
  @Input() field_class:any={};
  @Input("row_style") row_style:any={};
  nbColumns: number=1;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.rows.length==0)return;
    this.columns=Object.keys(this.field_style);
  }


}
