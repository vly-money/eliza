import {
    Actor,
    HttpAgent,
    // IDL,
    ActorSubclass,
} from '@dfinity/agent';
// import { InterfaceFactory } from '@dfinity/candid/lib/cjs/idl';

// Canister ID
const canisterId = 'spdsf-5yaaa-aaaam-adcnq-cai';
import { idlFactory } from "./icrc1_ledger_canister_backend.ts";
import { Principal } from '@dfinity/principal';


// Initialize an agent to interact with the canister
const agent = new HttpAgent({
    host: 'https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io', // Ensure this matches the network you're interacting with
});

// Uncomment this line if you are using a local replica
agent.fetchRootKey();

// Create an actor with the specified canister ID and IDL
const canisterActor: ActorSubclass = Actor.createActor(idlFactory as any, {
    agent,
    canisterId,
});

export async function check_allowance(handler_account: string, user_account: string) {
    try {
      const handler_account_principal = Principal.fromText(handler_account);
      const user_account_principal = Principal.fromText(user_account);

      const allowance_data = await canisterActor.icrc2_allowance({
        account: { owner: user_account_principal, subaccount: [] },
        spender: { owner: handler_account_principal, subaccount: [] }
      });
      console.log(`Allowance of ${user_account} are: ${JSON.stringify(allowance_data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )}`);
       return allowance_data;
    } catch (error) {
      console.error("Error fetching balance:", error);
      throw error;
    }
  }

// const HandlerAccount = "xij6f-56o6u-xqu76-72jah-hhh3v-aeez2-za224-m3h4m-2mmc5-4jczg-nqe";
// const UserAccount = "2korn-4ayqs-claq2-n7i4i-6gjxc-dej5x-do2cv-jy32n-5225d-pt5nw-7qe";
// check_allowance(HandlerAccount, UserAccount);
