import { composeContext, elizaLogger, generateObjectDeprecated, ModelClass } from "@ai16z/eliza";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    Plugin,
    State,
} from "@ai16z/eliza";

const pumpfunTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
        "twitter": "username",
        "chain": "solana",
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract or generate (come up with if not included) the following information about the requested token creation:
- twitter: twitter username or userhandle
- chain: blockchain type only includes icp, eth, solana, doge


Respond with a JSON markdown block containing only the extracted values.`;

const fetchTwitterWallet: Action = {
    name: "FETCH_TWITTER_USER_MAPPING",
    similes: [
        "GET_USER_MAPPING",
        "CHECK_USER_MAPPING",
        "FIND_USER_MAPPING",
        "LOOKUP_USER_MAPPING",
    ],
    description: "Fetch Twitter user's USER_MAPPING from VLY Money API.",
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
        // const pumpContext = composeContext({
        //     state,
        //     template: pumpfunTemplate,
        // });

        // const content = await generateObjectDeprecated({
        //     runtime,
        //     context: pumpContext,
        //     modelClass: ModelClass.LARGE,
        // });

        // elizaLogger.log("content", JSON.stringify);

            const secretToken = process.env.VLY_MONEY_API_KEY;
            const url = 'https://service.vly.money/api/third_party/user_mapping';

            const params = new URLSearchParams({
                chain: 'eth',
                name: 'CMarshal247',
                scope: 'twitter'
            });

            elizaLogger.log("Fetching wallet address from VLY Money API");
            const response = await fetch(`${url}?${params}`, {
                method: 'GET',
                headers: {
                    'secret-token': secretToken
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            elizaLogger.log("Successfully fetched wallet address from VLY Money");

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
                                text: data,
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
                content: { text: "Get crypto wallet address for Twitter user CMarshal247" },
            },
            {
                user: "{{agentName}}",
                content: {
                    text: "Here's the wallet address from VLY Money",
                    action: "FETCH_TWITTER_USER_WALLET",
                },
            },
        ],
    ],
} as Action;

export const vlyMoneyPlugin: Plugin = {
    name: "vlyMoney",
    description: "Interact with VLY Money API to fetch crypto wallet addresses for Twitter users",
    actions: [fetchTwitterWallet],
    evaluators: [],
    providers: [],
};