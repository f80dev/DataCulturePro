import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.sass']
})
export class TimelineComponent implements OnChanges {
  columns: any[];
  @Input("data") rows:any[]=[];
  @Input("col_style") col_style:any;
  @Input("row_style") row_style:any;

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    if(this.rows.length==0)return;
    this.columns=Object.keys(this.rows[0]);
  }


}
