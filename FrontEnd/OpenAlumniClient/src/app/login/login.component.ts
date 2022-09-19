import { SocialAuthService } from 'angularx-social-login';
import { FacebookLoginProvider, GoogleLoginProvider } from 'angularx-social-login';
import {$$, showError, showMessage} from '../tools';
import {ApiService} from '../api.service';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {ConfigService} from '../config.service';
import {Location} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {PromptComponent} from '../prompt/prompt.component';



@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass']
})
export class LoginComponent implements OnInit {

  constructor(public api: ApiService,
              public router: Router,
              public dialog: MatDialog,
              public toast: MatSnackBar,
              public _location: Location,
              public config: ConfigService,
              public route: ActivatedRoute,
              private socialAuthService: SocialAuthService) {
  }

  message = 'Pour vous authentifier utilisez Google ou directement votre Email';
  wait_message = '';
  redirect = null;
  code = '';
  email="";
  showAuthentPlatform = true;

  shareObj = {
    href: 'FACEBOOK-SHARE-LINK',
    hashtag: '#FACEBOOK-SHARE-HASGTAG'
  };
  handle: any = null;
  messageCode = '';


  n_try = 0;



  ngOnInit() {
    $$('Ouverture de la fenêtre de login');
    // if (!localStorage.getItem('lastEmail') || localStorage.getItem('lastEmail')=="null") {
    //   localStorage.setItem('lastEmail',"paul.dudule@gmail.com");
    // }

    let email=localStorage.getItem("email");
    $$("Chargement de la configuration si l'email est dans les cookies");
    this.config.init_user(() => {
      $$("L'utilisateur est déjà loggé");
      this.quit();
    }, () => {
      const params: ParamMap = this.route.snapshot.queryParamMap;
      this.redirect = params.get('redirect');
      if (params.has('message')) { this.message = params.get('message'); }
      if (params.has('address') || params.has('email')) {
        let addr = params.get('address');
        if (!addr) {addr = params.get('email'); }
        $$('Récupération de l\'adresse ' + addr);
        localStorage.setItem('lastEmail', addr);
        this.email_login();
      }
      if(params.has("login") && params.has("password")){
        debugger
        this.email=params.get("login");
        this.updateCode(params.get("password"));
      }
    },email);
  }



  //Cette fonction permet de rediriger automatiquement l'utilisateur après une authentification
  next() {
    $$('Traitement de la rediction vers ' + this.redirect);
    clearTimeout(this.handle);
    if (this.redirect == null) {
      this.router.navigate(['search']);
    }
    else {

      if (this.redirect == 'back' || this.config.user.user.email.length == 0) {
        this._location.back();
      }
      else{
        this.redirect = this.redirect.replace('{{email}}', this.config.user.user.email);
        $$('!Redirection vers ' + this.redirect);
        if (this.redirect.startsWith('http')){
          open(this.redirect, '_blank');
        }
        else{
          if (this.redirect.indexOf('?') > -1) {
            this.router.navigateByUrl(this.redirect);
          }
          else {
            this.router.navigate([this.redirect]);
          }
        }
      }
    }
  }



  quit() {
    $$("On quitte la fenêtre");
    this.router.navigate(['search'], {replaceUrl: true});
  }




  email_login() {
    $$('Ouverture du login par email');
    this.dialog.open(PromptComponent, {
      backdropClass: 'removeBackground',
      width: 'fit-content', data: {
        title: 'Authentification par email',
        result: localStorage.getItem("lastEmail"),
        question: 'Renseigner votre adresse mail',
        lbl_ok: 'OK',
        lbl_cancel: 'Annuler'
      }
    }).afterClosed().subscribe((email: any) => {
      if (email != 'no') {
        localStorage.setItem('lastEmail', email);
        this.email=email;
        $$('Recherche d\'un compte déjà existant a l\'email=' + email);
        this.wait_message = 'Recherche du compte';
        this.api.getextrauser(email).subscribe((result: any) => {
          this.wait_message = '';
          if (result.count > 0) {
            this.messageCode = 'Veuillez indiquer votre code à 6 chiffres reçu par mail';
          } else {
            this.wait_message = 'Nouveau compte, création en cours';
            this.api.register({email, username: email}).subscribe((res: any) => {
              this.api._get("set_perm")
              this.wait_message = '';
              if (res != null) {
                this.messageCode = 'Afin de vérifier que vous êtes bien le propriétaire de ' + email + ', veuillez indiquer le code à 6 chiffres que vous avez reçu';
              }
            }, (err) => {
              showError(this, err);
              this.wait_message = '';
            });
          }
        }, (err: any) => {
          showError(this, err);
          this.wait_message = '';
        });
      } else {
        this.wait_message = '';
        showMessage(this, 'Vous restez anonyme');
        this._location.back();
      }
    });

    // var message="Un lien de connexion à votre nouveau profil vous a été envoyer sur votre boite. Utilisez le pour vous reconnecter";
    // if(res.status!=200)message="Problème technique. Essayer une autre méthode d'authentification";
    // this.message=message;
    // setTimeout(()=>{
    //   this.dialogRef.close({"message":message});
    // },5000);
    //     })
    //   }
    // });

    //   var firstname=this.email.split("@")[0];
    // this.api.adduser(this.email,firstname).subscribe((res:any)=>{
    //   localStorage.setItem("code",res.code);
    //   res.message="Un lien est disponible dans votre boite "+this.email+" pour votre première connexion";
    //
    // },(error)=>{showError(this,error);});
  }

  signOut(){
    this.socialAuthService.signOut();
  }

  resend_code(){
    this.api.resend(localStorage.getItem("lastEmail")).subscribe(() => {
      showMessage(this, 'Votre code d\'accès a été renvoyé, consultez votre mail');
    });
  }



  updateCode(code: any){
    if (typeof(code) == 'object') {code = code.target.value; }
    $$('Vérification du code: '+code);
    this.wait_message = 'Vérification du code';
    this.api.checkCode(this.email, code).subscribe((r: any) => {
      this.wait_message = '';
      if (r != null) {
        showMessage(this, 'Connexion à votre compte');
        this.api.token = r.token;
        localStorage.setItem('token', r.token);
        localStorage.setItem("email",this.email);
        this.messageCode = '';
        this.config.init_user(() => {this.quit();}, () => {},this.email);
      } else {

        $$('Problème technique');
        this.config.raz_user();
        this.messageCode = '';
        this.quit();
      }
    }, (err) => {
      $$('Problème technique');
      this.config.raz_user();
      this.wait_message = '';
      this.code = '';
      window.location.reload();
      //showMessage(this, 'Code incorrect, veuillez recommencer la procédure');
    });
  }




  initUser(data: any, askForCode= false){
    $$('Recherche d\'un compte ayant ce mail', data);
    this.wait_message = 'Récupération de l\'utilisateur';
    this.api.existuser(data.email).subscribe((result: any) => {
        this.email=data.email;
        if (result.results.length > 0) {
          $$("Le compte existe bien");
          this.updateCode(data.provider_id);
        } else {
          $$('Il n\'y a pas de compte à cet email');
          this.api.register({
            email: data.email,
            username: '___' + data.provider_id,
            first_name: data.first_name,
            last_name: data.last_name,
          }).subscribe((res: any) => {
            this.updateCode(data.provider_id);
            this.messageCode = 'Veuillez saisir le code qui vous a été envoyé sur votre adresse mail';
            this.wait_message = '';
          }, (err) => {
            showMessage(this, 'Problème d\'authentification. Faites une authentification par mail');
            this.wait_message = '';
          });
        }
      }
    );
  }


  public socialSignIn(socialPlatform: string) {
    let servicePlatform = GoogleLoginProvider.PROVIDER_ID;
    if (socialPlatform == 'facebook') {servicePlatform = FacebookLoginProvider.PROVIDER_ID; }

    $$('Appel de la plateforme d\'authentification ' + socialPlatform);
    this.wait_message = 'Récupération de votre adresse mail via ' + socialPlatform;
    this.socialAuthService.signIn(servicePlatform).then((socialUser) => {
        this.wait_message = '';
        this.message = '';
        localStorage.setItem("email",socialUser.email);
        $$("Resultat de l'authentification ", socialUser);
        this.initUser({
          email: socialUser.email,
          first_name: socialUser.firstName,
          last_name: socialUser.lastName,
          url: socialUser.id,
          photo: socialUser.photoUrl,
          provider: socialUser.provider,
          provider_id: socialUser.id,
        }, false);
      },
      (err) => {
        this.n_try = this.n_try + 1;
        $$('!Echec de connexion ' + this.n_try + 'eme essai');
        if (this.n_try < 2) {
          setTimeout(() => {this.socialSignIn(socialPlatform); }, 500);
        } else {
          this.wait_message = '';
          showMessage(this,"Pas d'authentification");
          this._location.back();
        }
      }
    );
  }
}
