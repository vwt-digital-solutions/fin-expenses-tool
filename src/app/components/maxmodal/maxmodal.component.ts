import {Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterContentChecked} from '@angular/core';
import {Expense} from '../../models/expense';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';
import {Attachment} from '../../models/attachment';
import {ExpensesConfigService} from '../../services/config.service';
import {IdentityService} from '../../services/identity.service';
import {DefaultImageService} from '../../services/default-image.service';
import { Observable, forkJoin } from 'rxjs';
import { Endpoint } from 'src/app/models/endpoint.enum';
import { HttpClient } from '@angular/common/http';
import { EnvService } from 'src/app/services/env.service';
import { formatDate } from '@angular/common';
import { NgForm } from '@angular/forms';
import { KeysPipe } from 'src/app/pipes/keys.pipe';

@Component({
  selector: 'app-maxmodal',
  templateUrl: './maxmodal.component.html',
  styleUrls: ['./maxmodal.component.scss'],
  providers: [KeysPipe]
})
export class MaxModalComponent implements OnInit, AfterContentChecked {
  @ViewChild('expenseForm', { static: true }) expenseForm: NgForm;

  @Input() expenseData: Expense;
  @Input() forceViewer: boolean;
  @Input() moveDirection: string;
  @Output() messageEvent = new EventEmitter<boolean[]>();

  public rejectionNotes: any;
  public typeOptions: any;
  public receiptFiles: Attachment[];
  public errorMessage: string;
  private readonly today: Date;
  private action: string;
  private OurJaneDoeRoles: any;
  public rejectionNoteVisible = false;
  public isCreditor: boolean;
  public isManager: boolean;
  public isViewer: boolean;
  public isEditor: boolean;
  public isRejecting: boolean;
  public wantsDraft = 0;
  public wantsSubmit = 0;
  public rejectionNote: boolean;
  public formCostTypeMessage = { short: '', long: '' };
  public expenseFlags = [];
  public transdateNotFilledMessage: string;
  public expenseTransDate = true;
  public expenseCostType = '';
  private formLoaded = false;

  constructor(
    private httpClient: HttpClient,
    private env: EnvService,
    private expensesConfigService: ExpensesConfigService,
    private identityService: IdentityService,
    private defaultImageService: DefaultImageService,
    private route: ActivatedRoute
  ) {
    this.route.data.subscribe(data => {
      this.typeOptions = data['costTypes'];
      this.rejectionNotes = data['rejectionNotes'];
    });

    if (window.location.pathname === '/home' || window.location.pathname === '/') {
      this.isEditor = true;
    } else if (window.location.pathname === '/expenses/manage') {
      this.isManager = true;
    } else if (window.location.pathname === '/expenses/process') {
      this.isCreditor = true;
    } else {
      this.isViewer = true;
    }

    this.transdateNotFilledMessage = 'Graag een geldige datum invullen';

    window.onmousedown = event => {
      if (event.target === document.getElementById('maxModal')) {
        this.closeModal(false, false);
      }
    };

    window.onkeydown = event => {
      if (event.key === 'Escape') {
        this.closeModal(false, false);
      }
    };

    this.today = new Date();
  }

  /** OnInit to get the expenses. Can be slow! Every role has it's own getAttachment. */
  ngOnInit(): void {
    this.OurJaneDoeRoles = this.identityService.allRoles();
    document.getElementById('modalClose').focus();
    // forceViewer can be called from parent to allow the EMPLOYEE (landing page) to only see the expense
    if (this.forceViewer || this.expenseData.status.text === 'approved') {
      this.isViewer = true;
      this.isEditor = false;
      this.isManager = false;
      this.isCreditor = false;
    }

    this.expenseFlags = this.processExpenseFlags();

    // Checks what role the user has and makes a specific request
    let receiptRequest = new Observable();
    if (window.location.pathname === '/home' || window.location.pathname === '/') {
      receiptRequest = this.expensesConfigService.getExpenseAttachment(this.expenseData.id);
    } else if (window.location.pathname === '/expenses/manage') {
      receiptRequest = this.expensesConfigService.getManagerAttachment(this.expenseData.id);
    } else if (window.location.pathname === '/expenses/process') {
      receiptRequest = this.expensesConfigService.getFinanceAttachment(this.expenseData.id);
    } else {
      receiptRequest = this.expensesConfigService.getControllerAttachment(this.expenseData.id);
    }

    receiptRequest.subscribe((image: any) => {
      this.receiptFiles = [];
      for (const img of image) {
        /*eslint-disable */
        this.receiptFiles.push({
          content: `${img.content}`,
          content_type: img.content_type,
          from_db: true,
          db_name: img.name,
          expense_id: this.expenseData.id
        });
        /*eslint-enable */
      }
    });
  }

  ngAfterContentChecked(): void {
    if (!this.formLoaded &&
      'cost_type' in this.expenseForm.control.controls &&
      'rnote' in this.expenseForm.control.controls &&
      'rnote_id' in this.expenseForm.control.controls) {
      if ((this.isEditor || this.isCreditor)) {
        let isFound = false;
        for (const type in this.typeOptions) {
          if (type === this.expenseData.cost_type.split(':').pop() && this.typeOptions[type].active) {
            this.expenseForm.form.patchValue({cost_type: this.typeOptions[type].cid}); // eslint-disable-line
            isFound = true;
          }
        }
        if (!isFound) {
          this.expenseForm.form.patchValue({cost_type: ''}); // eslint-disable-line
          this.expenseForm.form.controls['cost_type'].setErrors({incorrect: true});
          this.expenseForm.form.controls['cost_type'].markAsTouched();
        }
      }

      if ((this.isCreditor || this.isManager) && ('rnote' in this.expenseData.status || 'rnote_id' in this.expenseData.status)) {
        this.expenseForm.form.patchValue({rnote: ''});
        this.expenseForm.form.patchValue({rnote_id: ''}); // eslint-disable-line
      }

      this.formLoaded = true;
    }
  }

  /** Controls the submit buttons and UpdateForm: Checks every input needed. */
  protected submitButtonController(
    toSubmit = true,
    nNote: { invalid: any },
    nAmount: { invalid: any; viewModel: number },
    nType: { invalid: any },
    nTransDate: { invalid: any; viewModel: string | number | Date },
    rNoteId: { value: string },
    rNote: { value: string }
  ) {
    // Checks what role the user has and verifies the inputs accordingly.
    if (this.isEditor) {
      return nNote.invalid || nAmount.invalid || nType.invalid
        || nTransDate.invalid || (new Date(nTransDate.viewModel)
          > this.today) || nAmount.viewModel < 0.01 || (toSubmit && !this.identityService.isTesting() ? this.attachmentsIsInvalid : false);
    } else if (this.isManager || this.isCreditor) {
      if (this.isRejecting && (!rNoteId.value || this.checkRNoteRequired(Number(rNoteId.value)) && !rNote.value)) {
        return true;
      }
      return nType ? nType.invalid : false;
    }
    return true;
  }

  // BEGIN Subject to change
  /** Used to update the expense in form. Every role that can update has it's own part */
  claimUpdateForm(form: any, expenseId: any, instArray: any[]): void {
    if (!this.submitButtonController(
      (this.wantsDraft > 0 ? false : true),
      instArray[0],
      instArray[1],
      instArray[2],
      instArray[3],
      instArray[4],
      instArray[5]
    )) {
      const dataVerified = {};
      const data = form.value;

      // Checks what role the user has and updates the expense accordingly.
      if (this.isEditor) {
        this.claimForEditor(dataVerified, expenseId, data);
      } else if (this.isManager) {
        this.claimForManager(dataVerified, expenseId, data);
      } else if (this.isCreditor) {
        this.claimForCreditor(dataVerified, expenseId, data);
      }
    }
  }

  claimForEditor(dataVerified, expenseId, data) {
    data.amount = Number((data.amount).toFixed(2));
    data.transaction_date = new Date(data.transaction_date).toISOString(); // eslint-disable-line
    for (const prop in data) {
      if (prop.length !== 0 && prop !== 'rnote' && prop !== 'rnote_id') {
        dataVerified[prop] = data[prop];
      }
    }

    dataVerified[`status`] = this.expenseData.status.text === 'draft' ||
      this.expenseData.status.text.includes('rejected') ?
        this.expenseData.status.text :
        'ready_for_manager';

    Object.keys(dataVerified).length !== 0 ?
    this.expensesConfigService.updateExpenseEmployee(dataVerified, expenseId)
    .subscribe(
      result => this.afterPostExpense(result),
      error => {
        console.log(error);
        this.errorMessage = 'detail' in error.error ? error.error['detail'].nl : error.error;
      })
      : (this.errorMessage = 'Declaratie niet aangepast. Probeer het later nog eens.');
  }

  claimForManager(dataVerified, expenseId, data) {
    if (this.action === 'rejecting') {
      dataVerified[`rnote_id`] = Number(data.rnote_id);

      if (this.checkRNoteRequired(Number(data.rnote_id))) {
        dataVerified[`rnote`] = data.rnote;
      }
    }

    dataVerified[`status`] = this.action === 'approving' ? `ready_for_creditor` :
      this.action === 'rejecting' ? `rejected_by_manager` : null;

    Object.keys(dataVerified).length !== 0 ?
      this.expensesConfigService.updateExpenseManager(dataVerified, expenseId)
        .subscribe(
          result => this.closeModal(true),
          error => {
            console.log(error);
            this.errorMessage = 'detail' in error.error ? error.error['detail'].nl : error.error;
          })
      : (this.errorMessage = 'Declaratie niet aangepast. Probeer het later nog eens.');
  }

  claimForCreditor(dataVerified, expenseId, data) {
    dataVerified[`cost_type`] = data.cost_type;

    if (this.action === 'rejecting') {
      dataVerified[`rnote_id`] = Number(data.rnote_id);

      if (this.checkRNoteRequired(Number(data.rnote_id))) {
        dataVerified[`rnote`] = data.rnote;
      }
    }

    dataVerified[`status`] = this.action === 'approving' ? `approved` :
      this.action === 'rejecting' ? `rejected_by_creditor` : null;
    Object.keys(dataVerified).length !== 0 ?
      this.expensesConfigService.updateExpenseFinance(dataVerified, expenseId)
        .subscribe(
          result => this.closeModal(true),
          error => {
            console.log(error);
            this.errorMessage = 'detail' in error.error ? error.error['detail'].nl : error.error;
          })
      : (this.errorMessage = 'Declaratie niet aangepast. Probeer het later nog eens.');
  }

  bulkAttachmentUpload(expenseID: number) {
    const fileRequests = [];
    for (const count in this.receiptFiles) {
      if (!this.receiptFiles[count].from_db) {
        fileRequests.push(
          this.expensesConfigService.uploadSingleAttachment(expenseID, {
            name: count.toString(),
            content: this.receiptFiles[count].content
          })
        );
      }
    }

    return forkJoin(fileRequests);
  }

  afterPostExpense(expense: object) {
    if (this.receiptFiles.length > 0 && !this.receiptFiles.some(e => e.from_db)) {
      this.bulkAttachmentUpload(expense['id']).subscribe(
        responseList => {
          console.log('>> POST ATTACHMENTS SUCCESS', responseList);
          this.afterPostAttachments(expense);
        }, error => {
          this.errorMessage = 'Er is iets fout gegaan bij het uploaden van de bestanden, neem contact op met de crediteuren afdeling.';
          console.error('>> POST ATTACHMENTS FAILED', error.message);
        });
    } else {
      this.afterPostAttachments(expense);
    }
  }

  afterPostAttachments(expense: object) {
    const isDuplicateAccepted = (
      this.wantsSubmit > 0 && expense['flags'] && expense['flags']['duplicates']) ?
      confirm('Deze declaratie lijkt eerder ingediend te zijn, weet u zeker dat u deze wilt indienen?') :
      true;

    if (
      (this.expenseData.status.text === 'draft' || this.expenseData.status.text.includes('rejected')) &&
      this.wantsSubmit > 0 &&
      isDuplicateAccepted
    ) {
      this.expensesConfigService.updateExpenseEmployee(
        { status: 'ready_for_manager' }, expense['id']
      ).subscribe(
        response => this.closeModal(true),
        error => {
          this.errorMessage = 'Er is iets fout gegaan bij het indienen van de declaratie, neem contact op met de crediteuren afdeling.';
          console.error('>> PUT EXPENSE FAILED', error.message);
        }
      );
    } else {
      this.closeModal(true);
    }
  }
  // END Subject to change

  /** Used to update the rejection note with normal style change (works better on mobile) */
  rejectionHit(event: any) {
    this.rejectionNote = false;
    if ('rnote' in this.expenseForm.form.controls) {
      this.expenseForm.form.patchValue({rnote: ''});
      this.expenseForm.form.controls['rnote'].markAsUntouched();
      this.expenseForm.form.controls['rnote'].markAsPristine();
    }

    for (const rejection of this.rejectionNotes) {
      if (rejection['rnote_id'] === Number(event.target.value) && rejection['form'] === 'dynamic') {
        this.rejectionNote = true;
      }
    }

    if (this.rejectionNote) {
      this.rejectionNoteVisible = true;
    } else {
      this.rejectionNoteVisible = false;
    }
  }

  /** Only for the employee to cancel the expense */
  protected cancelExpense() {
    if (confirm('Weet je zeker dat je de declaratie wilt annuleren?')) {
      const dataVerified = {};
      const expenseId = this.expenseData.id;
      dataVerified[`status`] = 'cancelled';
      this.expensesConfigService.updateExpenseEmployee(dataVerified, expenseId)
      .subscribe(
        result => {
          this.closeModal(true);
        },
        error => {
          this.errorMessage = 'detail' in error.error ? error.error['detail'].nl : error.error;
        });
    }
  }

  /** Used to close the modal (Could also control the animation) */
  closeModal(reload, next = true): void {
    if (reload && !this.isViewer && !this.isEditor) {
      document.getElementById('max-modal').className = 'move-right';
    } else {
      document.getElementById('max-modal').className = 'move-bottom';
    }
    setTimeout(() => {
      this.messageEvent.emit([reload, next]);
    }, 300);
  }

  /** Used to update the review action */
  protected updatingAction(event) {
    this.wantsDraft = 0;
    this.action = event;

    if (event === 'rejecting') {
      this.isRejecting = true;
    } else {
      this.isRejecting = false;
      this.rejectionNote = false;
    }
  }

  // BEGIN Subject to change
  /** Used to remove the attachments from the receiptFiles and delete it. */
  protected removeFromAttachmentList(item): void {
    if (this.identityService.isTesting()) {
      this.receiptFiles.push({
        content: this.defaultImageService.getDefaultImageForTest(),
        content_type: 'image/png', // eslint-disable-line
        from_db: false // eslint-disable-line
      });
      this.receiptFiles.push({
        content: this.defaultImageService.getDefaultImageForTest(),
        content_type: 'image/png', // eslint-disable-line
        from_db: false // eslint-disable-line
      });
    }

    for (let i = 0; i < this.receiptFiles.length; i++) {
      if (this.receiptFiles[i] === item) {
        if (item.from_db) {
          this.expensesConfigService.deleteAttachment(item)
            .subscribe(() => {
              this.receiptFiles.splice(i, 1);
            });
        } else {
          this.receiptFiles.splice(i, 1);
        }
      }
    }
  }

  // END Subject to change

  checkRNoteVisibility(expense) {
    const rNoteStatuses = ['cancelled', 'rejected_by_manager', 'rejected_by_creditor'];
    if (
      expense.status.rnote &&
      (this.isViewer || this.isEditor) &&
      rNoteStatuses.includes(expense.status.text)
    ) {
      return true;
    }
    return false;
  }

  checkRNoteRequired(rNoteId: number) {
    for (const rejection of this.rejectionNotes) {
      if (rejection['rnote_id'] === rNoteId && rejection['form'] === 'dynamic') {
        return true;
      }
    }
    return false;
  }

  // Messy functions from here on. Will be moved or changed in other stories.
  private getNavigator() {
    return navigator.userAgent.match(/Android/i)
      || navigator.userAgent.match(/webOS/i)
      || navigator.userAgent.match(/iPhone/i)
      || navigator.userAgent.match(/iPad/i)
      || navigator.userAgent.match(/iPod/i)
      || navigator.userAgent.match(/BlackBerry/i)
      || navigator.userAgent.match(/Windows Phone/i);
  }

  protected openSanitizeFile(type: string, file: string) {
    const isIEOrEdge = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
    if (isIEOrEdge) {
      if (type === 'application/pdf') {
        alert('Please use Chrome or Firefox to view this file');
      } else {
        const win = window.open();
        // @ts-ignore
        // tslint:disable-next-line:max-line-length
        win.document.write('<img src="' + this.sanitizer.bypassSecurityTrustUrl('data:' + type + ';base64,' + encodeURI(file)).changingThisBreaksApplicationSecurity + '" alt="">');
      }
    } else {
      const win = window.open();
      if (this.getNavigator()) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Edge Mobile of Samsung Internet.</p>');
      } else if (!isChrome) {
        win.document.write('<p>Problemen bij het weergeven van het bestand? Gebruik Chrome of Firefox.</p>');
      }
      const dataContent = 'data:' + type + ';base64,' + encodeURI(file);
      // tslint:disable-next-line:max-line-length no-unused-expression
      win.document.write('<iframe src="' + dataContent + '" frameborder="0" style="border:0; top:auto; left:0; bottom:0; right:0; width:100%; height:100%;" allowfullscreen></iframe>');
    }
  }

  // File Input, structured to limit file size and check if input would work.
  onFileInput(file) {
    if (file[0].type.split('/')[0] !== 'image' && file[0].type !== 'application/pdf') {
      alert('Graag alleen een pdf of afbeelding toevoegen');
      return;
    }
    const isIEOrEdge = /msie\s|trident\/|edge\//i.test(window.navigator.userAgent);
    if (isIEOrEdge) {
      alert('Please use Chrome or Firefox to use this ');
    } else {
      if (!(file[0] === undefined || file[0] === null)) {
        const reader = new FileReader();
        reader.readAsDataURL(file[0]);
        reader.onload = () => {
          if (file[0].type === 'application/pdf') {
            /*eslint-disable */
            this.receiptFiles.push({
              content: reader.result,
              content_type: 'application/pdf',
              from_db: false,
              db_name: file[0].name
            });
            /*eslint-enable */
          } else if (file[0].type.split('/')[0] === 'image') {
            const img = new Image();
            if (typeof reader.result === 'string') {
              img.src = reader.result;
              img.onload = () => {
                const canvas = document.createElement('canvas');
                let width: number;
                if (img.width > 600) {
                  width = 600;
                } else {
                  width = img.width;
                }
                const scaleFactor = width / img.width;
                canvas.width = width;
                canvas.height = img.height * scaleFactor;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, img.height * scaleFactor);
                ctx.canvas.toBlob(blob => {
                  const filla = new File([blob], file[0].name, {
                    type: file[0].type,
                    lastModified: this.today.getTime()
                  });
                  reader.readAsDataURL(filla);
                  reader.onload = () => {
                    /*eslint-disable */
                    this.receiptFiles.push({
                      content: reader.result,
                      content_type: file[0].type,
                      from_db: false,
                      db_name: file[0].name
                    });
                    /*eslint-enable */
                  };
                }, file[0].type, 1);
              }, reader.onerror = Error => console.error(Error);
            }
          }
        };
      }
    }
  }

  onChangeType(event: Event) {
    for (const type in this.typeOptions) {
      if (type in this.typeOptions) {
        if (event.target['value'].includes(this.typeOptions[type].cid)) {
          if (this.typeOptions[type].managertype === 'leasecoordinator') {
            this.formCostTypeMessage = this.typeOptions[type].message['nl'];
          } else {
            this.formCostTypeMessage = { short: '', long: '' };
          }
        }
      }
    }
  }
  onChangeDate(event: Event) {
    if (!isNaN(Date.parse(event.target['value']))) {
      const newTime = new Date(event.target['value']).setHours(0, 0, 0, 0);
      const curTime = new Date().setHours(0, 0, 0, 0);

      if (newTime <= curTime && newTime > 0) {
        this.expenseTransDate = true;
        return;
      } else if (newTime > curTime) {
        this.transdateNotFilledMessage = 'Declaraties kunnen alleen gedaan worden na de aankoop';
      }
    }

    this.expenseForm.controls[event.target['name']].setErrors({incorrect: true});
    this.expenseTransDate = false;
  }

  getFileTypeIcon(contentType: string) {
    return contentType.includes('image') ? 'far fa-file-image' : 'far fa-file-pdf';
  }

  processExpenseFlags() {
    const flags = [];
    if (this.expenseData['flags'] && Object.keys(this.expenseData['flags']).length > 0) {
      for (const key in this.expenseData['flags']) {
        if (key === 'duplicates') {
          flags.push({
            name: 'duplicates',
            description: 'Er zijn dubbele declaraties gevonden',
            values: this.expenseData['flags'][key]
          });
        }
      }
    }
    return flags;
  }

  toggleExpensePopover(popover, expenseId: number) {
    if (popover.isOpen()) {
      popover.close();
    } else {
      let requestEndpoint = Endpoint.employee;
      if (this.isCreditor || (this.isViewer && this.OurJaneDoeRoles.includes('creditor'))) {
        requestEndpoint = Endpoint.finance;
      } else if (this.isManager) {
        requestEndpoint = Endpoint.manager;
      } else if (this.isViewer || (this.isViewer && this.OurJaneDoeRoles.includes('controller'))) {
        requestEndpoint = Endpoint.controller;
      }

      this.httpClient.get(
        this.env.apiUrl + requestEndpoint + `/${expenseId}`
      ).subscribe(
        response => popover.open({context: response}),
        error => popover.open({context: error})
      );
    }
  }

  get isRejected() {
    return this.expenseData.status.text.includes('rejected') ? true : false;
  }

  get attachmentsIsInvalid() {
    return this.receiptFiles && this.receiptFiles.length > 0 ? false : true;
  }

  get hasDraftStatus() {
    return this.expenseData.status.text === 'draft' ? true : false;
  }
}
