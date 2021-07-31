import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../auth/auth.service';
import { ProxyReEncryptionKey } from './classes/ProxyReEncryptionKey';
import { EncryptedData } from './classes/EncryptedData';
import { environment } from 'src/environments/environment';
import { fromHexString, toHexString } from './utils';
import { ReceivedDataHex } from './classes/ReceivedData';

class GrantParams {
  constructor(
    public delegating_pk: string,
    public receiving_pk: string,
    public verifying_key: string,
    public capsule: string,
    public kfrag: string
  ) {}
}

class CfragParams {
  constructor(
    public delegating_pk: string,
    public receiving_pk: string,
    public verifying_key: string
  ) {}
}

@Injectable({
  providedIn: 'root',
})
export class UmbralService {
  umbral: typeof import('umbral-pre');

  // umbral ursulas
  // TODO: make this environment var
  // TODO: ensure 3 ursulas
  private ursulaDomains = environment.URSULA_DOMAINS.split(',');
  private key: ProxyReEncryptionKey;

  constructor(private auth: AuthService, private http: HttpClient) {}

  private async initUmbralIfNotAlready() {
    if (!this.umbral) {
      this.umbral = await import('umbral-pre');

      const creds = await this.auth.getCredentials();
      const chaincode: Uint8Array = creds.chainCode;
      this.key = new ProxyReEncryptionKey(this.umbral, creds.pk, chaincode);
    }
  }

  // use for uploading file first time
  async uploadFile(file: File) {
    await this.initUmbralIfNotAlready();

    return await this.grantAccessFromFile(
      file,
      toHexString(this.key.publicKey.toBytes())
    );
  }

  // grant access
  async grantAccessFromFile(file: File, pubKey: string) {
    await this.initUmbralIfNotAlready();

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const encryptedData = this.key.encryptBytes(
      fileBytes,
      this.umbral.PublicKey.fromBytes(fromHexString(pubKey))
    );

    await this.sendData(encryptedData);
    const buffer = encryptedData.ciphertext.buffer;
    const encryptedFile = new File([buffer as BlobPart], file.name);
    return encryptedFile;
  }

  private async sendData(data: EncryptedData) {
    const hexData = data.toHex();

    if (hexData.kfrags.length > this.ursulaDomains.length) {
      console.log(
        `Not enough ursulas for ${hexData.kfrags.length} fragments. Have ${this.ursulaDomains.length} ursulas.`
      );
      return;
    }

    const promises = [];
    for (let i = 0; i < hexData.kfrags.length; ++i) {
      const kfrag = hexData.kfrags[i];
      const bodyParams = new GrantParams(
        hexData.delegatingPubKey,
        hexData.receivingPubKey,
        hexData.verifyKey,
        hexData.capsule,
        kfrag
      );

      const res = this.http
        .post<GrantParams>(`${this.ursulaDomains[i]}/v1/grant`, bodyParams)
        .toPromise();
      promises.push(res);
    }

    const resps = await Promise.all(promises);
    resps.forEach((resp) => {
      console.log('Response from ursula', resp);
    });
  }

  public async decrypt(
    senderPubKey: string,
    verifyKey: string,
    data: Uint8Array
  ) {
    await this.initUmbralIfNotAlready();

    const promises = [];

    for (let i = 0; i < this.ursulaDomains.length; ++i) {
      const ursula = this.ursulaDomains[i];

      const bodyParams = new CfragParams(senderPubKey, this.key.getPubKeyHex(), verifyKey);

      const res = this.http
        .post<CfragParams>(`${ursula}/v1/cfrags`, bodyParams)
        .toPromise();
      promises.push(res);
    }

    const resps = await Promise.all(promises);
    let capsule: string;
    const cfrags: string[] = [];
    resps.forEach((resp) => {
      capsule = resp.capsule;
      cfrags.push(resp.cfrag);
    });
    const recvData = new ReceivedDataHex(this.key.getSecKeyHex(), senderPubKey, verifyKey, data, capsule, cfrags);
    const actualRecvData = recvData.getActual(this.umbral);

    return this.key.decrypt(actualRecvData);
  }
}