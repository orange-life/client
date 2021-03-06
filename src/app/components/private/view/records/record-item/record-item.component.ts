import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UmbralService } from 'src/app/services/umbral/umbral.service';
import { Web3Service } from 'src/app/services/web3/web3.service';

@Component({
  selector: 'app-record-item',
  templateUrl: './record-item.component.html',
  styleUrls: ['./record-item.component.css'],
})
export class RecordItemComponent implements OnInit {
  @Input() name: string;
  @Input() access: number;
  @Input() id: string;
  @Input() pk: string;
  @Input() vk: string;
  @Input() docName: string;
  @Input() docMimeType: string;
  @Input() nonce: number;
  @Input() idx: number;
  @Input() status: boolean;
  @Input() owner: string;
  shortName: string;
  fileAccess: boolean;
  fileExtensions = ['.png', '.jpg', '.pdf'];
  color: string;
  colorArray = [
    'bg-pink-600',
    'bg-purple-600',
    'bg-yellow-500',
    'bg-green-500',
  ];
  fileType: string;

  constructor(
    private router: Router,
    private web3: Web3Service,
    private umbral: UmbralService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.fileType = 'assets/fileIcons/' + this.name.split('.').pop() + '.svg';
    this.name = this.cleanName(this.name);
    this.shortName = this.name.slice(0, 2).toUpperCase();
    const index = this.getRandomInt(0, 4);
    this.color = this.colorArray[index];
  }

  cleanName(string: string): string {
    string = this.capitalizeFirstLetter(string);
    string = string.replace(new RegExp(this.fileExtensions.join('|')), '');
    return string;
  }

  capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
  }

  openRecord() {
    console.log(this.status);
    if (this.status == false) {
      console.log('nooo');
    } else {
      this.router.navigateByUrl(
        'record/' +
          this.id +
          '/' +
          this.pk +
          '/' +
          this.vk +
          '/' +
          this.nonce +
          '/' +
          this.idx +
          '/' +
          this.docName +
          '/' +
          this.docMimeType
      );
    }
  }

  async requestAccess() {
    console.log('aaa request');
    const data = await this.auth.getCredentials();
    const address = data.address.toLowerCase();
    const publicKey = await this.umbral.getPublicKeyHex();
    await this.web3.requestAccess(this.owner, this.idx);
    await this.umbral.requestAccess(address, publicKey);
    console.log('oof request');
  }
}
