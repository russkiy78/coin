/**
 * Created by russkiy on 08.12.15.
 */
"use strict";


// ================================================================
// getBytes Convert a string to bytes.
// ================================================================
String.prototype.getBytes = function () {
    var bytes = [];
    for (var i = 0; i < this.length; i++) {
        var charCode = this.charCodeAt(i);
        var cLen = Math.ceil(Math.log(charCode) / Math.log(256));
        for (var j = 0; j < cLen; j++) {
            bytes.push((charCode << (j * 8)) & 0xFF);
        }
    }
    return bytes;
};

// ================================================================
// Cryptovault init func
// ================================================================
function Cryptovault() {
    this.salt=this.decode64('hM9VjDEGTM1oDNiCRWbefbf6FyEtw1kvI4AyqfJONmYd88InicBbOcGKPGR86rMrKbFh/e4/hfrkI9Z7E1Cr5TmBaxTQVaHnyrTLRYp124OMVH8lHDsuwTnzOTFdpdSapL0WLWL22xL9KvwOWwgUbnfey4DQSxQk0SVWxGV8M4c=');
    this.numIterations = 512;
 }

// ================================================================
// bytesToHex convert binary string to hex
// return:
// ================================================================
Cryptovault.prototype.bytesToHex = function ( text ) {
    return forge.util.bytesToHex (text);
};

// ================================================================
// encode64 convert hex to binary string
// return:
// ================================================================
Cryptovault.prototype.hexToBytes = function ( text ) {
    return forge.util.hexToBytes (text);
};

// ================================================================
// encode64 convert binary string to base64
// return:
// ================================================================
Cryptovault.prototype.encode64 = function ( text ) {
    return forge.util.encode64 (text);
};

// ================================================================
// decode64  base64 to binary string
// return:
// ================================================================
Cryptovault.prototype.decode64 = function ( text ) {
    return forge.util.decode64 (text);
};

// ================================================================
// RSA Createkeypair
// return: oblect {privateKey: as PEM ,  publicKey:  as PEM }
// ================================================================
Cryptovault.prototype.RSAcreatekeypair = function ( ) {
    var pki = forge.pki;
    var key = pki.rsa.generateKeyPair({bits: 2048, e: 0x10001});
    return { privateKey: pki.privateKeyToPem(key.privateKey) ,  publicKey: pki.publicKeyToPem(key.publicKey) }
};


// ================================================================
//RSA Encryption
// enter:
// return: encrypted string
// ================================================================
Cryptovault.prototype.RSAencrypt = function (pem, text ) {
    var pki = forge.pki;
    var publicKey = pki.publicKeyFromPem(pem);
    return publicKey.encrypt(text);

};

// ================================================================
// RSA Decryption
// enter:
// return: decrypted string
// ================================================================
Cryptovault.prototype.RSAdecypt = function (pem, text ) {

    var pki = forge.pki;
    var privateKey = pki.privateKeyFromPem(pem);
    return privateKey.decrypt(text);
};

// ================================================================
// Create SHA256 hash
// enter: text (string)
// return: hash  binary string
// ================================================================
Cryptovault.prototype.SHA256 = function (text) {
    var md = forge.md.sha256.create();
    md.update(text);
    return md.digest().data;
};

// ================================================================
// Create SHA512 hash
// enter: text (string)
// return: hash  binary string
// ================================================================
Cryptovault.prototype.SHA512 = function (text) {
    var md = forge.md.sha512.create();
    md.update(text);
    return md.digest().data;
};

// ================================================================
// Create PBKDF2 (  Password-Based Key Derivation Function)
// enter:  password, salt, numIterations, len
// return:  string
// ================================================================
Cryptovault.prototype.pbkdf2 = function (password, salt, numIterations, len) {
    return forge.pkcs5.pbkdf2(password, salt || this.salt, numIterations || this.numIterations, len || 32);
};

// ================================================================
// AES-CBC Decryption
// enter: password (string), objencrypted object {'iv': iv vector  binary string 'encrypted': encrypted  data  binary string}
// return: decrypted string
// ================================================================
Cryptovault.prototype.AESdecrypt = function (password, objencrypted) {
    var key = this.pbkdf2(password);
    var iv = forge.util.createBuffer();
    var data = forge.util.createBuffer();

    iv.putBytes(objencrypted.iv);
    data.putBytes(objencrypted.encrypted);

    var decipher = forge.cipher.createDecipher('AES-CBC', key);
    decipher.start({iv: iv});
    decipher.update(data);
    decipher.finish();
    return decipher.output;
};

// ================================================================
// AES-CBC Encryption
// enter: password (string), data (string)
// return: object {'iv': iv vector binary string, 'encrypted': encrypted  data  binary string }
// ================================================================
Cryptovault.prototype.AESencrypt = function (password, data) {
    var key = this.pbkdf2(password);
    var iv = forge.random.getBytesSync(32);
    var cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({iv: iv});
    cipher.update(forge.util.createBuffer(data));
    cipher.finish();
    var encrypted = cipher.output;
    return {'iv': iv, 'encrypted': encrypted.data};
};

Cryptovault.prototype.CreateHash = function (len ) {
    len = len || 32;
    return forge.util.bytesToHex(forge.random.getBytesSync(len));
}

/*
// tests
var crypt= new Cryptovault();
var password = '987654321';
var key = crypt.make_password_bytes(password);

console.log(key);

var pem=crypt.RSAcreatekeypair();
var enc=crypt.RSAencrypt(pem.publicKey ,'1231231231');
console.log(crypt.RSAdecypt(pem.privateKey,enc));
 var data = {'id': 123, 'text': 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit, ...'};
var password = 'top secret!';
var encrypted = JSON.stringify((crypt.AESencrypt(password, JSON.stringify(data))));
console.log('encrypted data: ' + encrypted.length + ' ' + encrypted);
var decrypted = JSON.parse(crypt.AESdecrypt(password, JSON.parse(encrypted)));
 console.log('decrypted data: ' + JSON.stringify(decrypted, null, 4));
*/