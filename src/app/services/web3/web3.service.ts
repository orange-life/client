import { Injectable } from '@angular/core';
import Web3 from 'web3';
import { Account as Web3Account } from 'web3-core';
import { Contract } from 'web3-eth-contract';
import { AuthService } from '../auth/auth.service';
import contractAbi from '../../../assets/contractAbi.json';
import { environment } from 'src/environments/environment';
import { RelayProvider } from '@opengsn/provider';

@Injectable({
  providedIn: 'root',
})
export class Web3Service {
  public initPromise: Promise<void>;

  private web3: Web3;
  private account: Web3Account;
  private contract: Contract;

  constructor(private auth: AuthService) {
    this.initPromise = this.init();
  }

  async init() {
    this.web3 = new Web3(environment.INFURA_URL);

    const configuration = {
      relayHubAddress: '0x6646cD15d33cE3a6933e36de38990121e8ba2806',
      // OrangePayMaster
      paymasterAddress: '0x2dA3AB663a01dBd1dDB53F16B0BB925C815B1361',
      // their accept-all paymaster
      // paymasterAddress: '0xcA94aBEdcC18A10521aB7273B3F3D5ED28Cf7B8A',
      // forwarderAddress: '0x4d4581c01A457925410cd3877d17b2fd4553b2C5',
      ourContract: '0xAd7879348C00AD6E5c88E418b7E66A0D386Ee733',
      loggerConfiguration: {
        logLevel: 'debug' as any
      },
      // preferredRelays: ['0x1d89e298a3aB270F4E0644D6dA46C6E001b34e3A'],
      relayRegistrationLookupBlocks: 60000,
      sliceSize: 1
    };

    const provider = await RelayProvider.newProvider({
      provider: this.web3.currentProvider as any,
      config: configuration
    }).init();
    // const provider = new RelayProvider(
    //   this.web3.currentProvider as any,
    //   configuration
    // );
    this.web3 = new Web3(provider);

    const data = await this.auth.getCredentials();
    const pk = data.pk;
    this.account = this.web3.eth.accounts.privateKeyToAccount(pk);
    provider.addAccount(this.account.privateKey);
    console.log(this.account);

    this.contract = new this.web3.eth.Contract(
      contractAbi as any,
      '0xAd7879348C00AD6E5c88E418b7E66A0D386Ee733',
      { from: this.account.address }
    );
  }

  async getRecords() {
    await this.initPromise;

    const res = await this.contract.methods
      .getMedicalRecords(this.account.address)
      .call();
    console.log(res);
  }

  async addRecord(
    cid: string,
    verifyKey: string,
    pubKey: string,
    nonce: number
  ) {
    await this.initPromise;

    console.log('adding record', cid, verifyKey, pubKey, nonce, this.account.address);

    const res = this.contract.methods
      .addMedicalRecord(cid, verifyKey, pubKey, nonce)
      .send({ from: this.account.address,  gas: 2000000 });

    res
      .once('sending', function (payload) {
        console.log('Sending', payload);
      })
      .once('sent', function (payload) {
        console.log('Sent', payload);
      })
      .once('transactionHash', function (hash) {
        console.log('transactionHash', hash);
      })
      .once('receipt', function (receipt) {
        console.log('Receipt', receipt);
      })
      .on('confirmation', function (confNumber, receipt, latestBlockHash) {
        console.log('confirmed');
      })
      .on('error', function (error) {
        console.log('error', error);
      })
      .then(function (receipt) {
        // will be fired once the receipt is mined
      });
  }
}
