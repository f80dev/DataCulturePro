import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";

@Component({
  selector: 'app-pow',
  templateUrl: './pow.component.html',
  styleUrls: ['./pow.component.sass']
})
export class PowComponent implements OnInit {
  data: any[]=[];

  constructor(public api:ApiService) { }

  ngOnInit(): void {
    this.api.getPOW().subscribe((r:any)=>{
      this.data=r;
    })
  }

}
