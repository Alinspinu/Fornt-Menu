import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActionSheetService } from 'src/app/shared/action-sheet.service';
import { DatePickerPage } from 'src/app/shared/date-picker/date-picker.page';
import { CashService } from './cash.service';
import { formatedDateToShow, round } from 'src/app/shared/utils/functions';
import { Bill, BillProduct } from 'src/app/cart/cart.model';
import { CapitalizePipe } from 'src/app/shared/capitalize.pipe';
import { OrdersViewPage } from './orders-view/orders-view.page';
import {LogoPagePage} from '../../../shared/logo-page/logo-page.page'
import { DelProdViewPage } from './del-prod-view/del-prod-view.page';


 interface paymentMethod {
  name: string,
  value: number,
  procent: number
}

interface departament {
  total: number,
  showType: boolean,
  dep: {
    name: string,
    procent: number,
    total: number
  }[]
  procent: number,
  name: string,
  products: product[]
}

interface product {
    name: string,
    qty: number,
    dep: string,
    price: number
}


interface hour {
  hour: number,
  procent: number,
  total: number
}

interface user{
  name: string,
  procent: number,
  total: number
}


@Component({
  selector: 'app-cash',
  templateUrl: './cash.page.html',
  styleUrls: ['./cash.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, CapitalizePipe, LogoPagePage]
})
export class CashPage implements OnInit {

  constructor(
    @Inject(ActionSheetService) private actionSheet: ActionSheetService,
    private cashSrv: CashService
  ) { }

  advance: boolean = false
  startDate!: string | undefined
  endDate!: string | undefined
  today: string = this.formatDate(new Date(Date.now()).toString()).split('ora')[0]
  day!: string | undefined

  bills: Bill[] = []
  discountBills: Bill [] = []
  cashBackBills: Bill [] = []

  paymentMethods: paymentMethod[] = []
  billProducts: BillProduct[] = []
  departaments: departament [] = []
  hours: hour [] = []
  users: user [] = []

  total: number = 0;
  cashBack: number = 0
  discounts: number = 0

  totalIncasat: number = 0
  openTotal: number = 0
  cash: number = 0
  card: number = 0
  vivaWallet: number = 0
  voucher: number = 0
  payOnline: number = 0
  isLoading = true
  delProducts: any = []


  ngOnInit() {
    this.getOrders()
  }


  search(){
    this.today = ''
    this.getOrders()
    this.advance = false
  }

getOrders(){
  this.isLoading = true
  this.cashSrv.getOrders(this.startDate, this.endDate, this.day).subscribe(response => {
    if(response){
      this.resetValues()
      this.bills = response.orders
      this.delProducts = response.delProducts
      this.isLoading = false
      this.calcTotals()
    }
  })
}

 async showDeletedProducts(){
    await this.actionSheet.openModal(DelProdViewPage, this.delProducts)
}

refresh(){
  window.location.reload()
}

advSearch(){
  this.advance = true
}

resetValues(){
  this.total = 0;
  this.cashBack = 0
  this.discounts = 0
  this.cash = 0
  this.card = 0
  this.vivaWallet= 0
  this.voucher = 0
  this.payOnline = 0
  this.paymentMethods = []
  this.departaments = []
  this.billProducts = []
  this.users = []
  this.hours = []
}

roundInHtml(num: number){
  return round(num)
}


calcTotals(){
  this.cash = 0
  this.card = 0
  this.vivaWallet = 0
  this.voucher = 0
  this.payOnline = 0
  this.openTotal = 0
  this.total = 0
  this.discounts = 0
  this.cashBack = 0
  this.totalIncasat = 0
  this.discountBills = []
  this.cashBackBills = []
  this.bills.forEach(bill => {
   if(bill.production){
    bill.products.forEach(prod => {
      this.billProducts.push(prod)
    })
     this.cashBack = round( this.cashBack +  bill.cashBack)
     this.discounts = round(this.discounts + bill.discount)
     this.total += (bill.total + bill.discount)
     if(bill.status === 'done'){
       this.totalIncasat += bill.total
     }

     if(bill.payment.cash){
       this.cash =  round(this.cash + bill.payment.cash)
     }
     if(bill.payment.card){
       this.card = round(this.card + bill.payment.card)
     }
     if(bill.payment.viva){
       this.vivaWallet = round(this.vivaWallet + bill.payment.viva)
     }
     if(bill.payment.voucher) {
       this.voucher = round(this.voucher + bill.payment.voucher)
     }
     if(bill.payment.online){
       this.payOnline = round(this.payOnline + bill.payment.online)
     }
   }

   if(bill.discount > 0){
    this.discountBills.push(bill)
   }
   if(bill.cashBack > 0){
    this.cashBackBills.push(bill)
   }
   if(bill.status === "open"){
    this.openTotal += (bill.total - bill.discount)
   }
  })
  this.calcProcents()
  this.calcHours()
  this.calcUsers()
}

openBills(method: string){
if(method === 'Discount') {
  this.actionSheet.openModal(OrdersViewPage, this.discountBills)
}
if(method === 'CashBack'){
  this.actionSheet.openModal(OrdersViewPage, this.cashBackBills)
}
if(method === "Note deschise"){
  this.showOpenOrders()
}
}


showOrders(){
  let billsToSend: any = []
  this.bills.forEach(el => {
    if(el.production){
      billsToSend.push(el)
    }
  })
  this.actionSheet.openModal(OrdersViewPage, billsToSend)
}

showOpenOrders(){
  let billsToShow: any [] = []
  this.bills.forEach(el => {
    if(el.status === 'open'){
      billsToShow.push(el)
    }
  })
  this.actionSheet.openModal(OrdersViewPage, billsToShow)
}


calcHours(){
  this.bills.forEach(bill => {
    if(bill.production) {
      const hours = new Date(bill.createdAt).getHours()
      const exsitingHour = this.hours.find(p => (p.hour === hours))
      if(exsitingHour){
        exsitingHour.total = exsitingHour.total + bill.total
        exsitingHour.procent = round(exsitingHour.total * 100 / this.total)
      } else {
        const hour: hour = {
          hour: hours,
          procent: round(bill.total * 100 / this.total),
          total: bill.total
        }
        this.hours.push(hour)
      }
    }
  })
  this.hours.sort((a,b) => (a.hour - b.hour))
}

calcUsers(){
  this.bills.forEach(bill => {
    if(bill.production){
      const existingUser = this.users.find(p => (p.name === bill.employee.fullName))
      if(existingUser){
        existingUser.total = existingUser.total + bill.total
        existingUser.procent = round(existingUser.total * 100 / this.total)
      } else {
        const user: user = {
          name: bill.employee.fullName,
          total: bill.total,
          procent: round(bill.total * 100 / this.total)
        }
        this.users.push(user)
      }
    }
  })
  this.users.sort((a,b) => b.procent - a.procent)
}




calcProcents(){
  if(this.total > 0 && this.cash > 0){
    const cashMethod: paymentMethod = {
      name: 'Numerar',
      value: this.cash,
      procent: round(this.cash * 100 / this.total)
    }
    this.paymentMethods.push(cashMethod)
  }
  if(this.total > 0 && this.card > 0){
    const cardMethod: paymentMethod = {
      name: 'Card',
      value: this.card,
      procent: round(this.card * 100 / this.total)
    }
    this.paymentMethods.push(cardMethod)
  }
  if(this.total > 0 && this.vivaWallet > 0){
    const vivaMethod: paymentMethod = {
      name: 'Viva Wallet',
      value: this.vivaWallet,
      procent: round(this.vivaWallet * 100 / this.total)
    }
    this.paymentMethods.push(vivaMethod)
  }
  if(this.total > 0 && this.voucher > 0){
    const voucherMethod: paymentMethod = {
      name: 'Voucher',
      value: this.voucher,
      procent: round(this.voucher * 100 / this.total)
    }
    this.paymentMethods.push(voucherMethod)
  }
  if(this.total > 0 && this.cashBack > 0){
    const casBackMethod: paymentMethod = {
      name: 'CashBack',
      value: this.cashBack,
      procent: round(this.cashBack * 100 / this.total)
    }
    this.paymentMethods.push(casBackMethod)
  }
  if(this.total > 0 && this.payOnline > 0){
    const payOnlineMethod: paymentMethod = {
      name: 'Online',
      value: this.payOnline,
      procent: round(this.payOnline * 100 / this.total)
    }
    this.paymentMethods.push(payOnlineMethod)
  }
  if(this.total > 0 && this.discounts > 0){
    const discountMethod: paymentMethod = {
      name: 'Discount',
      value: this.discounts,
      procent: round(this.discounts * 100 / this.total)
    }
    this.paymentMethods.push(discountMethod)
  }
  if(this.total > 0 && this.openTotal > 0){
    const openTableMethod: paymentMethod = {
      name: "Note deschise",
      value: this.openTotal,
      procent: round(this.openTotal * 100 / this.total)
    }
    this.paymentMethods.push(openTableMethod)
  }
   this.paymentMethods.sort((a,b) => b.procent - a.procent)
   this.createDeps()
}





createDeps(){
  this.billProducts.forEach(prod => {
    const price = round(prod.price * prod.quantity)
    if(!prod.mainCat){
      prod.mainCat = 'Nedefinit'
    }
    const existingDep = this.departaments.find(p =>(p.name === prod.mainCat))
    if(existingDep) {
      const existingProduct = existingDep.products.find(p => (p.name === prod.name));
      if(existingProduct) {
        existingProduct.qty = existingProduct.qty + prod.quantity
        existingDep.total += prod.price * prod.quantity
        existingDep.procent = round(existingDep.total * 100 / this.total)
        const existingType = existingDep.dep.find(p => (p.name === prod.dep))
        if(existingType) {
          existingType.total = existingType.total + round(prod.price * prod.quantity)
          existingType.procent = 0
        } else {
          existingDep.dep.push(
            {
              name: prod.dep,
              total: price,
              procent: 0
            }
             )
        }
      } else {
        const product: product = {
          name: prod.name,
          dep: prod.dep,
          qty: prod.quantity,
          price: prod.price
        }
        existingDep.total += round(product.price * product.qty)
        existingDep.procent = round(existingDep.total * 100 / this.total)
        existingDep.products.push(product)
        const existingType = existingDep.dep.find(p => (p.name === prod.dep))
        if(existingType) {
          existingType.total = existingType.total + round(prod.price * prod.quantity)
          existingType.procent = 0
        } else {
          existingDep.dep.push(
            {
              name: prod.dep,
              total: price,
              procent: 0
            }
            )
        }
      }
    } else {
      const dep: departament = {
        total: price,
        showType: false,
        procent: round(price * 100 / this.total),
        dep: [
          {
            name: prod.dep,
            total: price,
            procent: round(price * 100 / price)
          }
        ],
        name: prod.mainCat,
        products: [
          {
            name: prod.name,
            dep: prod.dep,
            qty: prod.quantity,
            price: prod.price
          }
        ]
      }
      this.departaments.push(dep)
    }
  })

  this.departaments.sort((a,b) => b.procent - a.procent)
  this.calcTypeProcents(this.departaments)
}


calcTypeProcents(deps: departament[]){
  deps.forEach(dep => {
  dep.products.sort((a,b) => b.qty - a.qty)
   dep.dep.forEach(el => {
    el.procent = round(el.total *100 / dep.total)
   })
  })
}

showData(dep: departament){
  dep.showType = !dep.showType
}


 async selectDate(mode: string){
  if(mode === "start"){
    const startDate = await this.actionSheet.openAuth(DatePickerPage)
    if(startDate){
      this.startDate = startDate
    }
  }
  if(mode === "end"){
    const endDate = await this.actionSheet.openAuth(DatePickerPage)
    if(endDate){
      this.endDate = endDate
      this.day = undefined
      if(this.startDate){
        this.advance = false
        this.today = ''
        this.getOrders()
      }
    }
  }
  if(mode === 'day'){
    const day = await this.actionSheet.openAuth(DatePickerPage)
    if(day){
      console.log(day)
      this.day = day
      this.endDate = undefined
      this.startDate = undefined
      this.getOrders()
    }
  }
  }

  formatDate(date: string | undefined){
    return formatedDateToShow(date).split(' ora')[0]
  }

}
