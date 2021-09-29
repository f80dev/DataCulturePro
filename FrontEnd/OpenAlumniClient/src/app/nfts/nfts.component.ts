import { Component, OnInit } from '@angular/core';
import {ApiService} from "../api.service";

@Component({
  selector: 'app-nfts',
  templateUrl: './nfts.component.html',
  styleUrls: ['./nfts.component.sass']
})
export class NftsComponent implements OnInit {

  nfts:any[]=[];
  url_explorer="";

  constructor(
    public api:ApiService
  ) {
    this.url_explorer="https://devnet-explorer.elrond.com/accounts/erd1z32fx8l6wk9tx4j555sxk28fm0clhr0cl88dpyam9zr7kw0hu7hsx2j524/tokens";
  }

  ngOnInit(): void {
    this.api._get("nfts").subscribe((r:any)=>{
      this.nfts=r.results;
    })
  }

}
