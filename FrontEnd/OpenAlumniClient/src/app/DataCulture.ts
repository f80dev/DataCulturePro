import {$$} from "./tools";

export function awards_timeline(awards,config,profil,pows){
    let awards_timeline=[];

    let old_year="";
    awards=awards.sort( (a,b) => a.year>b.year ? -1 : 1);
    for(let a of awards){
        awards_timeline.push({
            year:old_year==a.year ? "" : ""+a.year,
            title:a.festival.title+" : "+a.description,
            subtitle:pows[a.pow].title,
            icon: config.icons["Award"],
            sources:a.source,
            type:"award",
            label:"<div class='mat-subheading-1'>"+a.description + " - " + a.festival.title + " pour <span class='primary-color'>"+ pows[a.pow].title+"</span></div>"
        })
        old_year=a.year;
    }

    if(profil){
        $$("Ajout du diplome");
        if(config.hasPerm("admin")){
            awards_timeline.push({
                year:profil.degree_year,
                title:"FEMIS - département "+profil.department,
                subtitle:"",
                icon: config.icons["School"],
                type:"degree"
            })
        }
    }


    return awards_timeline;
}