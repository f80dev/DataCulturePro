import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import {ApiService} from "../api.service";
import {Router} from "@angular/router";
import {$$} from "../tools";

@Component({
  selector: 'app-visgraph',
  templateUrl: './visgraph.component.html',
  styleUrls: ['./visgraph.component.sass']
})
export class VisgraphComponent implements OnInit {

  private svg;
  private margin = 50;
  width = screen.availWidth - (this.margin * 2);
  height = screen.availHeight - (this.margin * 2);

  props=["pagerank"]

  simulation:any;
  forceProperties = {
    center: {
      x: 0.5,
      y: 0.5
    },
    charge: {
      enabled: true,
      strength: -70,
      distanceMin: 1,
      distanceMax: 2000
    },
    collide: {
      enabled: true,
      strength: .7,
      iterations: 1,
      radius: 5
    },
    forceX: {
      enabled: false,
      strength: .1,
      x: .5
    },
    forceY: {
      enabled: false,
      strength: .1,
      y: .5
    },
    link: {
      enabled: true,
      distance: 30,
      iterations: 1
    }
  };

  name: string="";
  data: any;
  sel_node: any=null;
  filter={
    pagerank:{value:0.0005,min:1000,max:-1000,step:0},
    centrality:{value:0.0005,min:1000,max:-1000,step:0},
    promo:{value:0,values:[1990,1991,1992,1993,1994,1995,1996,1997,1998,1999,2000,2001,2002,2003,2004,2005,2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023]},
    department:{value:"",values:["Image","Son","Réalisation","Montage","Décor"]}
  };
  message: string="";
  edge_props: any;

  constructor(
    public api:ApiService,
    public router:Router
  ) { }



  private createSvg(): any {
    return d3.select("figure#graph")
      .append("svg")
      .attr("width", this.width + (this.margin * 2))
      .attr("height", this.height + (this.margin * 2))
      .append("g")
      .attr("transform", "translate(" + this.margin + "," + this.margin + ")");
  }




  initializeForces(data,svg) {
    $$("Données traitées ",data);
    var link = svg
      .selectAll("line")
      .data(data.edges)
      .enter()
      .append("line")
      .property("edgeid",(d) => {return d.id;})
      .on("click", (d)=>{this.sel_edge(d);})
      .style("stroke", "#aaa")

    var nodeEnter = svg
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append("svg:g")
      .attr("class", "node")
      .property("name",function(d) { return d.label;})
      .property("id", function(d) { return d.id;})
      .on("mouseenter", (d)=>{this.mouseenter(d);})
      .on("mouseleave", (d)=>{this.mouseleave(d);})
      .on("click", (d)=>{this.click(d);})
      .on("dblclick", (d)=>{this.sel(d);});

    var node = nodeEnter.append("svg:image")
      .attr("xlink:href",  function(d) { return d.photo;})
      .attr("x", function(d) { return -25;})
      .attr("y", function(d) { return -25;})
      .attr("height", 50)
      .attr("width", 50)

    nodeEnter.append("svg:text")
      .text(function(d) { return d.name;})

    // add forces and associate each with a name
    this.simulation=d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink().id((d:any) => { return d.id; }).links(data.edges))
      .force("charge", d3.forceManyBody())
      .force("collide", d3.forceCollide())
      .force("center", d3.forceCenter())
      .force("forceX", d3.forceX())
      .force("forceY", d3.forceY())
      .on("tick",()=>{
        link
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });

        node
          .attr("x", function (d) { return d.x-25; })
          .attr("y", function(d) { return d.y-25; })
          .attr("opacity", (d)=> {
            let opacity=1;
            for(let p of this.props){
              if(d[p]<this.filter[p].value){
                opacity=0.1;
                break;
              }
            }
            return opacity;
          });

      });

    this.updateForces();
  }




  updateForces() {
    // get each force by name and update the properties
    this.simulation.force("center")
      .x(this.width * this.forceProperties.center.x)
      .y(this.height * this.forceProperties.center.y);
    this.simulation.force("charge")
      .strength(this.forceProperties.charge.strength * Number(this.forceProperties.charge.enabled))
      .distanceMin(this.forceProperties.charge.distanceMin)
      .distanceMax(this.forceProperties.charge.distanceMax);
    this.simulation.force("collide")
      .strength(this.forceProperties.collide.strength * Number(this.forceProperties.collide.enabled))
      .radius(this.forceProperties.collide.radius)
      .iterations(this.forceProperties.collide.iterations);
    this.simulation.force("forceX")
      .strength(this.forceProperties.forceX.strength * Number(this.forceProperties.forceX.enabled))
      .x(this.width * this.forceProperties.forceX.x);
    this.simulation.force("forceY")
      .strength(this.forceProperties.forceY.strength * Number(this.forceProperties.forceY.enabled))
      .y(this.height * this.forceProperties.forceY.y);
    this.simulation.force("link")
      .id(function(d) {return d.id;})
      .distance(this.forceProperties.link.distance)
      .iterations(this.forceProperties.link.iterations)
      .links(this.forceProperties.link.enabled ? this.data.edges : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    this.simulation.alpha(1).restart();
  }



  mouseenter(d){
    this.sel_node=d.target.__data__;
  }

  mouseleave(d){
    this.sel_node=null;
  }

  click(d){
    // this.forceProperties.center.x=d.x/this.width;
    // this.forceProperties.center.y=d.y/this.height;
    // this.updateForces();
  }

  sel_edge(d:any){
    let prop=this.edge_props[d.target.__data__.index];
    this.router.navigate(["pows"],{queryParams:{id:prop}})
  }


  ngOnInit(): void {
    this.svg=this.createSvg();
    this.message="Chargement du réseau";
    this.refresh(this.filter.promo.value,this.filter.department.value);
  }


  sel(d: any) {
    this.router.navigate(["search"],{queryParams:{filter:d.target.__data__.lastname}})
  }


  update_filter(data) {
    //Détermine le max et le min des filtre
    for(let n of data.nodes){
      for(let k of this.props) {
        if(n[k]<this.filter[k].min)this.filter[k].min=n[k];
        if(n[k]>this.filter[k].max)this.filter[k].max=n[k];
      }
    }

    //Positionne les filtres sur la plus basse valeure
    for(let k of this.props){
      this.filter[k].value=this.filter[k].min;
      this.filter[k].step=(this.filter[k].max-this.filter[k].min)/100;
    }


  }

  updateData() {
    this.refresh(this.filter.promo.value,this.filter.department.value);
  }

  refresh(promo_filter=2021,department_filter="") {
    let filter=promo_filter+"_"+department_filter;
    this.api._get("social_graph/json/","film&eval="+this.props.join(",")+"&filter="+filter,120,"").subscribe((data:any)=>{
      this.message="";
      this.data=data.graph;
      this.edge_props=data.edge_props;
      this.update_filter(data.graph);
      this.initializeForces(data.graph,this.svg);
    });
  }
}
