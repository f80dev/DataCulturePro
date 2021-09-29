import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {ApiService} from "../api.service";
import {showError} from "../tools";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.sass']
})
export class PlayerComponent implements OnInit {

  constructor(
    public routes:ActivatedRoute,
    public api:ApiService,
    public toast:MatSnackBar
  ) {

  }

  //http://localhost:4200/player?department=image&year=2010
  movies: any[]=[];

  ngOnInit(): void {
    let params="department="+this.routes.snapshot.queryParamMap.get("department")+"&year="+this.routes.snapshot.queryParamMap.get("year");
    this.api._get("show_movies/",params).subscribe((r:any)=>{
      this.movies=r;
    },(err)=>{showError(this,err)});
  }

}
