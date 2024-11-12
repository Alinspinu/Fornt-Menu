import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, NavParams } from '@ionic/angular';
import {triggerEscapeKeyPress} from '../../shared/utils/toast-controller'


@Component({
  selector: 'app-pick-option',
  templateUrl: './pick-option.page.html',
  styleUrls: ['./pick-option.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PickOptionPage implements OnInit {

  options!: any[]
  selectedOption!: any;
  selectedO: string[] = []
  sub!: any

  toppingLabel: string[] = []


  constructor(
  private navPar: NavParams,
  private modalCtrl: ModalController
  ) { }

  ngOnInit() {
    this.getOptions()
  }

    addTopping(index: number){
     const option = this.options[index]
     option.counter ? option.counter = option.counter + 1 : option.counter = 2
     this.selectedO.push(option)
    }

    redTopping(index: number){
    const option = this.options[index]
    option.counter -= 1
    const indexO = this.selectedO.indexOf(option);
    this.selectedO.splice(indexO, 1)
    }

  getOptions(){
    this.options = this.navPar.get('options');
    this.sub = this.navPar.get('sub')
  }

  onCheckboxChange(option: any, ind: number) {
    const index = this.selectedO.indexOf(option);
    const opt = this.options[ind]
    if (index === -1) {
      opt.checked = true
      this.selectedO.push(option);
    } else {
      opt.checked = false
      this.selectedO.splice(index, 1);
    }
  }

  pick(){
    if(this.selectedOption){
      this.modalCtrl.dismiss(this.selectedOption)
    } else if(this.selectedO.length){
      // console.log(this.selectedO)
      this.modalCtrl.dismiss(this.selectedO)
    } else {
      triggerEscapeKeyPress()
    }
  }

back(){
  triggerEscapeKeyPress()
}


}
