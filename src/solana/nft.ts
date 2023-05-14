import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js';
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile, toBigNumber } from '@metaplex-foundation/js';
import * as fs from 'fs';

import 'dotenv/config';
import base58 from 'bs58';

const connection = new Connection(clusterApiUrl('devnet'));
if (!process.env.SOLANA) throw new Error('PLEASE SETUP ENV FOR SOLANA');
const wallet = Keypair.fromSecretKey(base58.decode(process.env.SOLANA));
console.log(wallet.publicKey.toBase58());

const METPLEX = Metaplex.make(connection)
  .use(keypairIdentity(wallet))
  .use(
    bundlrStorage({
      address: 'https://devnet.bundlr.network',
      providerUrl: clusterApiUrl('devnet'),
      timeout: 60000,
    }),
  );

const nftConfig = {
  uploadPath: '/Users/mohan/Desktop/personal/solana-nft/src/solana/uploads/',
  imgFileName: 'image.png',
  imgType: 'image/png',
  imgName: 'David Billa',
  description: 'Motion Poster OF billa',
  attributes: [
    { trait_type: 'Name', value: 'Ajith' },
    { trait_type: 'Type', value: 'Gangster' },
    { trait_type: 'Background', value: ' Dark' },
  ],
  sellerFeeBasisPoints: 500, //500 bp = 5%
  symbol: 'AK',
  creators: [{ address: wallet.publicKey, share: 100 }],
};

export const createNft = async () => {
  const _uploadImage = await uploadImage(nftConfig.uploadPath, nftConfig.imgFileName);
  console.log('image uri', _uploadImage);
  const _uploadMetadata = await uploadMetaData(
    _uploadImage,
    nftConfig.imgType,
    nftConfig.imgName,
    nftConfig.description,
    nftConfig.attributes,
  );
  console.log('uri', _uploadMetadata);
  await mintNft(
    _uploadMetadata,
    nftConfig.imgName,
    nftConfig.sellerFeeBasisPoints,
    nftConfig.symbol,
    nftConfig.creators,
  );
};

const uploadImage = async (path: string, name: string) => {
  const imgBuffer = fs.readFileSync(path + name);
  const imgMetaplexFile = toMetaplexFile(imgBuffer, name);
  const imgUri = await METPLEX.storage().upload(imgMetaplexFile);
  return imgUri;
};

const uploadMetaData = async (
  imgUri: string,
  imgType: string,
  nftName: string,
  description: string,
  attributes: { trait_type: string; value: string }[],
) => {
  const { uri } = await METPLEX.nfts().uploadMetadata({
    name: nftName,
    description: description,
    image: imgUri,
    attributes: attributes,
    properties: {
      files: [
        {
          type: imgType,
          uri: imgUri,
        },
      ],
    },
  });
  return uri;
};

const mintNft = async (
  metadataUri: string,
  name: string,
  sellerFee: number,
  symbol: string,
  creators: { address: PublicKey; share: number }[],
) => {
  const { nft } = await METPLEX.nfts().create({
    uri: metadataUri,
    name: name,
    sellerFeeBasisPoints: sellerFee,
    symbol: symbol,
    creators: creators,
    isMutable: false,
  });
  console.log(`   Success!🎉`);
  console.log(`   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
};
