import BlockHeader from './BlockHeader';
import Utxo from './Utxo';

class Block {
  constructor(blockData) {
    this.index = blockData.index;
    // this.magicNo = '0xD9B4BEF9';
    // this.blocksize = 0;
    // this.nonce = blockData.nonce;
    // this.transactionCounter = blockData.transactions.length;
    this.transactions = blockData.transactions;
    this.timestamp = Date.now();
    this.hash;

    // let blockHeaderData = {
    //   hashPrevBlock: blockData.previousHash,
    //   nonce: this.nonce,
    //   time: blockData.time,
    //   bits: blockData.bits,
    //   hashMerkleRoot: this.calculateMerkle()
    // };
    // this.blockheader = new BlockHeader(blockHeaderData);
  }


  calculateMerkle() {
    let txs = this.transactions.map((tx) => {
      return tx = bitbox.Crypto.createSHA256Hash(`${tx.lockTime}`);
    });
    let data = txs.map(x => new Buffer(x, 'hex'))

    let fastRoot = require('merkle-lib/fastRoot');
    let root = fastRoot(data, (data) => {
      return bitbox.Crypto.createSHA256Hash(data);
    });
    return root.toString('hex');
  }

  mineBlock(difficulty) {
    // while (this.blockheader.hashMerkleRoot.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
    //   this.nonce++;
    //   this.blockheader.hashMerkleRoot = this.calculateMerkle();
    // }
    // console.log("BLOCK MINED: " + this.blockheader.hashMerkleRoot);
    this.hash = bitbox.Crypto.createSHA256Hash(`${Date.now()}`);
  }
}

export default Block;
