import Address from '../models/Address';
import Crypto from './Crypto';

import Bitcoin from 'bitcoinjs-lib';
import BIP39 from 'bip39';
import bchaddr from 'bchaddrjs';
import sb from 'satoshi-bitcoin';
import bitcoinMessage from 'bitcoinjs-message';

class BitcoinCash {
  // Utility class to wrap the following bitcoin related npm packages
  // * https://github.com/bitcoinjs/bitcoinjs-lib
  // * https://github.com/bitcoinjs/bip39
  // * https://github.com/bitcoincashjs/bchaddrjs
  // * https://github.com/dawsbot/satoshi-bitcoin

  // Translate coins to satoshi value
  static toSatoshi(coins) {
    return sb.toSatoshi(coins);
  }

  // Translate satoshi to coin value
  static toBitcoinCash(satoshis) {
    return sb.toBitcoin(satoshis);
  }

  // Translate address from any address format into a specific format.
  static toLegacyAddress(address) {
    return bchaddr.toLegacyAddress(address);
  }

  static toCashAddress(address) {
    return bchaddr.toCashAddress(address);
  }

  // Test for address format.
  static isLegacyAddress(address) {
    return bchaddr.isLegacyAddress(address);
  }

  static isCashAddress(address) {
    return bchaddr.isCashAddress(address);
  }

  // Test for address network.
  static isMainnetAddress(address) {
    return bchaddr.isMainnetAddress(address);
  }

  static isTestnetAddress(address) {
    return bchaddr.isTestnetAddress(address);
  }

  // Test for address type.
  static isP2PKHAddress(address) {
    return bchaddr.isP2PKHAddress(address);
  }

  static isP2SHAddress(address) {
    return bchaddr.isP2SHAddress(address);
  }

  // Detect address format.
  static detectAddressFormat(address) {
    return bchaddr.detectAddressFormat(address);
  }

  // Detect address network.
  static detectAddressNetwork(address) {
    return bchaddr.detectAddressNetwork(address);
  }

  // Detect address type.
  static detectAddressType(address) {
    return bchaddr.detectAddressType(address);
  }

  static entropyToMnemonic(bytes = 16) {
    // Generate cryptographically strong pseudo-random data.
    // The bytes argument is a number indicating the number of bytes to generate.
    // Uses the NodeJS crypto lib. More info: https://nodejs.org/api/crypto.html#crypto_crypto_randombytes_size_callback
    let randomBytes = Crypto.randomBytes(bytes);

    // Create BIP 39 compliant mnemonic w/ entropy
    // Entropy (bits/bytes)	Checksum (bits)	Entropy + checksum (bits)	Mnemonic length (words)
    // 128/16               4               132                       12
    //
    // 160/20               5               165                       15
    //
    // 192/24               6               198                       18
    //
    // 224/28               7               231                       21
    //
    // 256/32               8               264                       24

    return BIP39.entropyToMnemonic(randomBytes);
  }

  static mnemonicToSeed(mnemonic, password = '') {
    // create BIP 39 compliant
    return BIP39.mnemonicToSeed(mnemonic, password);
  }

  static fromSeedBuffer(rootSeed, network = 'bitcoin') {
    return Bitcoin.HDNode.fromSeedBuffer(rootSeed, Bitcoin.networks[network]);
  }

  static fromWIF(privateKeyWIF, network = 'bitcoin') {
    return Bitcoin.ECPair.fromWIF(privateKeyWIF, Bitcoin.networks[network]);
  }

  static ECPair() {
    return Bitcoin.ECPair;
  }

  static address() {
    return Bitcoin.address;
  }

  static script() {
    return Bitcoin.script;
  }

  static transaction() {
    return Bitcoin.Transaction;
  }

  static transactionBuilder(network = 'bitcoin') {
    return new Bitcoin.TransactionBuilder(Bitcoin.networks[network]);
  }

  static fromTransaction() {
    return Bitcoin.TransactionBuilder;
  }


  static createHDWallet(config) {
    // nore info: https://github.com/bitcoinbook/bitcoinbook/blob/develop/ch05.asciidoc

    let mnemonic = config.mnemonic;
    if(config.autogenerateHDMnemonic) {
      // create a random mnemonic w/ user provided entropy size
      mnemonic = BitcoinCash.entropyToMnemonic(config.entropy);
    }

    // create 512 bit HMAC-SHA512 root seed
    let rootSeed = BitcoinCash.mnemonicToSeed(mnemonic, config.password);

    // create master private key
    let masterPrivateKey = BitcoinCash.fromSeedBuffer(rootSeed, config.network);

    let HDPath = `m/${config.HDPath.purpose}/${config.HDPath.coinCode}`

    let accounts = [];

    for (let i = 0; i < config.totalAccounts; i++) {
      // create accounts
      // follow BIP 44 account discovery algo https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki#account-discovery
      let account = masterPrivateKey.derivePath(`${HDPath.replace(/\/$/, "")}/${i}'`);
      let xpriv = account.toBase58();
      let xpub = account.neutered().toBase58();
      let address = masterPrivateKey.derivePath(`${HDPath.replace(/\/$/, "")}/${i}'/${config.HDPath.change}/${config.HDPath.address_index}`);

      accounts.push({
        title: '',
        privateKeyWIF: address.keyPair.toWIF(),
        xpriv: xpriv,
        xpub: xpub,
        index: i
      });
      // addresses.push(new Address(BitcoinCash.toCashAddress(account.derive(i).getAddress()), account.derive(i).keyPair.toWIF()));
    };

    return [rootSeed, masterPrivateKey, mnemonic, config.HDPath, accounts];
  }

  static signMessage(message, privateKeyWIF) {

    let keyPair;
    let errorMsg = '';
    try {
      keyPair = BitcoinCash.fromWIF(privateKeyWIF);
    } catch (e) {
      errorMsg = e.message;
    }

    if(errorMsg !== '') {
      return errorMsg;
    }

    let privateKey = keyPair.d.toBuffer(32);
    let signature = BitcoinCash.sign(message, privateKey, keyPair);
    let signature1 = signature.toString('base64')
    return signature1;
  }

  static sign(message, privateKey, keyPair) {
    return bitcoinMessage.sign(message, privateKey, keyPair.compressed);
  }

  static verifyMessage(message, address, signature) {
    return bitcoinMessage.verify(message, address, signature);
  }

  static returnPrivateKeyWIF(pubAddress, addresses) {
    let privateKeyWIF;
    let errorMsg = '';
    try {
      addresses.forEach((address, index) => {
        if(BitcoinCash.toLegacyAddress(pubAddress) === BitcoinCash.fromWIF(address.privateKeyWIF).getAddress()) {
          privateKeyWIF = address.privateKeyWIF;
        }
      });
    } catch (e) {
      errorMsg = e.message;
    }

    if(errorMsg !== '') {
      return errorMsg;
    } else {
      return privateKeyWIF;
    }
  }

  static createMultiSig(nrequired, keys, addresses, wallet) {
    let keyPairs = [];
    let pubKeys = [];
    keys.forEach((key, index) => {
      if(key.toString('hex').length === 66) {
        pubKeys.push(key);
      } else {
        let privkeyWIF = BitcoinCash.returnPrivateKeyWIF(key, addresses);
        keyPairs.push(BitcoinCash.fromWIF(privkeyWIF, wallet.network))
      }
    })

    keyPairs.forEach((key, index) => {
      pubKeys.push(key.getPublicKeyBuffer());
    })
    pubKeys.map((hex) => { return Buffer.from(hex, 'hex') })

    let redeemScript = Bitcoin.script.multisig.output.encode(nrequired, pubKeys)
    let scriptPubKey = Bitcoin.script.scriptHash.output.encode(Bitcoin.crypto.hash160(redeemScript))
    let address = Bitcoin.address.fromOutputScript(scriptPubKey)

    return {
      address: address,
      redeemScript: redeemScript
    };
  }
}

export default BitcoinCash;
