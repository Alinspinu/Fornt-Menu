import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, NavParams, ToastController } from '@ionic/angular';
import User from '../../auth/user.model';
import { AuthService } from '../../auth/auth.service';
import { Subscription } from 'rxjs';
import { Category, Product, SubProduct } from '../../CRUD/add/category.model';
import { TabsService } from '../../tabs/tabs.service';
import { ActionSheetService } from '../../shared/action-sheet.service';
import { ParringProductPage } from '../../CRUD/add/parring-product/parring-product.page';
import { HttpClient } from '@angular/common/http';
import { showToast, triggerEscapeKeyPress } from '../../shared/utils/toast-controller';
import { CartService } from '../../cart/cart.service';
import { ActivatedRoute, Router } from '@angular/router';

interface Response {
  message: string,
  updatedProduct: Product
}

@Component({
  selector: 'app-product-content',
  templateUrl: './product-content.page.html',
  styleUrls: ['./product-content.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ParringProductPage]
})
export class ProductContentPage implements OnInit, OnDestroy {

  baseUrl: string = 'http://localhost:8080/api-true/';
  newUrl: string = 'https://flow-api-394209.lm.r.appspot.com/api-true/';

  user!: User;
  isLoggedIn: boolean = false;
  backTab: string = '';
  isAdmin: boolean = false;
  userSub!: Subscription;
  paramSubs!: Subscription;
  product!: Product;
  productId: string = '';
  imagePath: string = '';
  productIndex!: number;
  tabSubs!: Subscription;
  category!: Category[];
  pickOption: string = '';
  description: string[] = []

  constructor(
    private authSrv: AuthService,
    private tabsServ: TabsService,
    @Inject(ActionSheetService) private actionSheet: ActionSheetService,
    private alertController: AlertController,
    private http: HttpClient,
    private tabSrv: TabsService,
    private toastCtrl: ToastController,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    ) { }

  ngOnInit() {
    this.setProductIdandIndex();
    this.getUser();
    this.fetchCategory()
    this.splitDescription()
    this.setImageCroppingSettings();
    this.getBackTab();
    this.setPickOption(this.product.category.name)
  }

  splitDescription(){
    if(this.product.longDescription){
      this.description = this.product.longDescription.split('#s#')
    }
  }

  ngOnDestroy(): void {
    this.tabSubs.unsubscribe();
    this.paramSubs.unsubscribe();
  }

  setProductIdandIndex(){
    this.paramSubs = this.route.params.subscribe(params => {
      this.productId = params['id'];
      this.productIndex = params['index'];
    });
  }



  fetchCategory(){
    this.tabSubs = this.tabsServ.categorySend$.subscribe(res => {
      this.category = res
      for(let i = 0; i < res.length; i++ ){
        if(res[i].product[this.productIndex] && (res[i].product[this.productIndex]._id === this.productId)){
          return this.product = res[i].product[this.productIndex]
        } else {
          continue
        }
    }
    return
    })
  }

  setPickOption(name: string){
    switch(name){
      case "BLACK COFFEE" || "WITH MILK":
        this.pickOption = "Cafeaua";
        break;
      default: this.pickOption = "o Opțiune";
    }
  }

  goToCoffee(subName: string){
    switch(subName){
      case "True Blend":
        this.router.navigate(['tabs/product-content/64e1089a7b76ae5db7fec5d7/0']);
        break;
      case "Columbia Monteblanco":
        this.router.navigate(['tabs/product-content/64e1170581decdf638c719a1/3']);
        break;
      case "Papua Noua Guinee":
        this.router.navigate(['tabs/product-content/64e110f681decdf638c71989/1']) ;
        break;
      case "Columbia Decaf":
        this.router.navigate(['tabs/product-content/650495786f57ad612744c3a3/4']);
        break;
      case "Etiopia Gargary":
        this.router.navigate(['tabs/product-content/64e119cb81decdf638c719a6/5'])
    }
  }

  navigateParProduct(productId: string, catId: string){
    const catIndex = this.category.findIndex(obj=> obj._id === catId);
    const prodIndex = this.category[catIndex].product.findIndex(obj=> obj._id === productId);
    this.router.navigate(['tabs/product-content/'+ productId + '/' + prodIndex])
  }


  getUser(){
    this.userSub = this.authSrv.user$.subscribe((res: any ) => {
      if(res){
        res.subscribe((userData: any) => {
            this.user = userData;
            this.isLoggedIn = this.user.status === 'active' ? true : false;
            this.isAdmin = this.user.admin === 1 ? true : false;
        });
      };
    });
    };


    saveProdToCart(product: Product, index: number){
      const cartProduct = {
        name: product.name,
        price: product.price,
        quantity: 1,
        _id: product._id,
        total: product.price,
        imgPath: product.image.path,
        category: product.category._id,
        sub: false,
      };
      if(index !== -1){
        this.product.paring[index].quantity++
      }
      this.cartService.saveCartProduct(cartProduct);
      this.tabSrv.addProd(product.category._id, product.name);
    }

    saveSubProdToCart(subProd: SubProduct, product: Product, index: number){
      const name = product.name + '-' + subProd.name;
      const cartProduct = {
        name: name,
        price: subProd.price,
        quantity: 1,
        _id: subProd._id,
        total: subProd.price,
        imgPath: product.image.path,
        category: product.category._id,
        sub: true,
      };
      this.cartService.saveCartProduct(cartProduct);
      this.tabSrv.addSub(subProd.name, product.name, product.category._id);
    }


    getBackTab(){
      if(this.product.category._id.length)
      this.backTab = this.product.category._id
    }

    setImageCroppingSettings(): string {
      const url = this.product.image.path
      const segments = url.split('/');
      const uploadIndex = segments.indexOf('upload');
      if (uploadIndex === -1) {
        return this.imagePath = url;
      };
      const transformation = `c_crop,w_555,h_888,x_0,y_55`;
      segments.splice(uploadIndex + 1, 0, transformation);
      return this.imagePath = segments.join('/');
    };

    addProduct(id: string){
      console.log('click')
      this.actionSheet.openEdit(ParringProductPage, id, 0, 0 )
    };

  onDelete(productToBeRemovedId: string){
    const data = {
      productToBeRemovedId,
      productToRemoveFromId: this.productId
    }
    return this.http.post<Response>(`${this.newUrl}remove-paring-product`, data).subscribe(response => {
      const catIndex = this.tabSrv.getCatIndex(this.productId)
      this.tabSrv.onProductEdit(response.updatedProduct, catIndex)
      showToast(this.toastCtrl, response.message, 3000)
      triggerEscapeKeyPress()
    })

  }

async presentAlert(name: string, productToBeRemovedId: string) {
  const alert = await this.alertController.create({
    header: 'Șterge',
    message: `Ești sigur că vrei să ștergi ${name}?`,
    buttons: [
      {
        text: 'Renunță',
        role: 'cancel'
      },
      {
        text: 'Șterge',
        role: 'confirm',
        handler: () => {
          this.onDelete(productToBeRemovedId);
        },
      },
    ]
  });
  await alert.present();
}

    // onDelete(){
    //   this.http.delete<{message: string}>(`${this.newUrl}product?id=${this.productId}`).subscribe(res => {
    //     this.tabSrv.prodDelete(this.categoryIndex, this.prodIndex);
    //     triggerEscapeKeyPress();
    //     showToast(this.toastCtrl, res.message, 3000);
    //   }, error => {
    //     console.log(error);
    //     showToast(this.toastCtrl, error.error.message, 3000);
    //     triggerEscapeKeyPress();
    //   });
    // };

      // getProductIndex() {
  //   const currentTab = window.location.href;
  //   const indexTab = currentTab.lastIndexOf('/');
  //   const tab = currentTab.slice(indexTab +1);
  //   return this.productIndex = parseFloat(tab);
  // };

  // getProductId() {
  //   const url = window.location.href;
  //   const segments = url.split('/');
  //   return this.productId = segments[segments.length - 2];
  // }

}