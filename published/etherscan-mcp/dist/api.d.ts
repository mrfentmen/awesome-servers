export declare class EtherscanError extends Error {
    constructor(message: string);
}
export declare function errorMessage(e: unknown): string;
export declare function getBalance(address: string, chainId?: string): Promise<string>;
export declare function getTransactions(address: string, chainId?: string): Promise<string>;
export declare function getTokenTransfers(address: string, chainId?: string): Promise<string>;
export declare function txStatus(txhash: string, chainId?: string): Promise<string>;
export declare function contractAbi(address: string, chainId?: string): Promise<string>;
export declare function contractSource(address: string, chainId?: string): Promise<string>;
export declare function tokenBalance(contract: string, address: string, chainId?: string): Promise<string>;
export declare function gasOracle(chainId?: string): Promise<string>;
export declare function ethPrice(chainId?: string): Promise<string>;
export declare function blockNumber(chainId?: string): Promise<string>;
export interface InternalTransactionsArgs {
    address: string;
    chain_id?: string;
    start_block?: number;
    end_block?: number;
    page?: number;
    offset?: number;
    sort?: string;
}
/**
 * Value that moved through contract-to-contract calls. The existing transactions
 * tool only sees transactions where the address is the from or the to, so any
 * ETH that passed through a router, a proxy or a vault is invisible to it, which
 * is exactly why an address balance often refuses to reconcile.
 */
export declare function internalTransactions(args: InternalTransactionsArgs): Promise<string>;
export interface EventLogsArgs {
    address?: string;
    topic0?: string;
    topic1?: string;
    topic2?: string;
    from_block: number;
    to_block?: number;
    chain_id?: string;
    page?: number;
    offset?: number;
}
/** Raw event logs by address and topic, with Transfer and Approval decoded. */
export declare function eventLogs(args: EventLogsArgs): Promise<string>;
export interface ContractStateReadArgs {
    contract: string;
    function?: string;
    args?: string;
    chain_id?: string;
    block?: string;
}
/** Reads live contract state with eth_call, which costs nothing and sends no transaction. */
export declare function contractStateRead(args: ContractStateReadArgs): Promise<string>;
