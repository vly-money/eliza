import { composeContext, elizaLogger, generateObjectDEPRECATED, ModelClass  } from "@ai16z/eliza";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@ai16z/eliza";
import { transferSOL } from "./util";
import { check_allowance } from "./checkAllowance";
import { transferFrom } from "./transfer";
const pumpfunTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
        "twitter": "username",
        "amount": "0.01",
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract or generate (come up with if not included) the following information about the requested token creation:
- twitter: twitter username to transfer to, null if not provided
- amount: how many tokens to transfer, 0 if not provided


Respond with a JSON markdown block containing only the extracted values.`;

const fetchVlyWalletAddress: Action = {
    name: "SEND_LIKE_TOKEN",
    similes: [
        "HELP_ME_SEND_LIKE_TOKEN",
        "PLEASE_TIP_LIKE_TOKEN_TO",
        "HELP_ME_SEND_LIKE_TOKEN_TO",
        "HELP_ME_SEND_LIKE_TOKEN_TO_TWITTER_USER",
        "SEND_LIKE_TOKEN_TO_TWITTER_USER",
    ],
    description: "send a specific amount of like token to other twitter users when being asked to",
    validate: async (runtime: IAgentRuntime, _message: Memory) => {
        // Validate if secret token is configured
        elizaLogger.log("process.env.VLY_MONEY_API_KEY", process.env.VLY_MONEY_API_KEY);
        return !!process.env.VLY_MONEY_API_KEY;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        elizaLogger.log("Composing state for message:", JSON.stringify(message));
        state = (await runtime.composeState(message)) as State;
        const userId = runtime.agentId;

        try {
             // Generate structured content from natural language
        const pumpContext = composeContext({
            state,
            template: pumpfunTemplate,
        });

        const content = await generateObjectDEPRECATED({
            runtime,
            context: pumpContext,
            modelClass: ModelClass.LARGE,
        });

        elizaLogger.log("[Parsed content]", JSON.stringify(content));
        if(!content.twitter || !content.amount) {
            // throw new Error("Twitter username or amount is not provided");
            elizaLogger.warn("Twitter username or amount is not provided");
            return;
        }

        // elizaLogger.log("getAccountById(message.userId)", message.userId);
        const user = await runtime.databaseAdapter.getAccountById(message.userId);
        elizaLogger.log("user", JSON.stringify(user));
        // {"id":"a1334d38-d791-0d79-b6df-f26ab095f509","createdAt":"2024-12-17 17:03:21","name":"","username":"tracyhan0812","email":"twitter","avatarUrl":null,"details":{"summary":""}}

            // const secretToken = process.env.VLY_MONEY_API_KEY;
            // const url = 'https://service.vly.money/api/third_party/user_mapping';

            // const params = new URLSearchParams({
            //     chain: 'icp',
            //     name: user.username,
            //     scope: 'twitter'
            // });

            // elizaLogger.log("Fetching wallet address from VLY Money API: ", user.username);
            // const response = await fetch(`${url}?${params}`, {
            //     method: 'GET',
            //     headers: {
            //         'secret-token': secretToken
            //     }
            // });

            // if (!response.ok) {
            //     throw new Error(`HTTP error! status: ${response.status}`);
            // }

            // const data = await response.json();
            // const fromAddress = data.data.address;

            const fromAddress = await getVlyWalletAddress(user.username);

            elizaLogger.log("1. from wallet address from VLY API: ",JSON.stringify(fromAddress));

            const toAddress = await getVlyWalletAddress(content.twitter);
            elizaLogger.log("2. to wallet address from VLY API: ",JSON.stringify(toAddress));

            const allowance = await check_allowance(
                "xij6f-56o6u-xqu76-72jah-hhh3v-aeez2-za224-m3h4m-2mmc5-4jczg-nqe",
                 "2korn-4ayqs-claq2-n7i4i-6gjxc-dej5x-do2cv-jy32n-5225d-pt5nw-7qe");
            elizaLogger.log("allowance:", JSON.stringify(allowance,
                (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
            ));

            const amount = Number(content.amount) * 1_000_000; // 结果: 30000

            await transferFrom(
                "2korn-4ayqs-claq2-n7i4i-6gjxc-dej5x-do2cv-jy32n-5225d-pt5nw-7qe",
                toAddress, amount);

            elizaLogger.log("Successfully transferred LIKE token to wallet address: ", toAddress);

            if(!callback) {
                elizaLogger.log("No Callback.");
            } else {
                callback(
                    {
                        text: "Successfully fetched Twitter user's wallet address",
                        attachments: [
                            {
                                id: crypto.randomUUID(),
                                title: "Twitter User's Crypto Wallet",
                                source: "vlyMoney",
                                description: "Crypto wallet address for Twitter user",
                                "url": "https://vly.money/",
                                text: toAddress,
                            },
                        ],
                    },
                    []
                );
            }
        } catch (error) {
            elizaLogger.error("Failed to fetch from VLY Money:", error);
            callback({
                text: "Failed to fetch wallet address: " + error.message,
                error: true,
            });
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "what makes solana blockchain unique?" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Solana blockchain is unique because it has a high throughput and low cost. Since you mentioned it, I'm going to tip you 0.001 SOL.",
                    action: "TIP_SOLANA_TOKEN",
                },
            },
        ],
    ],
} as Action;

async function getVlyWalletAddress(username: string) {
    const secretToken = process.env.VLY_MONEY_API_KEY;
    const url = 'https://service.vly.money/api/third_party/user_mapping';

    const params = new URLSearchParams({
        chain: 'icp',
        name: username,
        scope: 'twitter'
    });
    const response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
            'secret-token': secretToken
        }
    });

    const data = await response.json();
    elizaLogger.log("response", JSON.stringify(data));
    return data.data.address;
}
export const vlyMoneyPlugin: Plugin = {
    name: "vlyMoney",
    description: "distribute 0.001 solana token to the user when talking about solana blockchain topic",
    actions: [fetchVlyWalletAddress],
    evaluators: [],
    providers: [],
};
