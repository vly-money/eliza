import {
    Actor,
    HttpAgent,
    // IDL,
    ActorSubclass,
} from '@dfinity/agent';
// import { InterfaceFactory } from '@dfinity/candid/lib/cjs/idl';
// import { Identity } from '@dfinity/agent';

// Canister ID
const canisterId = 'spdsf-5yaaa-aaaam-adcnq-cai';
import { idlFactory } from "./icrc1_ledger_canister_backend.ts";
import { Principal } from '@dfinity/principal';
import { Ed25519KeyIdentity } from '@dfinity/identity';
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";
// import { IDL, renderValue } from '@dfinity/candid';
// import { Opt } from '@dfinity/candid/lib/cjs/idl';
// import { TransferResult } from './icrc1_ledger_canister_backend.did';

// xij6f-56o6u-xqu76-72jah-hhh3v-aeez2-za224-m3h4m-2mmc5-4jczg-nqe
// The spender's identity_pem
let pem_buffer = Buffer.from([0x99,0x10,0xe4,0x74,0x63,0x9d,0xff,0x36,0x2c,0x95,0x69,0x50,0x25,0x07,0xd8,0x87,0x5c,0xf7,0x5e,0x6b,0x98,0x7f,0x4c,0xdb,0x9c,0x51,0xc9,0x0e,0x67,0x7e,0x31,0x88]);
let identity = Secp256k1KeyIdentity.fromSecretKey(pem_buffer);
// Initialize an agent to interact with the canister
const agent = new HttpAgent({
    identity: identity,
    host: 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io', // Ensure this matches the network you're interacting with
});

// Uncomment this line if you are using a local replica
agent.fetchRootKey();

// Create an actor with the specified canister ID and IDL
const canisterActor: ActorSubclass = Actor.createActor(idlFactory as any, {
    agent,
    canisterId,
});

export async function transferFrom(user_account: string, to_account: string, amount: number) {
  try {
    const user_account_principal = Principal.fromText(user_account);
    const to_account_principal = Principal.fromText(to_account);


      const mintResult = await canisterActor.icrc2_transfer_from({
        spender_subaccount: [],
        created_at_time: [],
        memo: [],
        amount,
        fee: [],
        from: { owner: user_account_principal, subaccount: [] },
        to: { owner: to_account_principal, subaccount: [] }
      });
      console.log(`Successfully Transfer from ${user_account}. The amount is ${amount}. The TransactionID is: ${JSON.stringify(mintResult, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )}`);
      return mintResult;
    } catch (error) {
      console.error("Error fetching balance:", error);
      throw error;
    }
  }


// const HandlerAccount = "xij6f-56o6u-xqu76-72jah-hhh3v-aeez2-za224-m3h4m-2mmc5-4jczg-nqe";
// const UserAccount = "2korn-4ayqs-claq2-n7i4i-6gjxc-dej5x-do2cv-jy32n-5225d-pt5nw-7qe";
// transferFrom(HandlerAccount, UserAccount, 100);

