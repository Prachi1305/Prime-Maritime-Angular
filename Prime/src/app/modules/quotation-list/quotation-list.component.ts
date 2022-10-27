import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { QUOTATION } from 'src/app/models/quotation';
import { QuotationService } from 'src/app/services/quotation.service';

@Component({
  selector: 'app-quotation-list',
  templateUrl: './quotation-list.component.html',
  styleUrls: ['./quotation-list.component.scss'],
})
export class QuotationListComponent implements OnInit {
  quotation = new QUOTATION();
  quotationList: any[] = [];
  isScroll: boolean = false;
  quotationDetails: any;
  slotDetailsForm: FormGroup;

  @ViewChild('openBtn') openBtn: ElementRef;
  @ViewChild('closeBtn') closeBtn: ElementRef;

  constructor(
    private _quotationService: QuotationService,
    private _router: Router,
    private _formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    this.getSRRList();

    this.slotDetailsForm = this._formBuilder.group({
      BOOKING_NO: [''],
      SRR_ID: [''],
      SRR_NO: [''],
      VESSEL_NAME: [''],
      VOYAGE_NO: [''],
      MOTHER_VESSEL_NAME: [''],
      MOTHER_VOYAGE_NO: [''],
      AGENT_CODE: [''],
      AGENT_NAME: [''],
      STATUS: [''],
      CREATED_BY: [''],
      SLOT_LIST: new FormArray([]),
    });
  }

  getSRRList() {
    this.quotation.AGENT_CODE = localStorage.getItem('usercode');
    this.quotation.OPERATION = 'GET_SRRLIST';
    this._quotationService.getSRRList(this.quotation).subscribe(
      (res: any) => {
        this.quotationList = [];
        this.isScroll = false;
        if (res.hasOwnProperty('Data')) {
          if (res.Data?.length > 0) {
            this.quotationList = res.Data;

            if (this.quotationList?.length >= 4) {
              this.isScroll = true;
            } else {
              this.isScroll = false;
            }
          }
        }
      },
      (error: any) => {
        if (error.status == 401) {
          alert('You are not authorized to access this page, please login');
          this._router.navigateByUrl('login');
        }
      }
    );
  }

  getQuotationDetails(SRR_NO: any) {
    debugger;
    localStorage.setItem('SRR_NO', SRR_NO);
    this._router.navigateByUrl('home/quotation-details');
  }

  slotAllocation() {
    var slotDetails = this.slotDetailsForm.get('SLOT_LIST') as FormArray;

    slotDetails.push(
      this._formBuilder.group({
        SLOT_OPERATOR: [''],
        NO_OF_SLOTS: [''],
      })
    );
  }

  openBookingModal(i: any) {
    this.quotationDetails = new QUOTATION();
    this.quotationDetails.POL = this.quotationList[i].POL;
    this.quotationDetails.POD = this.quotationList[i].POD;
    this.quotationDetails.SRR_ID = this.quotationList[i].SRR_ID;
    this.quotationDetails.SRR_NO = this.quotationList[i].SRR_NO;
    this.quotationDetails.NO_OF_CONTAINERS =
      this.quotationList[i].NO_OF_CONTAINERS;

    this.slotDetailsForm.reset();
    var slotDetails = this.slotDetailsForm.get('SLOT_LIST') as FormArray;

    slotDetails.clear();

    slotDetails.push(
      this._formBuilder.group({
        SLOT_OPERATOR: [''],
        NO_OF_SLOTS: [''],
      })
    );

    this.openBtn.nativeElement.click();
  }

  bookNow() {
    this.slotDetailsForm.get('BOOKING_NO')?.setValue(this.getRandomNumber());
    this.slotDetailsForm.get('SRR_ID')?.setValue(this.quotationDetails?.SRR_ID);
    this.slotDetailsForm.get('SRR_NO')?.setValue(this.quotationDetails?.SRR_NO);
    this.slotDetailsForm.get('STATUS')?.setValue('Booked');
    this.slotDetailsForm
      .get('CREATED_BY')
      ?.setValue(localStorage.getItem('username'));
    this.slotDetailsForm
      .get('AGENT_NAME')
      ?.setValue(localStorage.getItem('username'));
    this.slotDetailsForm
      .get('AGENT_CODE')
      ?.setValue(localStorage.getItem('usercode'));

    console.log(JSON.stringify(this.slotDetailsForm.value));

    this.closeBtn.nativeElement.click();

    this._quotationService
      .booking(JSON.stringify(this.slotDetailsForm.value))
      .subscribe((res: any) => {
        if (res.responseCode == 200) {
          alert('Your booking is placed successfully !');
          this._router.navigateByUrl('/home/bookings');
        }
      });
  }

  get f() {
    var x = this.slotDetailsForm.get('SLOT_LIST') as FormArray;
    return x.controls;
  }

  f1(i: any) {
    return i;
  }

  getRandomNumber() {
    var num = Math.floor(Math.random() * 1e16).toString();
    return 'BK' + num;
  }
}
