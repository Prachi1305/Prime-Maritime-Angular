import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Bl } from 'src/app/models/bl';
import { DO } from 'src/app/models/do';
import { BlService } from 'src/app/services/bl.service';
import { CommonService } from 'src/app/services/common.service';
import { DoService } from 'src/app/services/do.service';
import { MasterService } from 'src/app/services/master.service';

@Component({
  selector: 'app-new-do',
  templateUrl: './new-do.component.html',
  styleUrls: ['./new-do.component.scss'],
})
export class NewDoComponent implements OnInit {
  bL = new Bl();
  doForm: FormGroup;
  cpForm: FormGroup;
  deliverOrder = new DO();
  activeTab: string = 'Container';
  billNo: string = '';
  displayBill: string = '';
  previewDetails: boolean = false;
  previewNoData: boolean = false;
  previewForm: boolean = false;
  submitted: boolean = false;
  submitted1: boolean = false;
  dataVisible: boolean = false;
  containerList: any[] = [];
  mstDepoList: any[] = [];
  mstIcdList: any[] = [];
  locationList: any[] = [];
  clearingPartyList: any[] = [];
  @ViewChild('openBtn') openBtn: ElementRef;
  @ViewChild('closeBtn') closeBtn: ElementRef;

  constructor(
    private _formBuilder: FormBuilder,
    private _dOService: DoService,
    private _blService: BlService,
    private _mstService: MasterService,
    private _router: Router,
    private _commonService: CommonService
  ) {}

  ngOnInit(): void {
    this.doForm = this._formBuilder.group({
      BL_ID: [0],
      BL_NO: [''],
      DO_NO: [''],
      ARRIVAL_DATE: ['', Validators.required],
      DO_VALIDITY: ['', Validators.required],
      IGM_NO: ['', Validators.required],
      IGM_ITEM_NO: ['', Validators.required],
      IGM_DATE: ['', Validators.required],
      CLEARING_PARTY: ['', Validators.required],
      ACCEPTANCE_LOCATION: ['', Validators.required],
      LETTER_VALIDITY: ['', Validators.required],
      SHIPPING_TERMS: ['', Validators.required],
      AGENT_CODE: [''],
      AGENT_NAME: [''],
      CREATED_BY: [''],
      CONTAINER_LIST: new FormArray([]),
      CONTAINER_LIST2: new FormArray([]),
    });
    this.cpForm = this._formBuilder.group({
      ID: [0],
      NAME: ['', Validators.required],
      EMAIL_ID: ['', Validators.required],
      CONTACT: [''],
      ADDRESS: [''],
      LOCATION: ['', Validators.required],
      AGENT_CODE: [''],
      CREATED_BY: [''],
    });

    this.getIcdList();
    this.getDepoList();
    this.getClearingParty();
  }

  get fcp() {
    return this.cpForm.controls;
  }

  getClearingParty() {
    this._mstService.getCP().subscribe((res: any) => {
      if (res.ResponseCode == 200) {
        this.clearingPartyList = res.Data;
      }
    });
  }
  getIcdList() {
    this._mstService.getMstICD().subscribe((res: any) => {
      if (res.ResponseCode == 200) {
        this.mstIcdList = res.Data;
        this.locationList = this.mstIcdList;
      }
    });
  }

  getDepoList() {
    this._mstService.getMstDEPO().subscribe((res: any) => {
      if (res.ResponseCode == 200) {
        this.mstDepoList = res.Data;
        this.locationList = this.locationList.concat(this.mstDepoList);
      }
    });
  }

  show() {
    this.previewForm = !this.previewForm;
    this.dataVisible = !this.dataVisible;
  }

  onTabClick(tab: any) {
    this.activeTab = tab;
  }

  get f() {
    return this.doForm.controls;
  }

  get f2() {
    var c = this.doForm.get('CONTAINER_LIST') as FormArray;
    return c.controls;
  }

  getf1(i: any) {
    return i;
  }

  getDO() {
    if (this.billNo == '') {
      this.previewNoData = true;
    } else {
      // this.getIcdList();
      // this.getDepoList();
      this.getDOAPI();
    }
  }
  getDOAPI() {
    debugger;
    const contList = this.doForm.get('CONTAINER_LIST') as FormArray;
    contList.clear();
    this.containerList = [];
    this.displayBill = '';
    this.previewForm = false;
    this.dataVisible = false;
    this.previewDetails = false;
    this.previewNoData = false;

    this.bL.AGENT_CODE = this._commonService.getUserCode();
    this.bL.BL_NO = this.billNo;
    this.bL.fromDO = true;

    this._blService.getContainerList(this.bL).subscribe((res: any) => {
      debugger;
      if (res.ResponseCode == 200) {
        this.containerList = res.Data;
        //this.previewDetails=true;
        if (this.containerList?.length > 0) {
          const add = this.doForm.get('CONTAINER_LIST') as FormArray;

          this.containerList.forEach((element) => {
            add.push(
              this._formBuilder.group({
                BOOKING_NO: [element.BOOKING_NO],
                CRO_NO: [element.CRO_NO],
                BL_NO: [element.BL_NO],
                CONTAINER_NO: [element.CONTAINER_NO],
                CONTAINER_TYPE: [element.CONTAINER_TYPE],
                CONTAINER_SIZE: [element.CONTAINER_SIZE],
                SEAL_NO: [element.SEAL_NO],
                MARKS_NOS: [element.MARKS_NOS],
                DESC_OF_GOODS: [element.DESC_OF_GOODS],
                GROSS_WEIGHT: [element.GROSS_WEIGHT],
                MEASUREMENT: [element.MEASUREMENT],
                AGENT_CODE: [element.AGENT_CODE],
                AGENT_NAME: [element.AGENT_NAME],
                CREATED_BY: [element.CREATED_BY],
              })
            );
          });
          this.displayBill = this.containerList[0].BL_NO;
          this.previewDetails = true;
        }
        if (this.containerList?.length == 0) {
          this._commonService.errorMsg(
            'DO is already created for all containers for this BL No'
          );
          //this.previewNoData = true;
        }
      }
    });
  }

  saveDO() {
    this.submitted = true;
    debugger;
    if (this.doForm.invalid) {
      return;
    }

    this.doForm.get('DO_NO')?.setValue(this.getRandomNumber('DO'));
    this.doForm.get('BL_ID')?.setValue(0);
    this.doForm.get('BL_NO')?.setValue(this.displayBill);
    this.doForm.get('AGENT_NAME')?.setValue(this._commonService.getUserName());
    this.doForm.get('AGENT_CODE')?.setValue(this._commonService.getUserCode());
    this.doForm.get('CREATED_BY')?.setValue(this._commonService.getUserName());

    if (this.doForm.get('CONTAINER_LIST2')?.value == '') {
      alert(
        "Please select atleast one container to create it's delivery order"
      );
    } else {
      console.log(JSON.stringify(this.doForm.value));
      this._dOService
        .postDODetails(JSON.stringify(this.doForm.value))
        .subscribe((res: any) => {
          if (res.responseCode == 200) {
            this._commonService.successMsg(
              'Your DO has been created successfully !'
            );
            this._router.navigateByUrl('/home/operations/do-list');
          }
        });
    }
  }
  getRandomNumber(arg0: string): any {
    var num = Math.floor(Math.random() * 1e16).toString();
    return arg0 + num;
  }
  cancelDO() {
    this.doForm.get('DO_NO')?.setValue('');
    this.doForm.get('DO_DATE')?.setValue('');
    this.doForm.get('ARRIVAL_DATE')?.setValue('');
    this.doForm.get('DO_VALIDITY')?.setValue('');
    this.doForm.get('IGM_NO')?.setValue('');
    this.doForm.get('IGM_ITEM_NO')?.setValue('');
    this.doForm.get('IGM_DATE')?.setValue('');
    this.doForm.get('CLEARING_PARTY')?.setValue('');
    this.doForm.get('ACCEPTANCE_LOCATION')?.setValue('');
    this.doForm.get('LETTER_VALIDITY')?.setValue('');
    this.doForm.get('SHIPPING_TERMS')?.setValue('');
  }

  postSelectedContainerList(item: any) {
    const add = this.doForm.get('CONTAINER_LIST2') as FormArray;
    add.push(item);
  }

  saveCP() {
    this.submitted1 = true;
    if (this.cpForm.invalid) {
      return;
    }
    this.cpForm.get('AGENT_CODE')?.setValue(this._commonService.getUserCode());
    this.cpForm.get('CREATED_BY')?.setValue(this._commonService.getUserName());

    this._mstService
      .postCP(JSON.stringify(this.cpForm.value))
      .subscribe((res: any) => {
        if (res.responseCode == 200) {
          alert(
            'Clearity Party has been saved successfully ! Proceed to Select'
          );
          this.getClearingParty();
          this.closeBtn.nativeElement.click();
          //this.cancelCP();
        }
      });
  }

  cancelCP() {
    this.cpForm.get('NAME')?.setValue('');
    this.cpForm.get('EMAIL_ID')?.setValue('');
    this.cpForm.get('ADDRESS')?.setValue('');
    this.cpForm.get('LOCATION')?.setValue('');
    this.cpForm.get('CONTACT')?.setValue('');
  }
}
