import {environment} from '../environments/environment';
import {Router} from '@angular/router';
import {WebcamUtil} from "ngx-webcam";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SocialServiceConfig} from "ngx-social-button";

declare var EXIF: any;
export const ADMIN_PASSWORD="hh4271";




export function showError(vm:any,err:any){
  $$("!Error ",err);
  if(vm.hasOwnProperty("message"))vm.message="";
  showMessage(vm,"L'application est en cours de maintenance, Merci de réessayer l'opération dans quelques instants");
}


export function translateQuery(text:string,all_term=false,query="search_simple_query_string"):string {
  if(text.length==0)return "";
  let dict={
    "nom":"lastname",
    "prenom":"firstname",
    "prénom":"firstname",
    "code postal":"cp",
    "film":"works__title",
    "ville":"town",
    "promotion":"promo",
    "job":"works__job"
  }
  for(let k in dict){
    text=text.replace(k+":",dict[k]+":");
  }

  if(text.indexOf(":")>0){
    let rc="";
    for(let term of text.split(" ")){
      rc=rc + term.replace(":","=")+"&"
    }
    return rc.substr(0,rc.length-1);
  }

  if(all_term){
    let rc="";
    for(let wrd of text.split(" ")){
      rc=rc+"title__term="+wrd.toLowerCase().trim()+"&";
    }
    text=rc.substr(0,rc.length-1);
  }
  else
    text=query+"="+text;

  return text;
}

export function brand_text(text:string,config:any){
  if(config.values){
    text=text.replace("%appname%",config.values.appname).replace("%APPNAME%",config.values.appname);
  }
  //text=text.replace("%"+text+"%",config.values[text]);
  return text;
}


export function abrege(s:string,abrevations:any):string {
  for(let k of Object.keys(abrevations)) {
    s=s.replace(k,abrevations[k]);
  }
  return s;
}


export function normaliser(s:string):string {
  s=s.replace("é","e").replace("è","e").replace("ê","e");
  return s.toLowerCase()
}

export function remove_ponctuation(s:string):string {
  for(let it of [":",",",";","!","?","-","_","  "])
    s=s.replace(it," ");

  return s.trim();
}




export function extract_id(url:string):string {
  if(url.indexOf("?")>-1)url=url.substr(0,url.indexOf("?"));
  if(url.endsWith("/"))url=url.substr(0,url.length-1);
  if(url.indexOf("/")==-1)return url;
  let lastPos=url.lastIndexOf("/");

  return url.substr(lastPos+1);
}


export function group_works(wrks) {
  let rc=[];
  for(let w of wrks){
    if(w.hasOwnProperty("pow") && w.pow){
      w.title=w.pow.title;
      w.year=w.pow.year;
    }
    let new_work=w;
    for(let tmp of wrks){
      if(tmp.title==w.title){
        let idx=rc.indexOf(tmp);
        if(idx>-1){
          rc[idx].job=rc[idx].job +" & "+w.job
          new_work=null;
          break;
        }
      }
    }

    if(w.state!="D"){
      if(new_work){
        rc.push(new_work);
      }

    }
  }

  rc.sort((a, b) => (Number(a.year) > Number(b.year) ? -1 : 1));
  return rc;
}


export function range(start=0, end) {
  var ans = [];
  for (let i = start; i <= end; i++) {
    ans.push(i);
  }
  return ans;
}

export function getAuthServiceConfigs() {
  let config = new SocialServiceConfig()
    .addFacebook("1064548794002409")
  return config;
}

function readPerm(perm:string,perms,sep:string=","):string {
  for(let p of perms){
    let rc="";
    if(p.tag==perm)rc=p.description;
    if(rc.length==0 && p.tag==perm.replace("r_",""))rc=p.description;
    if(rc.length==0 && p.tag==perm.replace("w_",""))rc=p.description+" en modification";
    if(rc.length>0)return rc+sep;
  }
  return "";
}


export function detailPerm(perm:string,perms,format="txt"): string {
  if(!perm)return "";
  let rc="";
  if(format=="html")rc="<ul>";
  for(let it of perm.split(" ")){
    if(format=="txt")
      rc=rc+readPerm(it,perms,"")+" / ";
    else
      rc=rc+"<li>"+readPerm(it,perms)+"</li>";
  }
  if(format=="html")rc=rc+"</ul>";
  return rc;
}


export function api(service: string , param: string= '', encode: boolean = true,format:string="json"): string  {
  let rc=environment.domain_server + '/api/' + service+"/?";
  if (encode) { param = encodeURI(param); }
  if(format.length>0)rc=rc+"&format="+format;
  if(param.length>0)rc=rc+"&"+param;
  for(let i=0;i<10;i++)
    rc=rc.replace("//","/").replace("?&","?");

  if(rc.endsWith("?"))rc=rc.substr(0,rc.length-1);
  rc=rc.replace("http:/","http://").replace("https:/","https://");
  rc=rc.replace("&&","&");
  $$("Appel de "+rc);
  return rc;
}


export function direct_api(service: string , param: string, encode: boolean = true): string  {
  if (encode) { param = encodeURI(param); }
  return(environment.domain_server+ '/api/' + service + '?' + param);
}

export function hashCode(s) {
  // tslint:disable-next-line:no-bitwise
  return s.split('').reduce((a, b) => {a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
}

export function tirage(max) {
  return Math.trunc(Math.random() * max);
}

export function selectFile(event:any,maxsize:number,quality:number,square:boolean=true,func:Function=null){
  if(event.target.files && event.target.files.length > 0) {
    var reader = new FileReader();
    reader.onload = ()=>{
      var dataURL = reader.result;
      resizeBase64Img(dataURL,maxsize,quality,(result=>{
        autoRotate(result,quality,(res)=>{
          if(square){
            cropToSquare(res,quality,(result_square)=>{
              func(result_square);
            });
          }
          else
            func(result);
        })
      }));
    };
    reader.readAsDataURL(event.target.files[0]);
  }
}

export function getTime(d){
  var _d=new Date(d*1000);
  return _d.getHours()+":"+_d.getMinutes();
}

export function isToday(d){
  var _d=new Date(d*1000);
  _d.setHours(0);
  _d.setMinutes(0);
  _d.setSeconds(0);

  //TODO: a vérifier l'histoire du GMT fuseau pour l'égalité
  var _now=new Date();
  _now.setMinutes(0);
  _now.setHours(0);
  _now.setSeconds(0);

  var diff=(_now.getTime()-_d.getTime());
  return diff==0;
}




export function now(){
  return new Date().getTime();
}




//On cherche a produire une reference au terminal de l'utilisateur
export function unique_id(){
  var rc="";
  rc=rc+navigator.userAgent; // User Agent
  rc=rc+navigator.platform; // nom du système d'exploitation
  rc=rc+navigator.product;
  rc=rc+navigator.cookieEnabled; // si les cookies sont activés ou non
  rc=rc+navigator.appName; // nom complet du navigateur
  rc=rc+navigator.appCodeName; // nom de code du navigateur
  rc=rc+screen.height;// hauteur de l'écran (en pixels)
  rc=rc+screen.width; // largeur de l'écran (en pixels)
  rc=rc+screen.colorDepth; // profondeur de couleur.
  return rc;
}

export function sendToPrint(section="print-section"){
  const printContent:any = document.getElementById(section);
  const WindowPrt = window.open('', '', 'left=0,top=0,width=900,height=900,toolbar=0,scrollbars=0,status=0');
  WindowPrt.document.write(printContent.innerHTML);
  WindowPrt.document.close();
  WindowPrt.focus();
  WindowPrt.print();
}


/**
 * Ouverture d'un graph des transactions
 * @param tx
 */
export function openGraph(tx:string){
  var domain_server="http://localhost";

  var graph_url=domain_server+":6800/api/getgraph/"+tx+"/50/gpickle";
  var url=domain_server+":5500/graph/b64="
    +btoa(graph_url)+"/fr?algo_comm=self&dir=public&axis=False&notext=True&metrics=True&add_property=False&autorotate=False" +
    "&limit=5000&pca=1&processors=2&title=Distribution_des_coupons_de_votre_point_de_vente";
  $$("url=",url);
  return url;
}

export function isNull(x:Object) {
  if (x == null)
    return true;
  else
    return false;
}

/**
 *
 * @param vm
 * @param event_name
 * @param func
 */
export function subscribe_socket(vm:any,event_name:string,func=null){
  if(vm.socket!=null){
    $$("Installation de la socket pour l'event "+event_name);
    vm.socket.on(event_name, (data: any) => {
      if (data.to == vm.config.user.address || data.to=="*") {
        $$("Réception de "+event_name+" avec data=",data);
        if(vm.toast!=null && data.message!=null && data.message.length>0)showMessage(vm,data.message);

        setTimeout(()=>{
          if(func==null) {
            if (vm.refresh != null) vm.refresh();
          }else{
            func(data);
          }
        },500);

      }
    });
  } else {
    $$("Impossibilité d'installer la socket pour "+event_name);
    debugger;
  }
}





export function $$(s: string, obj: any= null) {
  if((s!=null && s.startsWith("!")) || localStorage.getItem("debug")=="1"){
    debugger;
  }
  const lg = new Date().getHours() + ':' + new Date().getMinutes() + ' -> ' + s;
  if (obj != null) {
    obj = JSON.stringify(obj);
  } else {
    obj = '';
  }
  console.log(lg + ' ' + obj);
  if (lg.indexOf('!!') > -1  || localStorage.getItem("debug")=="2") {alert(lg); }
}


/**
 * Creation d'une carte
 */

declare var ol: any;

export function createMap(center:any,
                          icon="https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/google/223/man_1f468.png",
                          zoom=18,scale=0.2,
                          func_move=null,func_sel=null,func_click=null){
  var vectorSource = new ol.source.Vector({
    features: [
      createMarker(center.lng,center.lat,icon,null,scale)
    ]
  });

  var vectorLayer=new ol.layer.Vector({source: vectorSource});
  //var olSource=new ol.layer.Tile({source: new ol.source.OSM()});
  //Info sur la source : https://www.bingmapsportal.com/Application
  var olSource=new ol.layer.Tile({source: new ol.source.BingMaps({
      imagerySet: 'Road',
      key: 'Am04xtfIsPy43By5-20LAeD2uxvrX9Yfe3DVunnWQoCeT3Kzks9J7-9DU63EzEaf'
    })});

  var rc=new ol.Map({
    target: 'map',
    layers: [
      olSource,
      vectorLayer,
    ],
    view: new ol.View({
      center: ol.proj.fromLonLat([center.lng, center.lat]),
      zoom: zoom
    })
  });

  if(func_sel){
    rc.on("dblclick", function(e) {
      rc.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        func_sel(feature);
      })
    });
  }

  if(func_click)
    rc.on("singleclick",(e)=>{
      rc.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
        func_click(feature);
      });
    });

  // if(func_move)
  //   rc.on('pointermove',(e)=> {
  //     rc.forEachFeatureAtPixel(e.pixel, function (feature, layer) {
  //       func_sel(feature);
  //     });
  //   });


  if(func_move!=null){
    rc.on("moveend",func_move);
  }
  return rc;
}

export function getMarkerLayer(map:any):any {
  var rc=null;
  map.getLayers().forEach((layer) => {
    if (layer instanceof ol.layer.Vector) {
      rc=layer;
    }
  });
  return rc;
}

/**
 * Affichage du message
 * @param vm
 * @param s
 * @param duration
 */
export function showMessage(vm:any,s:string="",duration=2000,func=null,label_button="ok"){
  if(s==null || s.length==0)return false;
  s=s+"";
  $$("Affichage du message :",s)
  if(s.startsWith("#")){
    //Affichage en mode plein écran
    s=s.substr(1);
    vm.message=s;
    if(s.length>0)setTimeout(()=>{vm.showMessage=true;},500);
  } else {
    //Affichage en mode toaster
    var toaster:MatSnackBar=vm.toast || vm.snackBar || vm.toaster;
    if(toaster!=null){
      if(func!=null){
        toaster.open(s,label_button,{duration:duration}).onAction().subscribe(()=>{
          func();
        });
      } else {
        toaster.open(s,"",{duration:duration});
      }
    }

  }
}


/**
 * Demande l'authentification
 * @param vm
 * @param message
 * @param redirect
 * @param func
 */
export function askForAuthent(vm:any,message:string,redirect:string){
  if(vm.config.user!=null && vm.config.user.user.email==""){
    $$("L'utilisateur n'est pas encore authentifié, il est renvoyé vers la page de login");
    vm.router.navigate(["login"],{queryParams:{message:message,redirect:redirect}});
  } else {
    $$("Email renseigne "+vm.config.user.user.email+", redirection vers "+redirect);
    if(redirect.startsWith("http")){
      redirect=redirect.replace("{{email}}",vm.config.user.user.email);
      open(redirect,"_blank");
    } else{
      if(redirect.indexOf("?")>-1)
        vm.router.navigateByUrl(redirect);
      else
        vm.router.navigate([redirect]);
    }

  }
}



export function isLocal(){
  return location.href.indexOf("localhost") > -1;

}

export function loginWithEmail(vm:any,user:any,func:Function=null,func_error:Function=null) {
  if(!vm.dialog)$$("La fenetre ne dispose pas de 'dialog'");
  var _width="250px";
  if(screen.width>600){_width="400px";}
  // vm.dialog.open(LoginComponent,{width:_width,data: {facebook:true,google:true,email:true,user:user}}).afterClosed().subscribe((result:any) => {
  //   if(result) {
  //     $$("Récupération correct des coordonnées du compte ",result);
  //     if (func) func(result);
  //   }
  //    else {
  //      $$("Probleme de récupération du user");
  //     if(func_error)func_error();
  //   }
  // });
}

export function traitement_coupon(coupons:any[],showCoupon:string) : any {
  var rc=[];
  if(coupons==null)return rc;

  coupons.forEach((coupon:any)=>{
    if(coupon._id==showCoupon)coupon.visible=true;
    coupon["visible"]=false;
    coupon["message"]="Je recommande cette promotion. "+buildTeaser(coupon,coupon.shopname);
    rc.push(coupon);
  });
  return rc;
}


/**
 * Mise en forme du teaser de la promotion
 * @param c
 * @param lieu
 * @param withCondition indique si l'on doit ou pas ajouter les conditions
 *
 */
export function buildTeaser(coupon:any,lieu:string,withCondition=false){
  var rc=coupon.label;
  var prefixe="à";

  if(lieu==null)lieu="";
  if(lieu.toLowerCase().startsWith("chez"))prefixe="";
  if(lieu.toLowerCase().startsWith("au ") || lieu.toLowerCase().startsWith("à ") || lieu.toLowerCase().startsWith("a "))prefixe="";
  rc=rc+" "+prefixe+" '"+lieu+"'";

  var pluriel="s";
  var firstWord=coupon.unity.split(" ")[0];
  if(firstWord.endsWith("x") || firstWord.endsWith("%") || firstWord.endsWith("s"))pluriel="";
  if(coupon.max<=1)pluriel="";

  if(coupon.max>0){
    if(!rc.toLowerCase().startsWith("gagne"))rc=rc+". Gagnez";
    rc=rc+", jusqu'a "+coupon.max+" "+coupon.unity.replace(firstWord,firstWord+pluriel)+" ("+coupon.symbol+")";
  }

  if(withCondition){
    var prefixe_conditions="pour ";
    if(coupon.conditions.toLowerCase().startsWith("pour") || coupon.conditions.toLowerCase().startsWith("sur"))prefixe_conditions="";
    rc=rc+", "+prefixe_conditions+coupon.conditions;
  }

  for (var i=0;i<10;i++)
    rc=rc.replace("..",".").replace("!.","!").replace("  "," ");

  return rc;
}





export function createMarker(lon,lat,icon,coupon=null,scale=0.2){
  if(!icon)icon="";
  var iconStyle:any=new ol.style.Style({image: new ol.style.Circle({radius: 15,fill: new ol.style.Fill({color: 'white'})})});

  if(!icon.startsWith("data") && !icon.startsWith("http") && !icon.startsWith("./")) {
    //On a un emoji
    iconStyle = new ol.style.Style({
      text: new ol.style.Text(({
        anchor: [0.6, 1.0],
        text: icon,
        scale:3,
        textAlign: "center"
      }))
    });
  } else {
    //On a une image
    iconStyle = new ol.style.Style({
      image: new ol.style.Icon(({
        anchor: [0.6, 1.0],
        scale:scale,
        anchorXUnits: 'fraction',
        anchorYUnits: 'pixels',
        src: icon,
        opacity:1.0,
      })),
    });
  }

  if(coupon!=null){
    iconStyle.setText(new ol.style.Text({
      text: coupon.symbol,
      textAlign:"center",
      font:"22px sans-serif"
    }));
  }

  var marker = new ol.Feature({
    geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
  });
  marker.coupon=coupon;

  marker.setStyle(iconStyle);
  return marker;
}


/**
 *
 * @param base64
 * @param maxsize
 * @param quality
 * @param func
 */
export function resizeBase64Img(base64, maxsize,quality,func) {
  if(base64==null || base64==""){
    $$("Probleme d'image vide");
    func();
  }

  var canvas:any = document.createElement("canvas");
  var img=new Image();
  img.onload=function(){
    var ratio=1;
    if(maxsize!=null)ratio=maxsize/Math.max(img.width,img.height);

    if(ratio<=1){
      canvas.width =img.width*ratio;
      canvas.height =img.height*ratio;
      var context = canvas.getContext("2d");
      context.drawImage(img, 0, 0,canvas.width,canvas.height);
      var rc=canvas.toDataURL("image/jpeg", quality);
    }
    else
      rc=base64;

    func(rc);
  };

  img.src=base64;
}


/**
 *
 */
// export function getAuthServiceConfigs() {
//   let config = new SocialServiceConfig()
//     .addFacebook("1746089735526674")
//     .addGoogle("1075601969790-d4dujm30k9lebicc1k2uudacbijj84of.apps.googleusercontent.com")
//     .addLinkedIn("86cnm1fo8cffax")
//   return config;
// }


/**
 *
 * @param base64
 * @param func
 */
export function getSize(base64,func){
  var img=new Image();
  img.src=base64;
  img.onload=function(){
    func(img.width,img.height);
  }
}


/**
 *
 * @param base64
 * @param x
 * @param y
 * @param width
 * @param height
 * @param quality
 * @param func
 * @param func_error
 */
export function cropBase64Img(base64,x,y,width,height,quality=1,func,func_error) {
  try{
    var canvas:any = document.createElement("canvas");
    var img=new Image();
    img.crossOrigin="anonymous";
    img.onload=function(){
      canvas.width=width;
      canvas.height=height;
      var context = canvas.getContext("2d");
      context.drawImage(img, x, y,width,height,0,0,width,height);
      var rc=canvas.toDataURL("image/jpeg", quality);
      func(rc);
    };

    img.src=base64;
  }catch (e){
    if(func_error!=null)func_error(e);
  }
}

/**
 * Permet de calculer le titre du coupon par défaut
 * @param coupon
 */
export function evalTitle(coupon:any){
  var s=coupon.label;
  if(s.length>30)s=s.substr(0,30)+"...";
  if(coupon.max>0)s=s+" - Jusqu'a "+coupon.max+coupon.symbol;
  return s;
}


/**
 * Retourne la blancheur de l'image permettant de choisir la couleur du texte
 * @param imageSrc
 * @param callback
 */
export function getImageLightness(imageSrc,callback) {
  var img:any = document.createElement("img");
  img.src = imageSrc;
  img.style.display = "none";
  document.body.appendChild(img);

  var colorSum = 0;

  img.onload = ()=> {
    // create canvas
    var canvas:any = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    img.setAttribute("crossOrigin","");

    var ctx = canvas.getContext("2d");
    ctx.drawImage(img,0,0);

    try{
      var imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      var data = imageData.data;
      var r,g,b,avg;

      for(var x = 0, len = data.length; x < len; x+=4) {
        r = data[x];
        g = data[x+1];
        b = data[x+2];

        avg = Math.floor((r+g+b)/3);
        colorSum += avg;
      }

      var brightness = Math.floor(colorSum / (img.width*img.height));
      callback(brightness);
    } catch (e) {
      callback(0);
    }
  }
}



export function cropToSquare(base64,quality=1,func) {
  var img=new Image();
  img.onload=function(){
    var i:any=this;
    var l=Math.min(i.width,i.height);
    var x=(i.width-l)/2;
    var y=(i.height-l)/2
    cropBase64Img(base64,x,y,l,l,quality,func,null);
  };
  img.src=base64;
}

export function compute(coupon:any){
  coupon["conditions"]=coupon["conditions"] || "";
  if(coupon.visual==null)coupon.visual=coupon.picture;

  if(coupon.label=="")coupon.label="Super promotion";

  if(coupon.conditions=="")coupon.conditions="sur simple présentation du coupon REDUCSHARE";
  if(!coupon.conditions.startsWith("pour ") && !coupon.conditions.startsWith("sur "))coupon.conditions="pour "+coupon.conditions;
  coupon.conditions=coupon.conditions.replace("offre valable pour","").replace("valable pour","");

  coupon.dtStart=new Date().getTime();

  if(coupon.duration_jours==null)coupon.duration_jours=0;
  if(coupon.duration_hours==null)coupon.duration_hours=0;


  coupon.durationInSec=coupon.duration_jours*24*3600+coupon.duration_hours*3600;
  coupon.delay=0;

  coupon.share_bonus=Number(coupon.share_bonus);
  coupon.pay_bonus=Number(coupon.pay_bonus);
  coupon.direct_bonus=Number(coupon.direct_bonus);
  coupon.final_bonus=Number(coupon.final_bonus);
  coupon.max=Number(coupon.max);
  coupon.stock=Number(coupon.stock);
  if(coupon.ink_color==null)coupon.ink_color="white";

  if(coupon.nb_partage>0)
    coupon.share_bonus=1/coupon.nb_partage;
  else
    coupon.share_bonus=0;

  //if(coupon.pluriel && coupon.unity.endsWith("s"))coupon.unity=coupon.unity.substr(0,coupon.unity.length-1);
  coupon.unity=coupon.unity.toLowerCase();
  return coupon;
}

export function exportToHTML(src:string,coupon:any,func:Function,color="darkred"){
  var code="";
  var fields=[];
  for (let word of src.split(" ")){
    var field=word.replace("#","").replace("@","");

    if(word.startsWith("#")){
      fields.push(field);
      field=field.split("=")[0];
      code=code+"<span id='id_"+field+"' style='color:"+color+";cursor: pointer;font-weight: bold;'>"+coupon[field]+"</span> ";
    }

    if(word.startsWith("@"))code=code+coupon[field]+" ";
    if(!word.startsWith("@") && !word.startsWith("#"))code=code+word+" ";
  }
  setTimeout(()=>{func(fields)},10);

  return normeString(code);
}

export function checkConfig(vm:any) {
  if(vm.config==null || vm.config.user==null){
    if(vm.router!=null)
      vm.router.navigate(["home"]);
    else {
      $$("Tentative de retour à la page principale");
      window.location.reload();
    }
  }
}

export function checkLogin(vm, func_success=null,func_abort=null,redirect="search" ,params= {}) {
  setTimeout(() => {
    if (vm.config.user == null || vm.config.user.user == null || vm.config.user.user.email == "") {
      if (func_abort){
        func_abort();
      }else{
        if(vm.router)vm.router.navigate([redirect], {queryParams: params});
      }
      return false;
    } else {
      if (func_success) func_success();
      return true;
    }
  }, 1000);
}

export function openGraphForShop(idshop:string,_type="coupon",domain_server="https://server.f80lab.com"){
  var graph_url=domain_server+":5500/api/getgraph/"+idshop+"/hh4271/gpickle/"+_type;
  var url=domain_server+":5000/graph/b64="
    +btoa(graph_url)+"/fr?algo_comm=self&dir=public&axis=False&notext=True&metrics=True&add_property=False&autorotate=False" +
    "&limit=5000&pca=1&processors=2&title=Distribution_des_coupons_de_votre_point_de_vente";
  $$("url=",url);
  return url;
}



export function arrayRemove(arr, value) {
  return arr.filter((ele)=>{
    return ele != value;
  });
}

export function stringDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0)
  {
    return bn;
  }
  if (bn === 0)
  {
    return an;
  }
  const matrix = new Array<number[]>(bn + 1);
  for (let i = 0; i <= bn; ++i)
  {
    let row = matrix[i] = new Array<number>(an + 1);
    row[0] = i;
  }
  const firstRow = matrix[0];
  for (let j = 1; j <= an; ++j)
  {
    firstRow[j] = j;
  }
  for (let i = 1; i <= bn; ++i)
  {
    for (let j = 1; j <= an; ++j)
    {
      if (b.charAt(i - 1) === a.charAt(j - 1))
      {
        matrix[i][j] = matrix[i - 1][j - 1];
      }
      else
      {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1], // substitution
          matrix[i][j - 1], // insertion
          matrix[i - 1][j] // deletion
        ) + 1;
      }
    }
  }
  return matrix[bn][an];
}



export function fixTagPage(meta:any,coupon:any){
  meta.removeTag('name = "og:url"');
  meta.removeTag('name = "og:type"');
  meta.removeTag('name = "og:title"');
  meta.removeTag('name = "og:description"');
  meta.removeTag('name = "og:image"');

  meta.addTags([
    {name:"og:url",content:coupon.url},
    {name:"og:type",content:"website"},
    {name:"og:locale",content:"fr_FR"},
    {name:"og:title",content:coupon.label},
    {name:"og:description",content:"Ouvrir pour profiter vous aussi de la promotion"},
    {name:"og:image",content:coupon.picture}
  ],true);
}

export function initAvailableCameras(func){
  $$("Ouverture des caméras");
  WebcamUtil.getAvailableVideoInputs()
    .then((mediaDevices: MediaDeviceInfo[]) => {
      if(mediaDevices==null)
        func(0)
      else
        func(mediaDevices.length);
    });
}

//
// export function openGeneral(item, domain)  {
//   return new Promise((resolve, reject) => {
//       const url = environment.root_api + '/api/connectTo?service=' + item + '&domain=' + domain;
//       const hwnd: any = window.open(url, 'Login', 'menubar=0,status=0,height=600,titlebar=0,width=400');
//       window.addEventListener('message', (event: any) => {
//         clearInterval(hTimer);
//         resolve(event.data);
//       }, false);
//
//       const hTimer = setInterval(() => {
//         if (hwnd != null) {
//           if (hwnd.location.href != null && hwnd.location.href.indexOf('email') > -1) {
//             const pos = hwnd.location.href.indexOf('email=');
//             const email = hwnd.location.href.substr(pos + 6, hwnd.location.href.indexOf('&', pos) - pos - 6);
//             const password = hwnd.location.href.substr(hwnd.location.href.indexOf('&', pos) + 10);
//             hwnd.close();
//             clearInterval(hTimer);
//             resolve({email, password});
//           }
//         }
//       }, 1000);
//
//       // hwnd.addEventListener("unload",(event)=>{
//       //   var obj={email:localStorage.getItem("email"),password:localStorage.getItem("password")};
//       // })
//   });
// }


export function getDelay(dtStart, lang= 'en', label_day= 'jours', serverNow= null) {
  if (dtStart == undefined) {return ''; }
  if (serverNow == null) {serverNow = new Date().getTime(); }
  const delay = Math.abs(dtStart - serverNow);

  if (delay > 24 * 3600 * 1000) {
    const nbJours = Math.trunc(delay / (24 * 3600 * 1000));
    return nbJours + ' ' + label_day;
  }

  if (lang == undefined) {lang = 'fr'; }
  let affichage = new Date(delay).toUTCString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
  if (affichage.indexOf('00:') == 0) {
    affichage = affichage.split(':')[1] + ':' + affichage.split(':')[2];
  } else {
    affichage = affichage.split(':')[0] + 'h' + affichage.split(':')[1];
  }

  return affichage;
}


export function normeString(s){
  if(s==null)return "";
  s=s.replace("à chez","chez");
  s=s.replace("pour sur","sur");
  s=s.replace("pour pour","pour");
  return s;
}

export function clear(elt: any, xpath: string) {
  const doc = elt.contentDocument;
  const to_keep = doc.querySelector(xpath);
  to_keep.parentElement.childNodes.forEach((n) => {
    if (n != to_keep) {n.style.display = 'none'; }
  });
}

declare var EXIF: any;

export function extractEXIF(src:string,func){
  var image = new Image();
  image.onload =  function() {
    EXIF.getData(this, function () {
      var model = EXIF.getTag(this, 'Model');
      var tags = EXIF.getAllTags(this);
      if (Object.keys(tags).length == 0) {
        tags["width"] = image.width;
        tags["height"] = image.height;
      }
      func(tags);
    });
  };
  image.src=src;
}

export function autoRotate(src: string, quality: number, func) {
  //var blob=atob(src.split("base64,")[1]);
  extractEXIF(src,(data)=> {
    if (data.exif != null) {
      var orientation = data.exif.get('Orientation');
      var angle = 0;
      switch (orientation) {
        case 8:
          angle = -90;
          break;
        case 3:
          angle = 180;
          break;
        case 6:
          angle = 90;
          break;
      }
      rotate(src, angle, quality, func);
    } else{
      var angle=0;
      // if(data.width>data.height)angle=0;
      // if(data.width==data.height)angle=90;
      rotate(src, angle, quality, func);
    }

  });

  //   }else{
  //     debugger;
  //     rotate(src, -90, quality, func);
  //   }
  //
  // });
}

// export function autoRotate(src: string, quality: number, func) {
//   var image = new Image();
//   image.onload =  () => {
//     EXIF.getData(image,  function() {
//       var orientation= EXIF.getTag(this,"Orientation");
//       var angle = 0;
//       switch (orientation) {
//         case 8:
//           angle = -90;
//           break;
//         case 3:
//           angle = 180;
//           break;
//         case 6:
//           angle = 90;
//           break;
//       }
//       rotate(src, angle, quality, func);
//     });
//   };
//   image.src = src;
// }

/**
 *
 * @param src
 * @param angle
 * @param quality
 * @param func
 */
export function rotate(src: string, angle: number, quality: number, func) {
  if (angle == 0)
    func(src);
  else {
    var img = new Image();
    img.onload = function() {
      var canvas:any = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      drawRotated(canvas, this, angle);
      var rc = canvas.toDataURL("image/jpeg", quality);
      func(rc);
    };
    img.src = src;
  }
}


function drawRotated(canvas, image, degrees) {
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(degrees * Math.PI / 180);
  ctx.drawImage(image, -image.width / 2, -image.height / 2);
  ctx.restore();
}

