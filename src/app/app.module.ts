import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HttpClientModule } from '@angular/common/http';

import { PublicNavbarComponent } from './components/navbar/public-navbar/public-navbar.component';
import { PrivateNavbarComponent } from './components/navbar/private-navbar/private-navbar.component';
import { WelcomeComponent } from './components/auth/welcome/welcome.component';
import { AuthPwMnFormComponent } from './components/auth/auth-pw-mn-form/auth-pw-mn-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UploadComponent } from './components/dashboard/upload/upload.component';

import { NgxIndexedDBModule, DBConfig } from 'ngx-indexed-db';

const dbConfig: DBConfig = {
  name: 'MyDb',
  version: 1,
  objectStoresMeta: [
    {
      store: 'auth',
      storeConfig: { keyPath: 'id', autoIncrement: false },
      storeSchema: [
        {
          name: 'privateKey',
          keypath: 'privateKey',
          options: { unique: true },
        },
        { name: 'chainCode', keypath: 'chainCode', options: { unique: true } },
      ],
    },
  ],
};

@NgModule({
  declarations: [
    AppComponent,
    PublicNavbarComponent,
    PrivateNavbarComponent,
    WelcomeComponent,
    AuthPwMnFormComponent,
    UploadComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgxIndexedDBModule.forRoot(dbConfig),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
