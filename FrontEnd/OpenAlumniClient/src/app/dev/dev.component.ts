import { Component, OnInit } from '@angular/core';
import {Location} from "@angular/common";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ConfigService} from "../config.service";
import {ApiService} from "../api.service";

@Component({
  selector: 'app-dev',
  templateUrl: './dev.component.html',
  styleUrls: ['./dev.component.sass']
})
export class DevComponent implements OnInit {

   constructor(public _location:Location,
              public routes:ActivatedRoute,
               public dialog:MatDialog,
              public config:ConfigService,
              public router:Router,
              public api:ApiService) { }

  ngOnInit(): void {
  }

}
